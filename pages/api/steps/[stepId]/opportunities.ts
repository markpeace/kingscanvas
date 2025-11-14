import type { NextApiRequest, NextApiResponse } from "next"
import { getServerSession } from "next-auth"

import { authOptions, createTestSession, isProd } from "@/lib/auth/config"
import { debug } from "@/lib/debug"
import { getOpportunitiesByStep, getStepById } from "@/lib/userData"
import type { Opportunity } from "@/types/canvas"

type StepRecord = {
  _id?: unknown
  id?: unknown
  user?: string
}

function normaliseStepIdentifier(value: unknown): string | null {
  if (!value) {
    return null
  }

  if (typeof value === "string") {
    return value
  }

  if (typeof value === "object") {
    const hex = (value as { toHexString?: () => string }).toHexString?.()
    if (typeof hex === "string" && hex) {
      return hex
    }

    const str = (value as { toString?: () => string }).toString?.()
    if (typeof str === "string" && str) {
      return str
    }
  }

  return null
}

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
    const step = (await getStepById(requestedStepId)) as StepRecord | null

    if (!step) {
      debug.warn("Opportunities API: step not found", { user: email, stepId: requestedStepId })
      return res.status(404).json({ ok: false, error: "Step not found" })
    }

    const owner = typeof step.user === "string" && step.user ? step.user : null

    if (!owner) {
      debug.error("Opportunities API: step missing owner", { stepId: requestedStepId })
      return res.status(500).json({ ok: false, error: "Server error" })
    }

    if (owner !== email) {
      debug.warn("Opportunities API: forbidden", { user: email, stepId: requestedStepId })
      return res.status(403).json({ ok: false, error: "Forbidden" })
    }

    const canonicalStepId =
      normaliseStepIdentifier(step._id ?? step.id) ?? requestedStepId

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
