import { ping } from "@/lib/db/mongo"

export async function GET() {
  try {
    const status = await ping()
    return new Response(JSON.stringify(status), {
      status: 200,
      headers: { "content-type": "application/json" }
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: err?.message ?? "unknown error" }), {
      status: 500,
      headers: { "content-type": "application/json" }
    })
  }
}
