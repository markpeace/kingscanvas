"use client"

import { createContext, useContext, useEffect, type ReactNode } from "react"
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

export function UserProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const user = session?.user ?? null

  useEffect(() => {
    debugLog(
      "AuthSessionSnapshot",
      {
        status,
        user: user
          ? {
              email: user.email ?? null,
              name: user.name ?? null,
              image: user.image ?? null
            }
          : null,
        expires: session?.expires ?? null
      },
      { level: "debug", channel: "auth" }
    )
  }, [status, user?.email, user?.name, user?.image, session?.expires])

  return <UserContext.Provider value={{ user, status }}>{children}</UserContext.Provider>
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
