"use client"

import { useSession, signOut } from "next-auth/react"
import { useState, useEffect } from "react"

export default function HeaderUserMenu() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const [initial, setInitial] = useState("U")

  useEffect(() => {
    if (session?.user?.name) {
      setInitial(session.user.name[0]?.toUpperCase() || "U")
    }
  }, [session])

  if (!session?.user) return null

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center h-8 w-8 rounded-full bg-kings-red/10 text-kings-red font-semibold uppercase border border-gray-300 hover:bg-kings-red/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-kings-red/40"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {initial}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-md z-50"
        >
          <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
            {session.user.name?.split(" ")[0] || "User"}
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
