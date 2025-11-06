import { getServerSession } from "next-auth"
import { authOptions } from "./config"
import { redirect } from "next/navigation"

export async function getSession() {
  return getServerSession(authOptions)
}

// Guard helper for server components/route handlers
export async function requireAuth(redirectTo: string = "/login") {
  const session = await getServerSession(authOptions)
  if (!session) redirect(redirectTo)
  return session
}
