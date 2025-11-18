import type { NextApiRequest, NextApiResponse } from "next"
import { getServerSession } from "next-auth"

import { authOptions, createTestSession, isProd } from "@/lib/auth/config"
import { debug } from "@/lib/debug"
import { getUserIntentions, saveUserIntentions } from "@/lib/userData"

type IntentionsPayload = {
  intentions?: unknown[]
  [key: string]: unknown
}

type ApiResponse =
  | { ok: true; intentions?: unknown[] }
  | { ok: false; error: string }
  | { error: string }

async function resolveUserEmail(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  const session = isProd ? await getServerSession(req, res, authOptions) : createTestSession()
  const email = session?.user?.email ?? null

  if (!email) {
    debug.error("Intentions API: unauthenticated request")
  }

  return email
}

async function handleSave(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  email: string
) {
  const payload = (req.body || {}) as IntentionsPayload
  const count = Array.isArray(payload.intentions) ? payload.intentions.length : 0

  try {
    await saveUserIntentions(email, payload)
    debug.info("Intentions API: save success", {
      method: req.method,
      userId: email,
      count
    })
    return res.status(200).json({ ok: true })
  } catch (error) {
    debug.error("Intentions API: save failed", {
      method: req.method,
      userId: email,
      error: error instanceof Error ? error.message : String(error)
    })
    return res.status(500).json({ ok: false, error: "Save failed" })
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  const email = await resolveUserEmail(req, res)

  if (!email) {
    return res.status(401).json({ error: "Not authenticated" })
  }

  if (req.method === "GET") {
    try {
      debug.trace("Intentions API: GET", { user: email })
      const data = await getUserIntentions(email)
      debug.info("Intentions API: GET complete", { found: !!data })
      return res.status(200).json(data || { intentions: [] })
    } catch (error) {
      debug.error("Intentions API: server error", {
        message: error instanceof Error ? error.message : String(error)
      })
      return res.status(500).json({ error: "Server error" })
    }
  }

  if (req.method === "POST" || req.method === "PUT") {
    if (req.headers["content-type"]?.includes("application/json") === false) {
      return res.status(400).json({ ok: false, error: "Invalid JSON" })
    }

    return handleSave(req, res, email)
  }

  return res.status(405).json({ error: "Method not allowed" })
}
