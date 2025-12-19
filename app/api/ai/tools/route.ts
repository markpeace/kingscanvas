export const runtime = "nodejs"

import { getChatModel } from "@/lib/ai/client"
import { findProfilesByNameFragment } from "@/lib/ai/tools/profiles"
import { AIMessage, AIMessageChunk, ToolMessage } from "@langchain/core/messages"
import { IterableReadableStream } from "@langchain/core/utils/stream"

type ToolCall = {
  id: string
  type: "function"
  function: { name: string; arguments: string }
}

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

function streamingSupported() {
  return typeof ReadableStream !== "undefined" && typeof TransformStream !== "undefined"
}

function wantsStream(req: Request, toggle?: unknown) {
  if (toggle === true || toggle === "true") return true
  if (toggle === false || toggle === "false") return false
  const { searchParams } = new URL(req.url)
  if (["1", "true"].includes((searchParams.get("stream") || "").toLowerCase())) return true
  const accept = req.headers.get("accept") || ""
  return /text\/event-stream|text\/plain|application\/x-ndjson/i.test(accept)
}

function chunkToText(chunk: any) {
  if (typeof chunk === "string") return chunk
  if (Array.isArray(chunk?.content)) {
    return chunk.content.map((c: any) => (typeof c?.text === "string" ? c.text : "")).join("")
  }
  if (typeof chunk?.content === "string") return chunk.content
  return ""
}

function normalizeToolCalls(raw: any): ToolCall[] {
  if (!Array.isArray(raw)) return []
  return raw.map((call, idx) => {
    const name = call?.function?.name ?? call?.name ?? ""
    const argsValue = call?.function?.arguments ?? call?.args ?? "{}"
    const args =
      typeof argsValue === "string"
        ? argsValue
        : (() => {
            try {
              return JSON.stringify(argsValue)
            } catch {
              return "{}"
            }
          })()
    return {
      id: call?.id || `tool-${idx}`,
      type: "function",
      function: { name, arguments: args }
    }
  })
}

async function executeToolCalls(toolCalls: ToolCall[]) {
  const toolMessages: ToolMessage[] = []
  const rawResults: Record<string, unknown>[] = []

  for (const call of toolCalls) {
    if (call.type !== "function") continue
    const name = call.function?.name
    const argsJson = call.function?.arguments || "{}"
    let args: any = {}
    try {
      args = JSON.parse(argsJson)
    } catch {}

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

function messageToText(message: any) {
  if (typeof message === "string") return message
  if (Array.isArray(message?.content)) {
    return message.content.map((c: any) => (typeof c?.text === "string" ? c.text : "")).join("\n")
  }
  if (typeof message?.content === "string") return message.content
  return ""
}

function toAIMessage(message: AIMessage | AIMessageChunk | any) {
  if (message instanceof AIMessage) return message
  return new AIMessage({
    content: message?.content ?? "",
    additional_kwargs: message?.additional_kwargs ?? {},
    tool_calls: message?.tool_calls ?? [],
    invalid_tool_calls: message?.invalid_tool_calls ?? [],
    name: message?.name,
    response_metadata: message?.response_metadata,
    id: message?.id
  })
}

async function streamFirstTurn(model: any, q: string, controller: ReadableStreamDefaultController<Uint8Array>) {
  const encoder = new TextEncoder()
  const stream = await model.stream(q)
  let combined: AIMessageChunk | null = null

  const readable = IterableReadableStream.fromAsyncGenerator(stream).pipeThrough(
    new TransformStream({
      transform(chunk, innerController) {
        const text = chunkToText(chunk)
        if (text) {
          innerController.enqueue(encoder.encode(JSON.stringify({ type: "first", chunk: text }) + "\n"))
        }
        combined = combined ? combined.concat(chunk as AIMessageChunk) : (chunk as AIMessageChunk)
      }
    })
  )

  for await (const data of readable) {
    controller.enqueue(data)
  }

  return combined
}

async function bufferedToolRun(q: string, startedAt: number) {
  const model = getChatModel().bindTools(tools)

  const first = await model.invoke(q)

  const toolCalls = normalizeToolCalls(
    (first as any)?.additional_kwargs?.tool_calls ??
      (first as any)?.tool_calls ??
      []
  )
  const toolCallCount = Array.isArray(toolCalls) ? toolCalls.length : 0

  // If no tool calls, just return model output.
  if (!Array.isArray(toolCalls) || toolCalls.length === 0) {
    const content = messageToText(first)

    console.info("[ai-tools] follow-up skipped; no tool calls proposed", {
      toolCallCount,
      elapsedMs: Date.now() - startedAt
    })
    return new Response(JSON.stringify({ ok: true, data: { output: String(content || "") } }), {
      status: 200,
      headers: { "content-type": "application/json" }
    })
  }

  const { toolMessages, rawResults } = await executeToolCalls(toolCalls)

  const followup = await model.invoke([
    toAIMessage(first),  // preserve the original AI tool-call message
    ...toolMessages
  ])

  console.info("[ai-tools] follow-up completion executed", {
    toolCallCount,
    toolMessages: toolMessages.length,
    elapsedMs: Date.now() - startedAt
  })

  const finalText = messageToText(followup)

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
}

async function streamingToolRun(q: string, startedAt: number) {
  const model = getChatModel().bindTools(tools)
  const encoder = new TextEncoder()

  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const firstChunk = await streamFirstTurn(model, q, controller)
        const firstMessage = firstChunk ? toAIMessage(firstChunk) : await model.invoke(q)
        const toolCalls = normalizeToolCalls(
          (firstMessage as any)?.additional_kwargs?.tool_calls ??
            (firstMessage as any)?.tool_calls ??
            []
        )

        if (!toolCalls.length) {
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: "final",
                output: String(messageToText(firstMessage) || ""),
                results: []
              }) + "\n"
            )
          )
          console.info("[ai-tools] streaming mode; no tool calls proposed", { elapsedMs: Date.now() - startedAt })
          controller.close()
          return
        }

        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              type: "tool_plan",
              toolCallCount: toolCalls.length
            }) + "\n"
          )
        )

        const { toolMessages, rawResults } = await executeToolCalls(toolCalls)
        const followup = await model.invoke([firstMessage, ...toolMessages])
        const finalText = messageToText(followup)

        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              type: "final",
              output: String(finalText || ""),
              results: rawResults
            }) + "\n"
          )
        )

        console.info("[ai-tools] streaming follow-up completion executed", {
          toolCallCount: toolCalls.length,
          toolMessages: toolMessages.length,
          elapsedMs: Date.now() - startedAt
        })

        controller.close()
      } catch (err) {
        controller.error(err)
      }
    }
  })

  return new Response(readable, {
    status: 200,
    headers: {
      "content-type": "application/x-ndjson",
      "cache-control": "no-store"
    }
  })
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const q = (typeof body?.q === "string" && body.q.trim()) || "Find profiles with name fragment 'Ada'."
    const startedAt = Date.now()

    if (wantsStream(req, body?.stream) && streamingSupported()) {
      try {
        return await streamingToolRun(q, startedAt)
      } catch (streamErr) {
        console.warn("[ai-tools] streaming unavailable, falling back to buffered response", { error: (streamErr as Error)?.message })
      }
    }

    return await bufferedToolRun(q, startedAt)
  } catch (err: any) {
    const msg = err?.message || "internal error"
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { "content-type": "application/json" }
    })
  }
}
