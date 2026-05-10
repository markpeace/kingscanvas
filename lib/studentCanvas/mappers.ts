import {
  canonicalIdFromLegacyRef,
  createCanonicalId,
  nowIso,
  toIsoString,
  isCanonicalId,
} from "@/lib/studentCanvas/identity"
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

function canonicalIdOrLegacy(value: unknown, scope: "intention" | "step" | "opportunity"): string {
  if (isCanonicalId(value)) {
    return value as string
  }

  if (typeof value === "string" && value.trim().length > 0) {
    return canonicalIdFromLegacyRef(value.trim(), scope)
  }

  return createCanonicalId()
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined
}

function canonicalBucketFromUnknown(value: unknown): StudentCanvasBucket {
  switch (value) {
    case "do_now":
    case "do-now":
      return "do_now"
    case "do_later":
    case "do-later":
      return "do_later"
    case "before_graduation":
    case "before-graduation":
      return "before_graduation"
    case "after_graduation":
    case "after-graduation":
      return "after_graduation"
    default:
      return "do_now"
  }
}

function canonicalProgressFromUnknown(value: unknown): StudentCanvasProgressStatus {
  switch (value) {
    case "accepted":
    case "active":
    case "in_progress":
      return "in_progress"
    case "completed":
      return "completed"
    case "rejected":
    case "dismissed":
    case "abandoned":
      return "abandoned"
    default:
      return DEFAULT_PROGRESS
  }
}

function canonicalDecisionFromUnknown(value: unknown): OpportunityDecisionStatus {
  return value === "accepted" || value === "saved" ? "accepted" : "suggested"
}

function canonicalSourceFromUnknown(value: unknown): CanonicalOpportunitySource {
  return value === "catalogue" || value === "kings-edge-simulated" ? "catalogue" : "free_text"
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
  return canonicalBucketFromUnknown(bucket)
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
  return canonicalProgressFromUnknown(status)
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

export function canonicalOpportunityToUi(
  opportunity: CanonicalOpportunity,
  stepId: string
): UiOpportunity {
  const id = canonicalIdOrLegacy(opportunity.id, "opportunity")
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
  const id = canonicalIdOrLegacy(opportunity.id, "opportunity")
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
    id: canonicalIdOrLegacy(step.id || step.clientId, "step"),
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
    id: canonicalIdOrLegacy(intention.id, "intention"),
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
    id: canonicalIdOrLegacy(intention.id, "intention"),
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

function unknownOpportunityToCanonical(input: Record<string, unknown>): CanonicalOpportunity {
  const timestamp = nowIso()
  const source = canonicalSourceFromUnknown(input.source)
  const decisionStatus = canonicalDecisionFromUnknown(input.decision_status ?? input.status)
  const id = canonicalIdOrLegacy(input.id ?? input._id, "opportunity")
  const catalogueRef = isRecord(input.catalogue_ref)
    ? {
        system: toStringOrFallback(input.catalogue_ref.system, "legacy-opportunity"),
        id: toStringOrFallback(input.catalogue_ref.id, id),
      }
    : { system: "legacy-opportunity", id }

  return {
    id,
    title: toStringOrFallback(input.title, "Untitled opportunity"),
    description: optionalString(input.description ?? input.summary),
    decision_status: decisionStatus,
    ...(decisionStatus === "accepted"
      ? { progress_status: canonicalProgressFromUnknown(input.progress_status) }
      : {}),
    source,
    ...(source === "catalogue" ? { catalogue_ref: catalogueRef } : {}),
    created_at: toIsoString(input.created_at ?? input.createdAt, timestamp),
    updated_at: toIsoString(input.updated_at ?? input.updatedAt, timestamp),
  }
}

function unknownStepToCanonical(input: Record<string, unknown>): CanonicalStep {
  const timestamp = nowIso()
  const opportunities = Array.isArray(input.opportunities) ? input.opportunities : []

  return {
    id: canonicalIdOrLegacy(input.id ?? input._id ?? input.clientId, "step"),
    title: toStringOrFallback(input.title, toStringOrFallback(input.text, "Untitled step")),
    description: optionalString(input.description ?? input.text),
    bucket: canonicalBucketFromUnknown(input.bucket ?? input.bucketId),
    order:
      typeof input.order === "number" && Number.isInteger(input.order) && input.order >= 0
        ? input.order
        : 0,
    progress_status: canonicalProgressFromUnknown(input.progress_status ?? input.status),
    created_at: toIsoString(input.created_at ?? input.createdAt, timestamp),
    updated_at: toIsoString(input.updated_at ?? input.updatedAt, timestamp),
    opportunities: opportunities
      .filter(isRecord)
      .map((opportunity) => unknownOpportunityToCanonical(opportunity)),
  }
}

function unknownIntentionToCanonical(input: Record<string, unknown>): CanonicalIntention {
  const timestamp = nowIso()
  const steps = Array.isArray(input.steps) ? input.steps : []

  return {
    id: canonicalIdOrLegacy(input.id, "intention"),
    title: toStringOrFallback(input.title, "Untitled intention"),
    description: optionalString(input.description),
    bucket: canonicalBucketFromUnknown(input.bucket),
    progress_status: canonicalProgressFromUnknown(input.progress_status ?? input.status),
    created_at: toIsoString(input.created_at ?? input.createdAt, timestamp),
    updated_at: toIsoString(input.updated_at ?? input.updatedAt, timestamp),
    steps: steps.filter(isRecord).map((step) => unknownStepToCanonical(step)),
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

      return unknownIntentionToCanonical(item)
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
