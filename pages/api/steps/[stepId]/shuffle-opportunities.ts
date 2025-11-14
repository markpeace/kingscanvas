import type { NextApiRequest, NextApiResponse } from "next"
import { getServerSession } from "next-auth"

import { authOptions, createTestSession, isProd } from "@/lib/auth/config"
import { debug } from "@/lib/debug"
import { generateOpportunitiesForStep } from "@/lib/opportunities/generation"
import { getStepForUser } from "@/lib/userData"
import type { Opportunity } from "@/types/canvas"

type ShuffleOpportunitiesResponse =
  | { ok: true; stepId: string; opportunities: Opportunity[] }
  | { ok: false; error: string }

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ShuffleOpportunitiesResponse>,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" })
  }

  const session = isProd ? await getServerSession(req, res, authOptions) : createTestSession()
  const email = session?.user?.email ?? null

  if (!email) {
    debug.error("Shuffle opportunities API: unauthenticated")
    return res.status(401).json({ ok: false, error: "Not authenticated" })
  }

  const stepIdParam = req.query.stepId
  const requestedStepId = typeof stepIdParam === "string" ? stepIdParam : ""

  if (!requestedStepId) {
    debug.error("Shuffle opportunities API: missing step id", {
      user: email,
      hasParam: Boolean(stepIdParam),
    })
    return res.status(400).json({ ok: false, error: "Missing step id" })
  }

  try {
    const step = await getStepForUser(email, requestedStepId)

    if (!step) {
      debug.warn("Shuffle opportunities API: forbidden", { user: email, stepId: requestedStepId })
      return res.status(403).json({ ok: false, error: "Forbidden" })
    }

    const rawStepId = (step as { _id?: unknown })._id
    let canonicalStepId = requestedStepId

    if (rawStepId && typeof rawStepId === "object" && "toHexString" in rawStepId && typeof rawStepId.toHexString === "function") {
      canonicalStepId = rawStepId.toHexString()
    } else if (typeof rawStepId === "string" && rawStepId) {
      canonicalStepId = rawStepId
    }

    debug.info("Shuffle opportunities API: regenerate", { user: email, stepId: canonicalStepId })

    // This endpoint must only be used for real, persisted steps – never ghost suggestions.
    const opportunities = await generateOpportunitiesForStep({ stepId: canonicalStepId, origin: "shuffle" })

    debug.info("Shuffle opportunities API: success", {
      user: email,
      stepId: canonicalStepId,
      count: opportunities.length,
    })

    return res.status(200).json({ ok: true, stepId: canonicalStepId, opportunities })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    debug.error("Shuffle opportunities API: failure", {
      user: email,
      stepId: requestedStepId,
      message,
    })

    return res.status(500).json({ ok: false, error: "Could not generate opportunities" })
  }
}
