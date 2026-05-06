import { debug } from "@/lib/debug"
import { runOpportunityWorkflow } from "@/lib/langgraph/workflow"
import type { StudentPersona } from "@/lib/context/studentPersonas"
import {
  getStudentIntentions,
  getStudentOpportunitiesByStep,
  replaceStudentOpportunitiesByStep,
} from "@/lib/studentCanvas/repository"
import { canonicalBucketToUi, canonicalOpportunityToUi } from "@/lib/studentCanvas/mappers"
import type { Opportunity, OpportunityStatus } from "@/types/canvas"
import type { Opportunity as StudentCanvasOpportunity } from "@/types/studentCanvasV1"

export type OpportunityGenerationOrigin = "manual" | "ai-accepted" | "shuffle" | "lazy-fetch"

export class StepNotFoundError extends Error {
  constructor(stepId: string) {
    super(`Step ${stepId} was not found`)
    this.name = "StepNotFoundError"
  }
}

type StepRecord = {
  _id?: string | { toHexString?: () => string }
  id?: string
  user?: string
  intentionId?: string
  title?: string
  text?: string
  bucket?: string
  bucketId?: string
  status?: string
}

function resolveCanonicalStepId(step: StepRecord, fallback: string): string {
  const rawId = step._id

  if (
    rawId &&
    typeof rawId === "object" &&
    "toHexString" in rawId &&
    typeof rawId.toHexString === "function"
  ) {
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

function canonicalProgressToUiStatus(progress: unknown): string {
  switch (progress) {
    case "in_progress":
      return "accepted"
    case "completed":
      return "completed"
    case "abandoned":
      return "rejected"
    default:
      return "suggested"
  }
}

export async function findStepById(stepId: string, studentId?: string): Promise<StepRecord | null> {
  if (typeof stepId !== "string" || stepId.trim().length === 0 || !studentId) {
    return null
  }

  const intentions = await getStudentIntentions(studentId)
  for (const intention of intentions) {
    const steps = Array.isArray(intention?.steps) ? intention.steps : []
    const step = steps.find((candidate) => candidate.id === stepId)
    if (!step) {
      continue
    }

    return {
      _id: step.id,
      id: step.id,
      user: studentId,
      intentionId: intention.id,
      title: step.title,
      text: step.description ?? step.title,
      bucket: canonicalBucketToUi(step.bucket),
      bucketId: canonicalBucketToUi(step.bucket),
      status: canonicalProgressToUiStatus(step.progress_status),
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
  "independent-action",
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
  return (
    typeof value === "string" &&
    VALID_FOCUS_VALUES.includes(value as (typeof VALID_FOCUS_VALUES)[number])
  )
}

function sanitizeStatus(value: unknown): OpportunityStatus {
  return typeof value === "string" && VALID_STATUSES.includes(value as OpportunityStatus)
    ? (value as OpportunityStatus)
    : "suggested"
}

export async function generateOpportunitiesForStep(params: {
  stepId: string
  origin: OpportunityGenerationOrigin
  studentId?: string
  persona?: StudentPersona
}): Promise<Opportunity[]> {
  const { stepId, origin, studentId } = params

  let canonicalStepId = stepId

  try {
    const step = await findStepById(stepId, studentId)

    if (!step || typeof step.user !== "string" || step.user.trim().length === 0) {
      debug.warn("Opportunities: step not found in generateOpportunitiesForStep", {
        stepId,
        origin,
      })
      throw new StepNotFoundError(stepId)
    }

    canonicalStepId = resolveCanonicalStepId(step, stepId)
    const stepTitle = resolveStepTitle(step, canonicalStepId)
    const intentionTitle =
      typeof step.intentionId === "string"
        ? (await getStudentIntentions(step.user)).find(
            (intention) => intention.id === step.intentionId
          )?.title
        : undefined
    const bucketId = resolveBucketId(step)

    const shouldSkipAutoGeneration = origin !== "shuffle" && origin !== "lazy-fetch"

    if (
      shouldSkipAutoGeneration &&
      (await getStudentOpportunitiesByStep(step.user, canonicalStepId)).length > 0
    ) {
      debug.debug("Opportunities: already has opportunities; skipping auto generation", {
        stepId: canonicalStepId,
        origin,
      })
      return []
    }

    const aiResult = await runOpportunityWorkflow({
      stepTitle,
      stepBucket: bucketId,
      intentionTitle,
      existingOpportunityTitles: [],
      persona: params.persona,
    })

    const drafts = Array.isArray(aiResult?.opportunities)
      ? aiResult.opportunities.map((opp) => {
          const title = isNonEmptyString(opp.title) ? opp.title : stepTitle
          const summary = isNonEmptyString(opp.summary) ? opp.summary : stepTitle

          const source = isValidSource(opp.source)
            ? (opp.source as Opportunity["source"])
            : "kings-edge-simulated"
          const form = isValidForm(opp.form)
            ? (opp.form as Opportunity["form"])
            : "independent-action"

          const focus: Opportunity["focus"] =
            opp.focus === "experience" ||
            opp.focus === "skills" ||
            opp.focus === "community" ||
            opp.focus === "reflection"
              ? (opp.focus as Opportunity["focus"])
              : "experience"

          return {
            title,
            summary,
            source,
            form,
            focus,
            status: "suggested",
          }
        })
      : []

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
        origin,
        ...(params.persona ? { persona: params.persona.shortLabel } : {}),
      })
      await replaceStudentOpportunitiesByStep(step.user, canonicalStepId, [])
      return []
    }

    const records: Array<Partial<StudentCanvasOpportunity>> = filteredDrafts.map((draft) => ({
      title: draft.title.trim(),
      description: draft.summary.trim(),
      source: draft.source === "kings-edge-simulated" ? "catalogue" : "free_text",
      decision_status: sanitizeStatus(draft.status) === "saved" ? "accepted" : "suggested",
      catalogue_ref:
        draft.source === "kings-edge-simulated"
          ? {
              system: "kings-edge-simulated",
              id: draft.title.trim().toLowerCase().replace(/\s+/g, "-").slice(0, 64),
            }
          : undefined,
    }))

    const createdCanonical = await replaceStudentOpportunitiesByStep(
      step.user,
      canonicalStepId,
      records
    )
    const created = createdCanonical.map((opportunity) =>
      canonicalOpportunityToUi(opportunity, canonicalStepId)
    )

    debug.info("Opportunities: generate success", {
      stepId: canonicalStepId,
      origin,
      count: created.length,
      ...(params.persona ? { persona: params.persona.shortLabel } : {}),
    })

    return created
  } catch (error) {
    debug.error("Opportunities: generate failed", {
      stepId: canonicalStepId,
      origin,
      error,
    })
    throw error
  }
}

export async function safelyGenerateOpportunitiesForStep(params: {
  stepId: string
  origin: OpportunityGenerationOrigin
  studentId?: string
  persona?: StudentPersona
}): Promise<void> {
  const { stepId, origin } = params

  debug.debug("Opportunities: safelyGenerateOpportunitiesForStep start", {
    stepId,
    origin,
    ...(params.persona ? { persona: params.persona.shortLabel } : {}),
  })

  try {
    const opportunities = await generateOpportunitiesForStep(params)
    debug.debug("Opportunities: safelyGenerateOpportunitiesForStep success", {
      stepId,
      origin,
      count: opportunities.length,
    })
  } catch (error) {
    debug.warn("Opportunities: safelyGenerateOpportunitiesForStep failed", {
      stepId,
      origin,
      error,
      errorName: error instanceof Error ? error.name : String(error),
      errorMessage: error instanceof Error ? error.message : String(error),
    })
  }
}
