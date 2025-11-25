import type { NextApiRequest, NextApiResponse } from "next"
import { getServerSession } from "next-auth"

import { debug } from "@/lib/debug"
import { runOpportunityWorkflow } from "@/lib/langgraph/workflow"
import { authOptions } from "@/lib/auth/config"

type SuggestOpportunitiesRequestBody = {
  stepTitle?: string
  stepBucket: string
  intentionTitle?: string
  existingOpportunityTitles?: string[]
}

type SuggestOpportunitiesResponse =
  | { ok: true; opportunities: Array<{ title: string; summary: string; tier?: string }> }
  | { ok?: false; error: string }

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuggestOpportunitiesResponse>
) {
  const session = await getServerSession(req, res, authOptions)
  const email = process.env.VERCEL_ENV === "production" ? session?.user?.email : "test@test.com"

  if (!email) {
    debug.error("AI: unauthenticated suggest-opportunities request")
    return res.status(401).json({ ok: false, error: "Not authenticated" })
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" })
  }

  const { stepTitle, stepBucket, intentionTitle, existingOpportunityTitles } =
    req.body as SuggestOpportunitiesRequestBody

  debug.trace("AI: suggest-opportunities request", {
    user: email,
    stepBucket,
    hasStepTitle: !!stepTitle,
    intentionTitle,
    existingCount: existingOpportunityTitles?.length || 0
  })

  try {
    const result = await runOpportunityWorkflow({
      stepTitle: stepTitle || "",
      stepBucket: stepBucket as any,
      intentionTitle,
      existingOpportunityTitles
    })

    const opportunities = Array.isArray(result?.opportunities) ? result.opportunities : []

    return res.status(200).json({ ok: true, opportunities })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"

    const context = {
      user: email,
      stepBucket,
      intentionTitle
    }

    if (message.includes("OPENAI_API_KEY is not set")) {
      debug.error("AI: suggest-opportunities misconfigured", { ...context, message })
      return res.status(503).json({ ok: false, error: "AI is not configured" })
    }

    debug.error("AI: suggest-opportunities failed", { ...context, message })
    return res.status(500).json({ ok: false, error: "AI generation failed" })
  }
}
