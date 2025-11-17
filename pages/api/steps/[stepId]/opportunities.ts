import type { NextApiRequest, NextApiResponse } from "next"
import { getServerSession } from "next-auth"

import { authOptions, createTestSession, isProd } from "@/lib/auth/config"
import { debug } from "@/lib/debug"
import { findStepById, generateOpportunitiesForStep } from "@/lib/opportunities/generation"
import { getOpportunitiesByStep } from "@/lib/userData"
import type { Opportunity } from "@/types/canvas"

type OpportunitiesResponse =
  | { ok: true; stepId: string; opportunities: Opportunity[] }
  | { ok: false; error: string }

function resolveCanonicalStepId(step: { _id?: unknown; id?: unknown }, fallback: string): string {
  const rawId = step?._id

  if (rawId && typeof rawId === "object" && "toHexString" in rawId && typeof rawId.toHexString === "function") {
    return rawId.toHexString()
  }

  if (typeof rawId === "string" && rawId.trim().length > 0) {
    return rawId
  }

  const candidateId = step?.id
  if (typeof candidateId === "string" && candidateId.trim().length > 0) {
    return candidateId
  }

  return fallback
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<OpportunitiesResponse>) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" })
  }

  const session = isProd ? await getServerSession(req, res, authOptions) : createTestSession()
  const email = session?.user?.email ?? null

  if (!email) {
    debug.error("Opportunities API: unauthenticated")
    return res.status(401).json({ ok: false, error: "Not authenticated" })
  }

  const stepIdParam = req.query.stepId
  const requestedStepId = typeof stepIdParam === "string" ? stepIdParam : ""

  if (!requestedStepId) {
    debug.error("Opportunities API: missing step id", { user: email, hasParam: Boolean(stepIdParam) })
    return res.status(400).json({ ok: false, error: "Missing step id" })
  }

  debug.trace("Opportunities API: fetch", { user: email, stepId: requestedStepId })

  try {
    const step = await findStepById(requestedStepId)

    if (!step) {
      debug.warn("Opportunities API: step not found", { user: email, stepId: requestedStepId })
      return res.status(404).json({ ok: false, error: "Step not found" })
    }

    const owner = typeof step.user === "string" ? step.user : null
    if (!owner || owner !== email) {
      debug.warn("Opportunities API: forbidden", { user: email, stepId: requestedStepId })
      return res.status(403).json({ ok: false, error: "Forbidden" })
    }

    const canonicalStepId = resolveCanonicalStepId(step as { _id?: unknown; id?: unknown }, requestedStepId)

    const opportunities = await getOpportunitiesByStep(email, canonicalStepId)

    if (opportunities.length > 0) {
      debug.debug("Opportunities API: returning existing opportunities", {
        stepId: canonicalStepId,
        count: opportunities.length
      })
      return res.status(200).json({ ok: true, stepId: canonicalStepId, opportunities })
    }

    let generated: Opportunity[] = []

    try {
      generated = await generateOpportunitiesForStep({ stepId: canonicalStepId, origin: "lazy-fetch" })
      debug.info("Opportunities API: generated on demand", {
        stepId: canonicalStepId,
        count: generated.length
      })
    } catch (error) {
      debug.error("Opportunities API: on-demand generation failed", {
        stepId: canonicalStepId,
        error
      })
      generated = []
    }

    return res.status(200).json({ ok: true, stepId: canonicalStepId, opportunities: generated })
  } catch (error) {
    debug.error("Opportunities API: failure", {
      user: email,
      stepId: requestedStepId,
      error
    })
    return res.status(500).json({ ok: false, error: "Server error" })
  }
}
