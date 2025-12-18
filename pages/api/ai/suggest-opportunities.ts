import type { NextApiRequest, NextApiResponse } from "next"
import { getServerSession } from "next-auth"

import { debug } from "@/lib/debug"
import { runOpportunityWorkflow } from "@/lib/langgraph/workflow"
import { getStudentPersona, type StudentPersonaId } from "@/lib/context/studentPersonas"
import { authOptions } from "@/lib/auth/config"

type SuggestOpportunitiesRequestBody = {
  stepTitle?: string
  stepBucket: string
  intentionTitle?: string
  existingOpportunityTitles?: string[]
  personaId?: StudentPersonaId
  fast?: boolean
}

type SuggestOpportunitiesResponse =
  | { ok: true; opportunities: Array<{ title: string; summary: string; tier?: string }> }
  | { ok?: false; error: string }

function normaliseBooleanFlag(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value
  if (typeof value === "string") {
    const lower = value.trim().toLowerCase()
    if (["1", "true", "yes", "on", "fast"].includes(lower)) return true
    if (["0", "false", "no", "off", "slow"].includes(lower)) return false
  }

  return undefined
}

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

  const { stepTitle, stepBucket, intentionTitle, existingOpportunityTitles, personaId, fast } =
    req.body as SuggestOpportunitiesRequestBody
  const fastFlag = normaliseBooleanFlag(fast ?? (req.query?.fast as string | undefined))
  const envFast = process.env.LLM_FAST === "true"
  const useFast = envFast ? true : fastFlag ?? true

  const persona = getStudentPersona(personaId)

  debug.trace("AI: suggest-opportunities request", {
    user: email,
    stepBucket,
    hasStepTitle: !!stepTitle,
    intentionTitle,
    existingCount: existingOpportunityTitles?.length || 0,
    persona: persona.shortLabel,
    fast: useFast
  })

  try {
    const result = await runOpportunityWorkflow({
      stepTitle: stepTitle || "",
      stepBucket: stepBucket as any,
      intentionTitle,
      existingOpportunityTitles,
      persona,
      fast: useFast
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
