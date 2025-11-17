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

export type OpportunityGenerationOrigin = "manual" | "ai-accepted" | "shuffle" | "lazy-fetch"

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
  status?: string
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
  if (typeof step.bucketId === "string" && step.bucketId.trim().length > 0) {
    return step.bucketId
  }

  if (typeof step.bucket === "string" && step.bucket.trim().length > 0) {
    return step.bucket
  }

  return undefined
}

type OpportunityRecord = { user?: string; stepId?: string }

async function stepHasOpportunities(user: string, stepId: string): Promise<boolean> {
  const col = await getCollection<OpportunityRecord>("opportunities")
  const existing = await col.findOne({ user, stepId: String(stepId) })
  return Boolean(existing)
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

const VALID_SOURCES: Opportunity["source"][] = ["kings-edge-simulated", "independent"]
const VALID_FORMS: Opportunity["form"][] = [
  "workshop",
  "mentoring",
  "short-course",
  "coaching",
  "independent-action"
]
const VALID_FOCUS_VALUES = ["experience", "skills", "community", "reflection"] as const
const VALID_STATUSES: OpportunityStatus[] = ["suggested", "saved", "dismissed"]

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}

function isValidSource(value: unknown): value is Opportunity["source"] {
  return typeof value === "string" && VALID_SOURCES.includes(value as Opportunity["source"])
}

function isValidForm(value: unknown): value is Opportunity["form"] {
  return typeof value === "string" && VALID_FORMS.includes(value as Opportunity["form"])
}

function isValidFocus(value: unknown): value is Opportunity["focus"] {
  return typeof value === "string" && VALID_FOCUS_VALUES.includes(value as (typeof VALID_FOCUS_VALUES)[number])
}

function sanitizeStatus(value: unknown): OpportunityStatus {
  return typeof value === "string" && VALID_STATUSES.includes(value as OpportunityStatus)
    ? (value as OpportunityStatus)
    : "suggested"
}

export async function generateOpportunitiesForStep(params: {
  stepId: string
  origin: OpportunityGenerationOrigin
}): Promise<Opportunity[]> {
  const { stepId, origin } = params

  let canonicalStepId = stepId

  try {
    const step = await findStepById(stepId)

    if (!step || typeof step.user !== "string" || step.user.trim().length === 0) {
      debug.warn("Opportunities: step not found in generateOpportunitiesForStep", {
        stepId,
        origin
      })
      throw new StepNotFoundError(stepId)
    }

    canonicalStepId = resolveCanonicalStepId(step, stepId)
    const stepTitle = resolveStepTitle(step, canonicalStepId)
    const intentionTitle = await findIntentionTitle(step.user, step.intentionId)
    const bucketId = resolveBucketId(step)

    const shouldSkipAutoGeneration = origin !== "shuffle" && origin !== "lazy-fetch"

    if (shouldSkipAutoGeneration && (await stepHasOpportunities(step.user, canonicalStepId))) {
      debug.debug("Opportunities: already has opportunities; skipping auto generation", {
        stepId: canonicalStepId,
        origin
      })
      return []
    }

    const drafts = await generateOpportunityDraftsForStep({
      stepTitle,
      intentionTitle,
      bucketId
    })

    const filteredDrafts = drafts.filter(
      (draft) =>
        isNonEmptyString(draft?.title) &&
        isNonEmptyString(draft?.summary) &&
        isValidSource(draft?.source) &&
        isValidForm(draft?.form)
    )

    if (filteredDrafts.length === 0) {
      debug.warn("Opportunities: no valid drafts to persist", {
        stepId: canonicalStepId,
        origin
      })
      await deleteOpportunitiesForStep(step.user, canonicalStepId)
      return []
    }

    const records: PersistenceOpportunityDraft[] = filteredDrafts.map((draft) => ({
      title: draft.title.trim(),
      summary: draft.summary.trim(),
      source: draft.source,
      form: draft.form,
      focus: isValidFocus(draft.focus) ? draft.focus : "skills",
      status: sanitizeStatus(draft.status)
    }))

    await deleteOpportunitiesForStep(step.user, canonicalStepId)
    const created = await createOpportunitiesForStep(step.user, canonicalStepId, records)

    debug.info("Opportunities: generate success", {
      stepId: canonicalStepId,
      origin,
      count: created.length
    })

    return created
  } catch (error) {
    debug.error("Opportunities: generate failed", {
      stepId: canonicalStepId,
      origin,
      error
    })
    throw error
  }
}

export async function safelyGenerateOpportunitiesForStep(params: {
  stepId: string
  origin: OpportunityGenerationOrigin
}): Promise<void> {
  const { stepId, origin } = params

  debug.debug("Opportunities: safelyGenerateOpportunitiesForStep start", {
    stepId,
    origin
  })

  try {
    const opportunities = await generateOpportunitiesForStep(params)
    debug.debug("Opportunities: safelyGenerateOpportunitiesForStep success", {
      stepId,
      origin,
      count: opportunities.length
    })
  } catch (error) {
    debug.warn("Opportunities: safelyGenerateOpportunitiesForStep failed", {
      stepId,
      origin,
      error
    })
  }
}
