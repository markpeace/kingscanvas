import type { NextApiRequest, NextApiResponse } from "next"
import { getServerSession } from "next-auth"

import { authOptions, createTestSession, isProd } from "@/lib/auth/config"
import { debug } from "@/lib/debug"
import { findStepById } from "@/lib/opportunities/generation"
import { getOpportunitiesByStep } from "@/lib/userData"
import type { Opportunity } from "@/types/canvas"

type OpportunitiesResponse =
  | { ok: true; stepId: string; opportunities: Opportunity[] }
  | { ok: false; error: string }

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

    const owner = typeof (step as { user?: unknown }).user === "string" ? (step as { user: string }).user : null

    if (!owner) {
      debug.error("Opportunities API: step missing owner", { user: email, stepId: requestedStepId })
      return res.status(500).json({ ok: false, error: "Server error" })
    }

    if (owner !== email) {
      debug.warn("Opportunities API: forbidden", { user: email, stepId: requestedStepId })
      return res.status(403).json({ ok: false, error: "Forbidden" })
    }

    const rawStepId = (step as { _id?: unknown })._id
    const explicitId = (step as { id?: unknown }).id
    let canonicalStepId = requestedStepId

    if (
      rawStepId &&
      typeof rawStepId === "object" &&
      "toHexString" in rawStepId &&
      typeof (rawStepId as { toHexString: () => unknown }).toHexString === "function"
    ) {
      canonicalStepId = (rawStepId as { toHexString: () => string }).toHexString()
    } else if (typeof rawStepId === "string" && rawStepId.trim().length > 0) {
      canonicalStepId = rawStepId
    } else if (typeof explicitId === "string" && explicitId.trim().length > 0) {
      canonicalStepId = explicitId
    }

    const opportunities = await getOpportunitiesByStep(owner, canonicalStepId)

    debug.info("Opportunities API: success", { user: email, stepId: canonicalStepId, count: opportunities.length })

    return res.status(200).json({ ok: true, stepId: canonicalStepId, opportunities })
  } catch (error) {
    debug.error("Opportunities API: failure", {
      user: email,
      stepId: requestedStepId,
      message: error instanceof Error ? error.message : String(error),
    })
    return res.status(500).json({ ok: false, error: "Server error" })
  }
}
