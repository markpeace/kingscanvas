import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"

export async function GET() {
  const session = await getServerSession(authOptions)
  return new Response(JSON.stringify({ authenticated: Boolean(session) }), {
    status: 200,
    headers: { "content-type": "application/json" }
  })
}
