"use client"

import { signOut } from "next-auth/react"
import { Button } from "@/components/ui"

export default function SignOutButton({ label = "Sign out" }: { label?: string }) {
  return (
    <Button variant="outline" onClick={() => signOut({ callbackUrl: "/login" })} aria-label="Sign out">
      {label}
    </Button>
  )
}
