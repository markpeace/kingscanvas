"use client"

import { signIn } from "next-auth/react"
import { Button } from "@/components/ui"

export default function SignInButton({ label = "Sign in with Google" }: { label?: string }) {
  return (
    <Button
      onClick={() => signIn("google", { callbackUrl: "/" })}
      aria-label="Sign in with Google"
    >
      {label}
    </Button>
  )
}
