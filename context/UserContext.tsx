"use client"

import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react"
import { useSession } from "next-auth/react"
import { debugLog } from "@/lib/debug/log"

type User = {
  name?: string | null
  email?: string | null
  image?: string | null
}

type UserContextType = {
  user: User | null
  status: "loading" | "authenticated" | "unauthenticated"
}

const UserContext = createContext<UserContextType | undefined>(undefined)

function sanitizeUser(value: unknown): User | null {
  if (!value || typeof value !== "object") return null
  const record = value as Record<string, unknown>
  return {
    email: typeof record.email === "string" ? record.email : null,
    name: typeof record.name === "string" ? record.name : null,
    image: typeof record.image === "string" ? record.image : null
  }
}

export function UserProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const user = session?.user ?? null

  const safeUser = useMemo(() => {
    return sanitizeUser(user)
  }, [user?.email, user?.image, user?.name])

  useEffect(() => {
    debugLog(
      "AuthSessionSnapshot",
      {
        status,
        user: safeUser,
        expires: session?.expires ?? null
      },
      { level: "debug", channel: "auth" }
    )
  }, [safeUser, status, session?.expires])

  useEffect(() => {
    let cancelled = false
    const identity = safeUser?.email ?? null

    async function probeAuthEndpoint() {
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" })
        const contentType = response.headers.get("content-type") ?? ""
        let body: unknown = null

        if (contentType.includes("application/json")) {
          try {
            body = await response.json()
          } catch {
            body = null
          }
        }

        if (cancelled) return

        const payload = {
          identity,
          httpStatus: response.status,
          ok: response.ok,
          session:
            body && typeof body === "object" && body !== null
              ? {
                  status: typeof (body as { status?: unknown }).status === "string" ? (body as { status?: string }).status : null,
                  user: sanitizeUser((body as { user?: unknown }).user),
                  expires:
                    typeof (body as { expires?: unknown }).expires === "string"
                      ? (body as { expires?: string }).expires
                      : null
                }
              : null,
          raw: !response.ok ? body : null
        }

        debugLog("AuthSessionEndpoint", payload, { level: "debug", channel: "auth" })
      } catch (error) {
        if (cancelled) return
        debugLog(
          "AuthSessionEndpoint",
          { identity, error: error instanceof Error ? error.message : String(error) },
          { level: "error", channel: "auth" }
        )
      }
    }

    probeAuthEndpoint()

    return () => {
      cancelled = true
    }
  }, [safeUser])

  return <UserContext.Provider value={{ user, status }}>{children}</UserContext.Provider>
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
