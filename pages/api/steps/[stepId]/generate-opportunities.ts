import type { NextApiRequest, NextApiResponse } from "next"
import { getServerSession } from "next-auth"

import { authOptions, createTestSession, isProd } from "@/lib/auth/config"
import { debug } from "@/lib/debug"
import {
  generateSimulatedOpportunitiesForStep,
  OpportunityGenerationError,
} from "@/lib/opportunities/generation"

function getStepIdFromQuery(queryValue: NextApiRequest["query"]["stepId"]): string | null {
  if (Array.isArray(queryValue)) {
    return typeof queryValue[0] === "string" ? queryValue[0] : null
  }

  return typeof queryValue === "string" ? queryValue : null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = isProd
    ? await getServerSession(req, res, authOptions)
    : createTestSession()
  const email = session?.user?.email ?? null

  if (!email) {
    debug.error("Opportunity generation API: unauthenticated request")
    return res.status(401).json({ error: "Not authenticated" })
  }

  const stepId = getStepIdFromQuery(req.query.stepId)

  if (!stepId) {
    debug.error("Opportunity generation API: missing step id", { user: email })
    return res.status(400).json({ error: "Invalid step id" })
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const opportunities = await generateSimulatedOpportunitiesForStep(email, stepId, {
      origin: "api-manual-trigger",
    })
    debug.info("Opportunity generation API: completed", {
      user: email,
      stepId,
      generated: opportunities.length,
    })
    return res.status(200).json({ opportunities })
  } catch (error) {
    const statusCode =
      error instanceof OpportunityGenerationError && error.statusCode >= 400
        ? error.statusCode
        : 500
    const message = error instanceof Error ? error.message : "Failed to generate opportunities"

    debug.error("Opportunity generation API: failed", {
      user: email,
      stepId,
      statusCode,
      message,
    })

    return res.status(statusCode).json({ error: message })
  }
}
