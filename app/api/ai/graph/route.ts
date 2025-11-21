export const runtime = "nodejs"

import { runGuarded } from "@/lib/ai/graph/guarded"
import { defaultModel } from "@/lib/ai/client"
import { debugSink } from "@/components/debug/sink"
import { serverDebug } from "@/lib/debug/serverSink"

function disabled() {
  return process.env.AI_GRAPH_ENABLE !== "true"
}

export async function GET(req: Request) {
  serverDebug.push({
    label: "Active LLM model (graph)",
    payload: process.env.LLM,
    channel: "ai",
    level: "info"
  })

  try {
    debugSink.push({
      label: "Active LLM model (graph)",
      payload: process.env.LLM || "gpt-4.2-mini",
      channel: "ai",
      level: "info"
    })

    if (disabled()) {
      return new Response(JSON.stringify({ ok: false, error: "Graph disabled", code: "DISABLED" }), {
        status: 503,
        headers: { "content-type": "application/json" }
      })
    }
    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q") || "Say hello briefly."

    debugSink.push({
      label: "Active LLM model",
      payload: defaultModel,
      channel: "ai",
      level: "info"
    })

    const { output, mode } = await runGuarded(q)
    return new Response(JSON.stringify({ ok: true, data: { output, mode } }), {
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
