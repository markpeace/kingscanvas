"use client"

import { useSession } from "next-auth/react"
import { Button, Card, CardContent } from "@/components/ui"
import SignOutButton from "./SignOutButton"

export default function UserMenu() {
  const { data: session, status } = useSession()
  if (status !== "authenticated") return null

  const name = session.user?.name ?? "Account"
  const email = session.user?.email ?? ""
  const image = session.user?.image

  return (
    <div className="flex items-center gap-2">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="h-8 w-8 rounded-full border border-zinc-300 dark:border-zinc-700" />
      ) : null}
      <div className="hidden sm:block text-sm">
        <div className="font-medium">{name}</div>
        <div className="text-zinc-500 dark:text-zinc-400 text-xs">{email}</div>
      </div>
      <SignOutButton />
    </div>
  )
}
