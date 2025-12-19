export const runtime = "nodejs"

import { type ModelMode } from "@/lib/ai/client"
import { runPing } from "@/lib/ai/graph/ping"

function isDisabled() {
  return process.env.AI_ENABLE === "false"
}

const parseMode = (value: unknown): ModelMode =>
  typeof value === "string" && value.toLowerCase() === "quality" ? "quality" : "fast"

function errPayload(err: unknown) {
  // Attempt to extract LangChain/OpenAI error details
  let message = ""
  let status = 500
  let details: any = undefined

  const anyErr = err as any
  if (anyErr?.message && typeof anyErr.message === "string") message = anyErr.message
  if (anyErr?.status && typeof anyErr.status === "number") status = anyErr.status
  if (anyErr?.response) {
    try {
      details = {
        status: anyErr.response.status ?? undefined,
        statusText: anyErr.response.statusText ?? undefined,
        body: typeof anyErr.response.data === "string" ? anyErr.response.data
             : anyErr.response.data ? JSON.stringify(anyErr.response.data).slice(0, 2000)
             : undefined
      }
    } catch {}
  } else if (anyErr?.cause) {
    try {
      details = { cause: String(anyErr.cause).slice(0, 2000) }
    } catch {}
  }

  if (!message) {
    try { message = String(err) } catch { message = "" }
  }

  const code =
    /not.*set/i.test(message) ? "ENV_MISSING" :
    /unauthorized|invalid api key|401/i.test(message) ? "AUTH_FAILED" :
    /model.*not.*found|unsupported|deprecate/i.test(message) ? "MODEL_INVALID" :
    "INTERNAL"

  const payload = { ok: false, error: message || "internal error", code, ...(details ? { details } : {}) }
  return { payload, status }
}

export async function GET(req: Request) {
  try {
    if (isDisabled()) {
      return new Response(JSON.stringify({ ok: false, error: "AI disabled", code: "DISABLED" }), { status: 503, headers: { "content-type": "application/json" } })
    }
    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q") || "Say hello briefly."
    const mode = parseMode(searchParams.get("mode"))
    const output = await runPing(q, mode)
    return new Response(JSON.stringify({ ok: true, data: { output } }), { status: 200, headers: { "content-type": "application/json" } })
  } catch (err) {
    const { payload, status } = errPayload(err)
    return new Response(JSON.stringify(payload), { status, headers: { "content-type": "application/json" } })
  }
}

export async function POST(req: Request) {
  try {
    if (isDisabled()) {
      return new Response(JSON.stringify({ ok: false, error: "AI disabled", code: "DISABLED" }), { status: 503, headers: { "content-type": "application/json" } })
    }
    const body = await req.json().catch(() => ({}))
    const q = typeof body?.q === "string" && body.q.trim().length > 0 ? body.q : "Say hello briefly."
    const mode = parseMode((body as any)?.mode)
    const output = await runPing(q, mode)
    return new Response(JSON.stringify({ ok: true, data: { output } }), { status: 200, headers: { "content-type": "application/json" } })
  } catch (err) {
    const { payload, status } = errPayload(err)
    return new Response(JSON.stringify(payload), { status, headers: { "content-type": "application/json" } })
  }
}
