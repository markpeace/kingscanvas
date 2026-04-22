import { createCanonicalId, nowIso, toIsoString, isCanonicalId } from "@/lib/studentCanvas/identity"
import type {
  CanvasState,
  Intention as CanonicalIntention,
  Opportunity as CanonicalOpportunity,
  OpportunityDecisionStatus,
  OpportunitySource as CanonicalOpportunitySource,
  Step as CanonicalStep,
  StudentCanvasBucket,
  StudentCanvasDocument,
  StudentCanvasProgressStatus,
} from "@/types/studentCanvasV1"
import type {
  BucketId,
  Intention as UiIntention,
  Opportunity as UiOpportunity,
  Step as UiStep,
} from "@/types/canvas"

const DEFAULT_PROGRESS: StudentCanvasProgressStatus = "not_started"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}


function toStringOrFallback(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback
}

export function canonicalBucketToUi(bucket: StudentCanvasBucket): BucketId {
  switch (bucket) {
    case "do_now":
      return "do-now"
    case "do_later":
      return "do-later"
    case "before_graduation":
      return "before-graduation"
    case "after_graduation":
      return "after-graduation"
  }
}

export function uiBucketToCanonical(bucket: BucketId): StudentCanvasBucket {
  switch (bucket) {
    case "do-now":
      return "do_now"
    case "do-later":
      return "do_later"
    case "before-graduation":
      return "before_graduation"
    case "after-graduation":
      return "after_graduation"
  }
}

function canonicalProgressToUiStatus(progress: StudentCanvasProgressStatus): string {
  switch (progress) {
    case "not_started":
      return "suggested"
    case "in_progress":
      return "accepted"
    case "completed":
      return "completed"
    case "abandoned":
      return "rejected"
  }
}

function uiStatusToCanonicalProgress(status: unknown): StudentCanvasProgressStatus {
  switch (status) {
    case "accepted":
    case "in_progress":
      return "in_progress"
    case "completed":
      return "completed"
    case "rejected":
    case "abandoned":
      return "abandoned"
    default:
      return DEFAULT_PROGRESS
  }
}

function canonicalDecisionToUiStatus(decision: OpportunityDecisionStatus): UiOpportunity["status"] {
  return decision === "accepted" ? "saved" : "suggested"
}

function uiStatusToCanonicalDecision(status: UiOpportunity["status"]): OpportunityDecisionStatus {
  return status === "saved" ? "accepted" : "suggested"
}

function canonicalSourceToUi(source: CanonicalOpportunitySource): UiOpportunity["source"] {
  return source === "catalogue" ? "kings-edge-simulated" : "independent"
}

function uiSourceToCanonical(source: UiOpportunity["source"]): CanonicalOpportunitySource {
  return source === "kings-edge-simulated" ? "catalogue" : "free_text"
}

export function canonicalOpportunityToUi(opportunity: CanonicalOpportunity, stepId: string): UiOpportunity {
  const id = isCanonicalId(opportunity.id) ? opportunity.id : createCanonicalId()
  return {
    id,
    _id: id,
    stepId,
    title: opportunity.title,
    summary: opportunity.description ?? "",
    source: canonicalSourceToUi(opportunity.source),
    form: "independent-action",
    focus: "planning",
    status: canonicalDecisionToUiStatus(opportunity.decision_status),
    createdAt: toIsoString(opportunity.created_at),
    updatedAt: toIsoString(opportunity.updated_at),
  }
}

export function uiOpportunityToCanonical(opportunity: UiOpportunity): CanonicalOpportunity {
  const timestamp = nowIso()
  const source = uiSourceToCanonical(opportunity.source)
  const decisionStatus = uiStatusToCanonicalDecision(opportunity.status)
  const id = isCanonicalId(opportunity.id) ? opportunity.id : createCanonicalId()
  return {
    id,
    title: opportunity.title,
    description: opportunity.summary,
    decision_status: decisionStatus,
    progress_status: undefined,
    source,
    catalogue_ref: source === "catalogue" ? { system: "ui-opportunity", id } : undefined,
    created_at: toIsoString(opportunity.createdAt, timestamp),
    updated_at: toIsoString(opportunity.updatedAt, timestamp),
  }
}

export function canonicalStepToUi(step: CanonicalStep, intentionId: string): UiStep {
  const id = isCanonicalId(step.id) ? step.id : createCanonicalId()
  return {
    id,
    clientId: id,
    intentionId,
    title: step.title,
    text: step.description ?? step.title,
    bucket: canonicalBucketToUi(step.bucket),
    order: step.order,
    status: canonicalProgressToUiStatus(step.progress_status),
    source: "student-canvas",
    createdAt: toIsoString(step.created_at),
  }
}

export function uiStepToCanonical(step: UiStep): CanonicalStep {
  const timestamp = nowIso()
  const rawOpportunities = Array.isArray((step as unknown as Record<string, unknown>).opportunities)
    ? ((step as unknown as Record<string, unknown>).opportunities as UiOpportunity[])
    : []

  return {
    id: isCanonicalId(step.id) ? step.id : createCanonicalId(),
    title: toStringOrFallback(step.title, toStringOrFallback(step.text, "Untitled step")),
    description: typeof step.text === "string" ? step.text : undefined,
    bucket: uiBucketToCanonical(step.bucket),
    order: typeof step.order === "number" ? step.order : 0,
    progress_status: uiStatusToCanonicalProgress(step.status),
    created_at: toIsoString(step.createdAt, timestamp),
    updated_at: toIsoString((step as unknown as Record<string, unknown>).updatedAt, timestamp),
    opportunities: rawOpportunities.map(uiOpportunityToCanonical),
  }
}

export function canonicalIntentionToUi(intention: CanonicalIntention): UiIntention {
  return {
    id: isCanonicalId(intention.id) ? intention.id : createCanonicalId(),
    title: intention.title,
    description: intention.description,
    bucket: canonicalBucketToUi(intention.bucket),
    steps: intention.steps.map((step) => canonicalStepToUi(step, intention.id)),
    createdAt: toIsoString(intention.created_at),
    updatedAt: toIsoString(intention.updated_at),
  }
}

export function uiIntentionToCanonical(intention: UiIntention): CanonicalIntention {
  const timestamp = nowIso()
  return {
    id: isCanonicalId(intention.id) ? intention.id : createCanonicalId(),
    title: intention.title,
    description: intention.description,
    bucket: uiBucketToCanonical(intention.bucket),
    progress_status: DEFAULT_PROGRESS,
    created_at: toIsoString(intention.createdAt, timestamp),
    updated_at: toIsoString(intention.updatedAt, timestamp),
    steps: Array.isArray(intention.steps) ? intention.steps.map(uiStepToCanonical) : [],
  }
}

export function uiIntentionsToCanonical(intentions: UiIntention[]): CanonicalIntention[] {
  return intentions.map(uiIntentionToCanonical)
}

export function canonicalIntentionsToUi(intentions: CanonicalIntention[]): UiIntention[] {
  return intentions.map(canonicalIntentionToUi)
}

export function canonicalDocumentToUi(document: StudentCanvasDocument): UiIntention[] {
  return canonicalIntentionsToUi(document.canvas.intentions)
}

export function uiIntentionsToCanvasState(intentions: UiIntention[]): CanvasState {
  return {
    intentions: uiIntentionsToCanonical(intentions),
  }
}

export function toCanonicalIntentionsFromUnknown(input: unknown): CanonicalIntention[] {
  if (!Array.isArray(input)) {
    return []
  }

  return input
    .map((item) => {
      if (!isRecord(item)) {
        return null
      }

      if (typeof item.progress_status === "string" && typeof item.bucket === "string") {
        return item as unknown as CanonicalIntention
      }

      return uiIntentionToCanonical(item as unknown as UiIntention)
    })
    .filter((item): item is CanonicalIntention => item !== null)
}

export function toUiIntentionsFromUnknown(input: unknown): UiIntention[] {
  if (!Array.isArray(input)) {
    return []
  }

  return input
    .map((item) => {
      if (!isRecord(item)) {
        return null
      }

      if (typeof item.progress_status === "string" && typeof item.bucket === "string") {
        return canonicalIntentionToUi(item as unknown as CanonicalIntention)
      }

      return item as unknown as UiIntention
    })
    .filter((item): item is UiIntention => item !== null)
}
