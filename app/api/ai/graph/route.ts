export const runtime = "nodejs"

import { runGuarded } from "@/lib/ai/graph/guarded"

function disabled() {
  return process.env.AI_GRAPH_ENABLE !== "true"
}

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
