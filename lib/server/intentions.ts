"use server"

import type { NextApiRequest, NextApiResponse } from "next"
import { getServerSession } from "next-auth"

import { authOptions, createTestSession, isProd } from "@/lib/auth/config"
import { debug } from "@/lib/debug"
import { getUserIntentions, saveUserIntentions } from "@/lib/userData"

export type IntentionsPayload = {
  intentions?: unknown[]
  [key: string]: unknown
}

export type IntentionsDocument = Awaited<ReturnType<typeof getUserIntentions>>

export type ResolveIntentionsContext =
  | { kind: "pages"; req: NextApiRequest; res: NextApiResponse }
  | { kind: "app" }

export async function resolveIntentionsUser(context?: ResolveIntentionsContext) {
  const session = isProd
    ? context?.kind === "pages"
      ? await getServerSession(context.req, context.res, authOptions)
      : await getServerSession(authOptions)
    : createTestSession()

  const email = session?.user?.email ?? null

  if (!email) {
    debug.error("Intentions API: unauthenticated request")
  }

  return email
}

export async function loadUserIntentions(user: string) {
  return getUserIntentions(user)
}

export async function saveUserIntentionsForUser(user: string, intentions: unknown[]) {
  return saveUserIntentions(user, { intentions })
}
