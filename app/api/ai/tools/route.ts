export const runtime = "nodejs"

import { getChatModel, resolveModelMode } from "@/lib/ai/client"
import { findProfilesByNameFragment } from "@/lib/ai/tools/profiles"
import { AIMessage, AIMessageChunk, ToolMessage } from "@langchain/core/messages"
import { IterableReadableStream } from "@langchain/core/utils/stream"

type ToolCall = {
  id: string
  type: "function"
  function: { name: string; arguments: string }
}

function coerceContentToText(value: unknown) {
  return typeof value === "string"
    ? value
    : Array.isArray((value as any)?.content)
      ? (value as any).content.map((c: any) => (typeof c?.text === "string" ? c.text : "")).join("\n")
      : (value as any)?.content ?? ""
}

function prefersStreaming(req: Request, flag?: unknown) {
  if (typeof flag === "boolean") return flag
  if (typeof flag === "string") return flag === "1" || flag.toLowerCase() === "true"

  const accept = (req.headers.get("accept") || "").toLowerCase()
  return accept.includes("text/event-stream") || accept.includes("text/plain") || accept.includes("application/x-ndjson")
}

function extractToolCalls(message: AIMessage | AIMessageChunk | any): ToolCall[] {
  const toolCalls: ToolCall[] =
    (message as any)?.additional_kwargs?.tool_calls ??
    (message as any)?.tool_calls ??
    []

  return Array.isArray(toolCalls) ? toolCalls : []
}

async function executeToolCalls(toolCalls: ToolCall[]) {
  const toolMessages: ToolMessage[] = []
  const rawResults: Record<string, unknown>[] = []

  for (const call of toolCalls) {
    if (call.type !== "function") continue
    const name = call.function?.name
    const argsJson = call.function?.arguments || "{}"
    let args: any = {}
    try { args = JSON.parse(argsJson) } catch {}

    if (name === "profiles_search") {
      const fragment: string = String(args?.fragment || "")
      const limit: number | undefined = typeof args?.limit === "number" ? args.limit : undefined
      console.info("[ai-tools] executing profiles_search tool", {
        toolCallId: call.id,
        limit: limit ?? 5,
        hasFragment: fragment.length > 0
      })
      const result = await findProfilesByNameFragment(fragment, limit ?? 5)
      rawResults.push({ tool: name, args: { fragment, limit: limit ?? 5 }, result })
      toolMessages.push(
        new ToolMessage({
          content: JSON.stringify({ results: result }),
          tool_call_id: call.id
        })
      )
    }
  }

  return { toolMessages, rawResults }
}

async function completeToolRun(model: ReturnType<typeof getChatModel>, first: AIMessage | AIMessageChunk | any) {
  const toolCalls = extractToolCalls(first)
  const toolCallCount = toolCalls.length

  if (toolCallCount === 0) {
    const content = coerceContentToText(first)
    return {
      toolCallCount,
      rawResults: [],
      finalText: String(content || "")
    }
  }

  const { toolMessages, rawResults } = await executeToolCalls(toolCalls)

  const followup = await model.invoke([
    new AIMessage(first as any),
    ...toolMessages
  ])

  const finalText = coerceContentToText(followup)

  return { toolCallCount, rawResults, finalText: String(finalText || "") }
}

function streamFirstTurn(model: ReturnType<typeof getChatModel>, q: string, startedAt: number) {
  const encoder = new TextEncoder()

  return IterableReadableStream.fromAsyncGenerator((async function* () {
    let aggregated: AIMessageChunk | undefined
    const stream = await model.stream(q)

    for await (const chunk of stream) {
      aggregated = aggregated ? aggregated.concat(chunk) : chunk
      const text = coerceContentToText(chunk)
      if (text) yield encoder.encode(text)
    }

    if (!aggregated) return

    const { toolCallCount, rawResults, finalText } = await completeToolRun(model, aggregated)

    if (toolCallCount === 0) {
      console.info("[ai-tools] follow-up skipped; no tool calls proposed", {
        toolCallCount,
        elapsedMs: Date.now() - startedAt
      })
    } else {
      console.info("[ai-tools] follow-up completion executed", {
        toolCallCount,
        toolMessages: rawResults.length,
        elapsedMs: Date.now() - startedAt
      })
    }

    if (finalText) yield encoder.encode(`\n${finalText}`)
    if (rawResults.length > 0) yield encoder.encode(`\n${JSON.stringify({ results: rawResults })}`)
  })())
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const q = (typeof body?.q === "string" && body.q.trim()) || "Find profiles with name fragment 'Ada'."
    const mode = resolveModelMode(body?.mode)
    const startedAt = Date.now()

    // Define OpenAI tool schema (server executes tools explicitly).
    const tools = [
      {
        type: "function",
        function: {
          name: "profiles_search",
          description: "Search user profiles by display name substring",
          parameters: {
            type: "object",
            properties: {
              fragment: { type: "string", description: "Substring to match in displayName" },
              limit: { type: "number", description: "Max results", default: 5 }
            },
            required: ["fragment"]
          }
        }
      }
    ]

    const model = getChatModel({ mode }).bindTools(tools)

    if (prefersStreaming(req, body?.stream)) {
      try {
        const readable = streamFirstTurn(model, q, startedAt)
        return new Response(readable, {
          status: 200,
          headers: {
            "content-type": "text/plain; charset=utf-8",
            "cache-control": "no-store"
          }
        })
      } catch (streamErr) {
        console.warn("[ai-tools] streaming unavailable; falling back to buffered response", streamErr)
      }
    }

    const first = await model.invoke(q)
    const { toolCallCount, rawResults, finalText } = await completeToolRun(model, first)

    if (toolCallCount === 0) {
      console.info("[ai-tools] follow-up skipped; no tool calls proposed", {
        toolCallCount,
        elapsedMs: Date.now() - startedAt
      })
    } else {
      console.info("[ai-tools] follow-up completion executed", {
        toolCallCount,
        toolMessages: rawResults.length,
        elapsedMs: Date.now() - startedAt
      })
    }

    return new Response(JSON.stringify({
      ok: true,
      data: {
        output: String(finalText || ""),
        results: rawResults
      }
    }), {
      status: 200,
      headers: { "content-type": "application/json" }
    })
  } catch (err: any) {
    const msg = err?.message || "internal error"
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { "content-type": "application/json" }
    })
  }
}
