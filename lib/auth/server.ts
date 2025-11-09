import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"

import { authOptions, createTestSession, isProd } from "./config"

export async function getSession() {
  if (!isProd) {
    return createTestSession()
  }

  return getServerSession(authOptions)
}

// Guard helper for server components/route handlers
export async function requireAuth(redirectTo: string = "/login") {
  if (!isProd) {
    return createTestSession()
  }

  const session = await getServerSession(authOptions)
  if (!session) redirect(redirectTo)
  return session
}
