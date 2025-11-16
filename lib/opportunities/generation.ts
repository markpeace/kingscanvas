import { ObjectId } from "mongodb"

import { getCollection } from "@/lib/dbHelpers"
import { debug } from "@/lib/debug"
import { generateOpportunityDraftsForStep } from "@/lib/opportunities/simulation"
import {
  createOpportunitiesForStep,
  deleteOpportunitiesForStep,
  type OpportunityDraft as PersistenceOpportunityDraft
} from "@/lib/userData"
import type { Opportunity, OpportunityStatus } from "@/types/canvas"

export type OpportunityGenerationOrigin = "manual" | "ai-accepted" | "shuffle"

export class StepNotFoundError extends Error {
  constructor(stepId: string) {
    super(`Step ${stepId} was not found`)
    this.name = "StepNotFoundError"
  }
}

type StepRecord = {
  _id?: ObjectId | string
  id?: string
  user?: string
  intentionId?: string
  title?: string
  text?: string
  bucket?: string
  bucketId?: string
}

type IntentionRecord = {
  user: string
  intentions?: Array<{
    id?: string
    title?: string
  }>
}

function resolveCanonicalStepId(step: StepRecord, fallback: string): string {
  const rawId = step._id

  if (rawId && typeof rawId === "object" && "toHexString" in rawId && typeof rawId.toHexString === "function") {
    return rawId.toHexString()
  }

  if (typeof rawId === "string" && rawId.trim().length > 0) {
    return rawId
  }

  if (typeof step.id === "string" && step.id.trim().length > 0) {
    return step.id
  }

  return fallback
}

function resolveStepTitle(step: StepRecord, fallbackId: string): string {
  const candidates = [step.title, step.text]

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim()
    }
  }

  return fallbackId
}

function resolveBucketId(step: StepRecord): string | undefined {
  const bucketCandidate =
    typeof step.bucket === "string" && step.bucket.trim().length > 0
      ? step.bucket
      : typeof step.bucketId === "string" && step.bucketId.trim().length > 0
      ? step.bucketId
      : undefined

  return bucketCandidate
}

async function findIntentionTitle(user: string, intentionId?: string): Promise<string | undefined> {
  if (!intentionId) {
    return undefined
  }

  const col = await getCollection<IntentionRecord>("intentions")
  const doc = await col.findOne({ user })

  if (!doc || !Array.isArray(doc.intentions)) {
    return undefined
  }

  const match = doc.intentions.find((item) => item?.id === intentionId)
  const title = match?.title

  if (typeof title === "string" && title.trim().length > 0) {
    return title
  }

  return undefined
}

export async function findStepById(stepId: string): Promise<StepRecord | null> {
  if (typeof stepId !== "string" || stepId.trim().length === 0) {
    return null
  }

  const col = await getCollection<StepRecord>("steps")
  const queries: Array<Record<string, unknown>> = []

  if (ObjectId.isValid(stepId)) {
    try {
      queries.push({ _id: new ObjectId(stepId) })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      debug.warn("Opportunities: failed to coerce step id", { stepId, message })
    }
  }

  queries.push({ _id: stepId })
  queries.push({ id: stepId })

  for (const query of queries) {
    const step = await col.findOne(query)
    if (step) {
      return step
    }
  }

  return null
}

export async function generateOpportunitiesForStep(params: {
  stepId: string
  origin: OpportunityGenerationOrigin
}): Promise<Opportunity[]> {
  const { stepId, origin } = params

  debug.info("Opportunities: generateOpportunitiesForStep start", {
    stepId,
    origin
  })

  const step = await findStepById(stepId)

  if (!step || typeof step.user !== "string" || step.user.trim().length === 0) {
    debug.warn("Opportunities: step not found for generation", {
      stepId,
      origin
    })
    throw new StepNotFoundError(stepId)
  }

  const canonicalStepId = resolveCanonicalStepId(step, stepId)
  const stepTitle = resolveStepTitle(step, canonicalStepId)
  const intentionTitle = await findIntentionTitle(step.user, step.intentionId)
  const bucketId = resolveBucketId(step)

  const drafts = await generateOpportunityDraftsForStep({
    stepTitle,
    intentionTitle,
    bucketId
  })

  const draftCount = drafts.length

  debug.info("Opportunities: drafts generated", {
    stepId: canonicalStepId,
    origin,
    draftCount
  })

  const records: PersistenceOpportunityDraft[] = drafts.map((draft) => ({
    title: draft.title,
    summary: draft.summary,
    source: draft.source,
    form: draft.form,
    focus: draft.focus,
    status: (draft.status ?? "suggested") as OpportunityStatus
  }))
  const validRecordsCount = records.length

  debug.info("Opportunities: drafts mapped to records", {
    stepId: canonicalStepId,
    origin,
    draftCount,
    validRecordsCount
  })

  await deleteOpportunitiesForStep(step.user, canonicalStepId)
  const created = await createOpportunitiesForStep(step.user, canonicalStepId, records)

  debug.info("Opportunities: generateOpportunitiesForStep success", {
    stepId: canonicalStepId,
    origin,
    createdCount: created.length
  })

  return created
}

export async function safelyGenerateOpportunitiesForStep(params: {
  stepId: string
  origin: OpportunityGenerationOrigin
}): Promise<Opportunity[] | null> {
  const { stepId, origin } = params

  debug.trace("Opportunities: safelyGenerateOpportunitiesForStep", {
    stepId,
    origin
  })

  try {
    return await generateOpportunitiesForStep(params)
  } catch (error) {
    const errorName = error instanceof Error && typeof error.name === "string" ? error.name : "Error"
    const errorMessage = error instanceof Error ? error.message : String(error)
    const stackLine = error instanceof Error && typeof error.stack === "string" ? error.stack.split("\n")[0] : undefined

    debug.error("Opportunities: auto generation failed", {
      stepId,
      origin,
      errorName,
      errorMessage,
      stack: stackLine
    })

    return null
  }
}
