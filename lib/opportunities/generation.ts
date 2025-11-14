import { ObjectId } from "mongodb"

import { generateOpportunityDraftsForStep } from "@/lib/ai/opportunities"
import { getCollection } from "@/lib/dbHelpers"
import { debug } from "@/lib/debug"
import {
  createOpportunitiesForStep,
  deleteOpportunitiesForStep,
  getOpportunitiesByStep,
  getUserIntentions
} from "@/lib/userData"
import type { Opportunity } from "@/types/canvas"
import type { OpportunityDraft } from "@/lib/userData"

type StepDocument = {
  _id?: ObjectId | string
  id?: string
  user?: string
  title?: string
  text?: string
  bucket?: string
  bucketId?: string
  intentionId?: string
}

type IntentionRecord = {
  id?: string
  title?: string
}

export type OpportunityGenerationOrigin = "manual" | "ai-accepted" | "shuffle"

function toCanonicalStepId(step: StepDocument): string {
  const rawId = step._id ?? step.id

  if (typeof rawId === "string" && rawId) {
    return rawId
  }

  if (rawId instanceof ObjectId) {
    return rawId.toHexString()
  }

  if (rawId && typeof rawId === "object") {
    const maybeHex = (rawId as { toHexString?: () => string; toString?: () => string }).toHexString?.()

    if (maybeHex) {
      return maybeHex
    }

    const maybeString = (rawId as { toString?: () => string }).toString?.()

    if (maybeString) {
      return maybeString
    }
  }

  throw new Error("Could not determine canonical step id")
}

async function loadStep(stepId: string): Promise<StepDocument | null> {
  const collection = await getCollection<StepDocument>("steps")
  const queries: Array<Record<string, unknown>> = []

  if (ObjectId.isValid(stepId)) {
    try {
      queries.push({ _id: new ObjectId(stepId) })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      debug.warn("Opportunities: failed to coerce step id to ObjectId", { stepId, message })
    }
  }

  queries.push({ _id: stepId })
  queries.push({ id: stepId })

  for (const query of queries) {
    const step = await collection.findOne(query)

    if (step) {
      return step
    }
  }

  return null
}

function normaliseStepIdentifier(value: unknown): string | null {
  if (!value) {
    return null
  }

  if (typeof value === "string") {
    return value
  }

  if (value instanceof ObjectId) {
    return value.toHexString()
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

export async function stepHasOpportunities(stepId: string): Promise<boolean> {
  try {
    const step = await loadStep(stepId)

    if (!step?.user) {
      return false
    }

    const canonicalStepId = normaliseStepIdentifier(step._id ?? step.id)

    if (!canonicalStepId) {
      return false
    }

    const existing = await getOpportunitiesByStep(step.user, canonicalStepId)

    return existing.length > 0
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    debug.warn("Opportunities: stepHasOpportunities failed", { stepId, message })
    return false
  }
}

export async function safelyGenerateOpportunitiesForStep(
  stepId: string,
  origin: OpportunityGenerationOrigin
): Promise<void> {
  debug.info("Opportunities: auto generation requested", { stepId, origin })

  try {
    await generateOpportunitiesForStep({ stepId, origin })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    debug.error("Opportunities: auto generation failed", { stepId, origin, message })
  }
}

async function loadIntentionTitle(user: string, intentionId?: string): Promise<string | undefined> {
  if (!user || !intentionId) {
    return undefined
  }

  const doc = await getUserIntentions(user)
  const intentions = Array.isArray(doc?.intentions) ? (doc.intentions as IntentionRecord[]) : []
  const match = intentions.find((intention) => intention?.id === intentionId)

  if (match?.title && typeof match.title === "string") {
    return match.title
  }

  return undefined
}

/**
 * This helper must only be called for real, persisted steps – never ghost suggestions.
 * It will support automatic generation after step creation/acceptance and the shuffle endpoint.
 */
export async function generateOpportunitiesForStep(params: {
  stepId: string
  origin: OpportunityGenerationOrigin
}): Promise<Opportunity[]> {
  const { stepId, origin } = params
  let canonicalStepId = stepId

  try {
    const step = await loadStep(stepId)

    if (!step) {
      throw new Error("Step not found")
    }

    if (!step.user) {
      throw new Error("Step is missing an owner")
    }

    canonicalStepId = toCanonicalStepId(step)
    const stepTitle = (step.title ?? step.text ?? "").trim()
    const bucketId = step.bucketId ?? step.bucket ?? undefined
    const intentionTitle = await loadIntentionTitle(step.user, step.intentionId ?? undefined)

    debug.info("Opportunities: generateOpportunitiesForStep start", {
      stepId: canonicalStepId,
      origin
    })

    const drafts = await generateOpportunityDraftsForStep({
      stepTitle,
      intentionTitle,
      bucketId
    })

    const records: OpportunityDraft[] = drafts.map((draft) => ({
      title: draft.title,
      summary: draft.summary,
      source: draft.source,
      form: draft.form,
      focus: draft.focus,
      status: draft.status ?? "suggested"
    }))

    await deleteOpportunitiesForStep(step.user, canonicalStepId)
    const created = await createOpportunitiesForStep(step.user, canonicalStepId, records)

    debug.info("Opportunities: generateOpportunitiesForStep success", {
      stepId: canonicalStepId,
      origin,
      count: created.length
    })

    return created
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"

    debug.error("Opportunities: generateOpportunitiesForStep failure", {
      stepId: canonicalStepId,
      origin,
      message
    })

    if (error instanceof Error) {
      throw error
    }

    throw new Error(message)
  }
}
