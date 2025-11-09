import { getSession } from "@/lib/auth/server"

export async function GET() {
  const session = await getSession()
  return new Response(JSON.stringify({ authenticated: Boolean(session) }), {
    status: 200,
    headers: { "content-type": "application/json" }
  })
}
