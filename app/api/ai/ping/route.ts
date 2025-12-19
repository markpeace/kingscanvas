export const runtime = "nodejs"

import { runPing } from "@/lib/ai/graph/ping"
import { getChatModel, resolveModelMode } from "@/lib/ai/client"
import { IterableReadableStream } from "@langchain/core/utils/stream"

function isDisabled() {
  return process.env.AI_ENABLE === "false"
}

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

function extractChunkText(chunk: unknown) {
  return typeof (chunk as any) === "string"
    ? (chunk as any)
    : Array.isArray((chunk as any)?.content)
      ? (chunk as any).content.map((c: any) => (typeof c?.text === "string" ? c.text : "")).join("")
      : (chunk as any)?.content ?? ""
}

function prefersStreaming(req: Request, flag?: unknown) {
  if (typeof flag === "boolean") return flag
  if (typeof flag === "string") return flag === "1" || flag.toLowerCase() === "true"

  const accept = (req.headers.get("accept") || "").toLowerCase()
  return accept.includes("text/event-stream") || accept.includes("text/plain") || accept.includes("application/x-ndjson")
}

async function streamPingResponse(q: string, mode: ReturnType<typeof resolveModelMode>) {
  const encoder = new TextEncoder()
  const model = getChatModel({ mode })
  const stream = await model.stream(q)

  const readable = IterableReadableStream.fromAsyncGenerator((async function* () {
    for await (const chunk of stream) {
      const text = extractChunkText(chunk)
      if (text) yield encoder.encode(text)
    }
  })())

  return new Response(readable, {
    status: 200,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store"
    }
  })
}

export async function GET(req: Request) {
  try {
    if (isDisabled()) {
      return new Response(JSON.stringify({ ok: false, error: "AI disabled", code: "DISABLED" }), { status: 503, headers: { "content-type": "application/json" } })
    }
    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q") || "Say hello briefly."
    const mode = resolveModelMode(searchParams.get("mode"))

    if (prefersStreaming(req, searchParams.get("stream"))) {
      try {
        return await streamPingResponse(q, mode)
      } catch (streamErr) {
        console.warn("[ai-ping] streaming unavailable; falling back to buffered response", streamErr)
      }
    }

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
    const mode = resolveModelMode(body?.mode)

    if (prefersStreaming(req, body?.stream)) {
      try {
        return await streamPingResponse(q, mode)
      } catch (streamErr) {
        console.warn("[ai-ping] streaming unavailable; falling back to buffered response", streamErr)
      }
    }

    const output = await runPing(q, mode)
    return new Response(JSON.stringify({ ok: true, data: { output } }), { status: 200, headers: { "content-type": "application/json" } })
  } catch (err) {
    const { payload, status } = errPayload(err)
    return new Response(JSON.stringify(payload), { status, headers: { "content-type": "application/json" } })
  }
}
