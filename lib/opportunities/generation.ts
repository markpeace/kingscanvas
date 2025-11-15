import { ObjectId } from "mongodb"

import { getCollection } from "@/lib/dbHelpers"
import { debug } from "@/lib/debug"
import { generateOpportunityDraftsForStep } from "@/lib/opportunities/simulation"
import {
  createOpportunitiesForStep,
  deleteOpportunitiesForStep,
  getOpportunitiesByStep,
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

const VALID_SOURCES = new Set<PersistenceOpportunityDraft["source"]>(["edge_simulated", "independent"])
const VALID_FORMS = new Set<PersistenceOpportunityDraft["form"]>([
  "intensive",
  "evergreen",
  "short_form",
  "sustained"
])
const VALID_FOCUS_VALUES = ["capability", "capital", "credibility"] as const
const VALID_STATUSES: OpportunityStatus[] = ["suggested", "saved", "dismissed"]

type ValidFocusValue = (typeof VALID_FOCUS_VALUES)[number]

function sanitiseFocus(value: unknown): PersistenceOpportunityDraft["focus"] | null {
  if (typeof value === "string") {
    const normalised = value.trim().toLowerCase()

    if (VALID_FOCUS_VALUES.includes(normalised as ValidFocusValue)) {
      return normalised as PersistenceOpportunityDraft["focus"]
    }

    return null
  }

  if (Array.isArray(value)) {
    const cleaned = Array.from(
      new Set(
        value
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim().toLowerCase())
          .filter((item): item is ValidFocusValue => VALID_FOCUS_VALUES.includes(item as ValidFocusValue))
      )
    )

    if (cleaned.length === 0) {
      return null
    }

    if (cleaned.length === 1) {
      return cleaned[0] as PersistenceOpportunityDraft["focus"]
    }

    return cleaned as unknown as PersistenceOpportunityDraft["focus"]
  }

  return null
}

function sanitiseDraft(
  draft: unknown,
  index: number,
  metadata: { stepId: string; origin: OpportunityGenerationOrigin }
): PersistenceOpportunityDraft | null {
  if (!draft || typeof draft !== "object") {
    debug.warn("Opportunities: skipping malformed draft", {
      ...metadata,
      index,
      reason: "non-object"
    })
    return null
  }

  const candidate = draft as Partial<PersistenceOpportunityDraft> & { focus?: unknown }

  const title = typeof candidate.title === "string" ? candidate.title.trim() : ""
  const summary = typeof candidate.summary === "string" ? candidate.summary.trim() : ""
  const source = typeof candidate.source === "string" ? candidate.source.trim().toLowerCase() : ""
  const form = typeof candidate.form === "string" ? candidate.form.trim().toLowerCase() : ""
  const focus = sanitiseFocus(candidate.focus)

  const normalisedSource = source as PersistenceOpportunityDraft["source"]
  const normalisedForm = form as PersistenceOpportunityDraft["form"]

  if (!title || !summary || !focus || !VALID_SOURCES.has(normalisedSource) || !VALID_FORMS.has(normalisedForm)) {
    debug.warn("Opportunities: dropping incomplete draft", {
      ...metadata,
      index,
      hasTitle: Boolean(title),
      hasSummary: Boolean(summary),
      hasSource: VALID_SOURCES.has(normalisedSource),
      hasForm: VALID_FORMS.has(normalisedForm),
      hasFocus: Boolean(focus)
    })
    return null
  }

  let status: OpportunityStatus = "suggested"
  if (typeof candidate.status === "string") {
    const normalisedStatus = candidate.status.trim().toLowerCase() as OpportunityStatus
    if (VALID_STATUSES.includes(normalisedStatus)) {
      status = normalisedStatus
    }
  }

  return {
    title,
    summary,
    source: normalisedSource,
    form: normalisedForm,
    focus,
    status
  }
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

// Automatic generation should only happen once per step. If opportunities
// already exist we leave regeneration to the explicit shuffle endpoint.
export async function stepHasOpportunities(stepId: string): Promise<boolean> {
  const step = await findStepById(stepId)

  if (!step || typeof step.user !== "string" || step.user.trim().length === 0) {
    return false
  }

  const canonicalStepId = resolveCanonicalStepId(step, stepId)
  const opportunities = await getOpportunitiesByStep(step.user, canonicalStepId)

  return opportunities.length > 0
}

export async function generateOpportunitiesForStep(params: {
  stepId: string
  origin: OpportunityGenerationOrigin
}): Promise<Opportunity[]> {
  const { stepId, origin } = params
  const step = await findStepById(stepId)

  if (!step || typeof step.user !== "string" || step.user.trim().length === 0) {
    throw new StepNotFoundError(stepId)
  }

  const canonicalStepId = resolveCanonicalStepId(step, stepId)

  debug.info("Opportunities: generateOpportunitiesForStep start", {
    stepId: canonicalStepId,
    origin
  })

  try {
    const stepTitle = resolveStepTitle(step, canonicalStepId)
    const intentionTitle = await findIntentionTitle(step.user, step.intentionId)
    const bucketId = resolveBucketId(step)

    const drafts = await generateOpportunityDraftsForStep({
      stepTitle,
      intentionTitle,
      bucketId
    })

    const records = drafts
      .map((draft, index) => sanitiseDraft(draft, index, { stepId: canonicalStepId, origin }))
      .filter((draft): draft is PersistenceOpportunityDraft => Boolean(draft))

    if (records.length === 0) {
      debug.warn("Opportunities: no valid drafts returned", { stepId: canonicalStepId, origin })
    }

    await deleteOpportunitiesForStep(step.user, canonicalStepId)

    if (records.length === 0) {
      return []
    }

    const created = await createOpportunitiesForStep(step.user, canonicalStepId, records)

    debug.info("Opportunities: generateOpportunitiesForStep success", {
      stepId: canonicalStepId,
      origin,
      count: created.length
    })

    return created
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    debug.error("Opportunities: generateOpportunitiesForStep failure", {
      stepId: canonicalStepId,
      origin,
      message
    })
    throw error
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
    const message = error instanceof Error ? error.message : String(error)
    debug.error("Opportunities: auto generation failed", {
      stepId,
      origin,
      message,
      error
    })
  }
}
