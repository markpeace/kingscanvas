export const runtime = "nodejs"

import { getChatModel } from "@/lib/ai/client"
import { findProfilesByNameFragment } from "@/lib/ai/tools/profiles"
import { AIMessage, ToolMessage } from "@langchain/core/messages"

type ToolCall = {
  id: string
  type: "function"
  function: { name: string; arguments: string }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const q = (typeof body?.q === "string" && body.q.trim()) || "Find profiles with name fragment 'Ada'."

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

    const model = getChatModel().bindTools(tools)

    // Step 1: user → model (tool call proposal)
    const first = await model.invoke(q)

    // If no tool calls, just return model output.
    const toolCalls: ToolCall[] =
      (first as any)?.additional_kwargs?.tool_calls ??
      (first as any)?.tool_calls ??
      []
    if (!Array.isArray(toolCalls) || toolCalls.length === 0) {
      const content =
        typeof (first as any) === "string"
          ? (first as any)
          : Array.isArray((first as any).content)
            ? (first as any).content.map((c: any) => (typeof c?.text === "string" ? c.text : "")).join("\n")
            : (first as any).content ?? ""
      return new Response(JSON.stringify({ ok: true, data: { output: String(content || "") } }), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    }

    // Step 2: execute tools on the server
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

    // Step 3: send AIMessage (with tool calls) + ToolMessage(s) back to the model
    const followup = await model.invoke([
      new AIMessage(first),  // preserve the original AI tool-call message
      ...toolMessages
    ])

    const finalText =
      typeof (followup as any) === "string"
        ? (followup as any)
        : Array.isArray((followup as any).content)
          ? (followup as any).content.map((c: any) => (typeof c?.text === "string" ? c.text : "")).join("\n")
          : (followup as any).content ?? ""

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
