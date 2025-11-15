// Shuffle opportunities for real, persisted steps only; ghost AI suggestion cards should not call this yet.
// A "Shuffle opportunities" control for real step cards will invoke this in a future PR.
import type { NextApiRequest, NextApiResponse } from "next"
import { getServerSession } from "next-auth"

import { authOptions, createTestSession, isProd } from "@/lib/auth/config"
import { debug } from "@/lib/debug"
import { findStepById, generateOpportunitiesForStep, StepNotFoundError } from "@/lib/opportunities/generation"
import type { Opportunity } from "@/types/canvas"

type ShuffleOpportunitiesResponse =
  | { ok: true; stepId: string; opportunities: Opportunity[] }
  | { ok: false; error: string }

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ShuffleOpportunitiesResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" })
  }

  const session = isProd ? await getServerSession(req, res, authOptions) : createTestSession()
  const email = session?.user?.email ?? null

  if (!email) {
    debug.error("Shuffle Opportunities API: unauthenticated")
    return res.status(401).json({ ok: false, error: "Not authenticated" })
  }

  const stepIdParam = req.query.stepId
  const requestedStepId = typeof stepIdParam === "string" ? stepIdParam : ""

  if (!requestedStepId) {
    debug.error("Shuffle Opportunities API: missing step id", { user: email, hasParam: Boolean(stepIdParam) })
    return res.status(400).json({ ok: false, error: "Missing step id" })
  }

  try {
    const step = await findStepById(requestedStepId)

    if (!step) {
      debug.warn("Shuffle Opportunities API: step not found", { user: email, stepId: requestedStepId })
      return res.status(404).json({ ok: false, error: "Step not found" })
    }

    if (typeof step.user !== "string" || step.user !== email) {
      debug.warn("Shuffle Opportunities API: forbidden", { user: email, stepId: requestedStepId })
      return res.status(403).json({ ok: false, error: "Forbidden" })
    }

    const opportunities = await generateOpportunitiesForStep({ stepId: requestedStepId, origin: "shuffle" })

    const responseStepId =
      opportunities[0]?.stepId ??
      (step._id && typeof step._id === "object" && "toHexString" in step._id && typeof step._id.toHexString === "function"
        ? step._id.toHexString()
        : typeof step._id === "string" && step._id.trim().length > 0
        ? step._id
        : typeof step.id === "string" && step.id.trim().length > 0
        ? step.id
        : requestedStepId)

    debug.info("Shuffle Opportunities API: success", {
      user: email,
      stepId: responseStepId,
      count: opportunities.length
    })

    return res.status(200).json({ ok: true, stepId: responseStepId, opportunities })
  } catch (error) {
    if (error instanceof StepNotFoundError) {
      debug.warn("Shuffle Opportunities API: helper reported missing step", {
        user: email,
        stepId: requestedStepId
      })
      return res.status(404).json({ ok: false, error: "Step not found" })
    }

    const message = error instanceof Error ? error.message : String(error)
    debug.error("Shuffle Opportunities API: failure", {
      user: email,
      stepId: requestedStepId,
      message
    })

    return res.status(500).json({ ok: false, error: "Could not generate opportunities for this step" })
  }
}
