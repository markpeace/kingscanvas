export const runtime = "nodejs"

import { getChatModel, defaultModel } from "@/lib/ai/client"
import { debugSink } from "@/components/debug/sink"
import { serverDebug } from "@/lib/debug/serverSink"

export async function POST(req: Request) {
  serverDebug.push({
    label: "Active LLM model (stream)",
    payload: process.env.LLM,
    channel: "ai",
    level: "info"
  })

  try {
    const body = await req.json().catch(() => ({}))
    const q = (typeof body?.q === "string" && body.q.trim()) || "Stream a short hello."

    const model = getChatModel()

    debugSink.push({
      label: "Active LLM model",
      payload: defaultModel,
      channel: "ai",
      level: "info"
    })
    const stream = await model.stream(q)

    const readable = new ReadableStream({
      async start(controller) {
        const enc = new TextEncoder()
        try {
          for await (const chunk of stream) {
            const text =
              typeof (chunk as any) === "string"
                ? (chunk as any)
                : Array.isArray((chunk as any).content)
                  ? (chunk as any).content.map((c: any) => (typeof c?.text === "string" ? c.text : "")).join("")
                  : (chunk as any).content ?? ""
            if (text) controller.enqueue(enc.encode(text))
          }
        } catch (e) {
          controller.error(e)
          return
        }
        controller.close()
      }
    })

    return new Response(readable, {
      status: 200,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-store"
      }
    })
  } catch (err: any) {
    const msg = err?.message || "internal error"
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { "content-type": "application/json" }
    })
  }
}
