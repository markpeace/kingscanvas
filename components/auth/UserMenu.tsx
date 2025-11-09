"use client"

import { useUser } from "@/context/UserContext"
import SignOutButton from "./SignOutButton"

export default function UserMenu() {
  const { user, status } = useUser()
  if (status !== "authenticated" || !user) return null

  const name = user.name ?? "Account"
  const email = user.email ?? ""
  const image = user.image

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
