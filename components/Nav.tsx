"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect } from "react"
import { debugLog } from "@/lib/debug/log"
import SignInButton from "@/components/auth/SignInButton"
import UserMenu from "@/components/auth/UserMenu"
import { useUser } from "@/context/UserContext"

const links = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/ui-demo", label: "UI Demo" },
  { href: "/forms-demo", label: "Forms Demo" }
]

export default function Nav() {
  const pathname = usePathname()
  const { status } = useUser()

  useEffect(() => {
    debugLog("AuthStatusChange", { status }, { level: "info", channel: "auth" })
  }, [status])

  return (
    <div className="w-full flex items-center justify-between gap-3">
      <nav className="flex gap-2 sm:gap-3 items-center">
        {links.map((l) => {
          const active = pathname === l.href
          return (
            <Link
              key={l.href}
              href={l.href}
              className={[
                "px-3 py-2 sm:px-4 sm:py-2.5 rounded-md text-sm sm:text-base transition-colors select-none",
                active
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              ].join(" ")}
              aria-current={active ? "page" : undefined}
            >
              {l.label}
            </Link>
          )
        })}
        <Link
          href="/login"
          className={[
            "px-3 py-2 sm:px-4 sm:py-2.5 rounded-md text-sm sm:text-base transition-colors select-none",
            pathname === "/login"
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          ].join(" ")}
        >
          Login
        </Link>
      </nav>

      <div className="flex items-center">
        {status === "authenticated" ? <UserMenu /> : <SignInButton label="Sign in" />}
      </div>
    </div>
  )
}
