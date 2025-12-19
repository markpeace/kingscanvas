export const runtime = "nodejs"

import { type ModelMode } from "@/lib/ai/client"
import { runGuarded } from "@/lib/ai/graph/guarded"

function disabled() {
  return process.env.AI_GRAPH_ENABLE !== "true"
}

const parseMode = (value: unknown): ModelMode =>
  typeof value === "string" && value.toLowerCase() === "quality" ? "quality" : "fast"

export async function GET(req: Request) {
  try {
    if (disabled()) {
      return new Response(JSON.stringify({ ok: false, error: "Graph disabled", code: "DISABLED" }), {
        status: 503,
        headers: { "content-type": "application/json" }
      })
    }
    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q") || "Say hello briefly."
    const modelMode = parseMode(searchParams.get("mode"))
    const { output, mode } = await runGuarded(q, modelMode)
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
