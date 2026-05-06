import { debug } from "@/lib/debug"
import { canonicalIdFromLegacyRef, createCanonicalId, isCanonicalId, nowIso, toIsoString } from "@/lib/studentCanvas/identity"
import type { TutorialState } from "@/lib/tutorial/state"
import type {
  Intention as StudentCanvasIntention,
  Opportunity as StudentCanvasOpportunity,
  Step as StudentCanvasStep,
  StudentCanvasDocument,
  StudentCanvasBucket,
  StudentCanvasProgressStatus,
} from "@/types/studentCanvasV1"

export const STUDENT_CANVAS_SCHEMA_VERSION = "1.0.0" as const
export const STUDENT_CANVAS_PRIMARY_COLLECTION = "student_canvas"
export const STUDENT_CANVAS_MIGRATION_COLLECTION = "student_canvas_migrations"

export type LegacyIntentionsDocument = {
  user: string
  intentions?: Array<Partial<StudentCanvasIntention> & Record<string, unknown>>
  tutorialState?: TutorialState
  createdAt?: Date
  updatedAt?: Date
}

export type LegacyStepDocument = {
  _id?: string | { toHexString?: () => string; toString?: () => string }
  id?: string
  user: string
  intentionId?: string
  title?: string
  text?: string
  bucket?: string
  order?: number
  status?: string
  createdAt?: Date | string
  updatedAt?: Date | string
  [key: string]: unknown
}

export type LegacyOpportunityDocument = {
  _id: string | { toHexString?: () => string; toString?: () => string }
  user: string
  stepId: string
  title?: string
  summary?: string
  source?: string
  status?: string
  createdAt?: Date | string
  updatedAt?: Date | string
  [key: string]: unknown
}

export type MigrationReject = {
  entity: "intention" | "step" | "opportunity"
  legacy_id: string
  reason: string
}

export type MigrationStats = {
  intentions_total: number
  intentions_migrated: number
  steps_total: number
  steps_migrated: number
  opportunities_total: number
  opportunities_migrated: number
  rejects: MigrationReject[]
}

export type MigrationMarker = {
  student_id: string
  schema_version: string
  status: "migrated" | "failed"
  migrated_at?: string
  updated_at: string
  counts: Omit<MigrationStats, "rejects">
  reject_count: number
  rejects: MigrationReject[]
  error?: string
}

export type LegacySnapshot = {
  intentionsDoc: LegacyIntentionsDocument | null
  steps: LegacyStepDocument[]
  opportunities: LegacyOpportunityDocument[]
}

function buildCatalogueRef(opportunityId: string) {
  return {
    system: "legacy-opportunity",
    id: opportunityId,
  }
}

function normalizeBucket(value: unknown): StudentCanvasBucket {
  switch (value) {
    case "do_later":
    case "before_graduation":
    case "after_graduation":
    case "do_now":
      return value
    case "do-later":
      return "do_later"
    case "before-graduation":
      return "before_graduation"
    case "after-graduation":
      return "after_graduation"
    default:
      return "do_now"
  }
}

function normalizeProgress(value: unknown): StudentCanvasProgressStatus {
  switch (value) {
    case "accepted":
    case "in_progress":
      return "in_progress"
    case "completed":
      return "completed"
    case "rejected":
    case "abandoned":
      return "abandoned"
    default:
      return "not_started"
  }
}

function toStringId(value: unknown): string {
  if (typeof value === "string") {
    return value.trim()
  }

  if (value && typeof value === "object") {
    const asObj = value as { toHexString?: () => string; toString?: () => string }
    if (typeof asObj.toHexString === "function") {
      return asObj.toHexString().trim()
    }
    if (typeof asObj.toString === "function") {
      return asObj.toString().trim()
    }
  }

  return ""
}

function toCanonicalId(value: string, scope: "step" | "opportunity" | "intention"): string {
  if (!value) {
    return createCanonicalId()
  }

  if (isCanonicalId(value)) {
    return value
  }

  return canonicalIdFromLegacyRef(value, scope)
}

export function assembleCanonicalDocument(studentId: string, snapshot: LegacySnapshot): {
  document: StudentCanvasDocument | null
  stats: MigrationStats
} {
  const fallbackTime = nowIso()
  const stats: MigrationStats = {
    intentions_total: Array.isArray(snapshot.intentionsDoc?.intentions) ? snapshot.intentionsDoc?.intentions.length : 0,
    intentions_migrated: 0,
    steps_total: snapshot.steps.length,
    steps_migrated: 0,
    opportunities_total: snapshot.opportunities.length,
    opportunities_migrated: 0,
    rejects: [],
  }

  if (!snapshot.intentionsDoc && snapshot.steps.length === 0 && snapshot.opportunities.length === 0) {
    return { document: null, stats }
  }

  const legacyIntentions = Array.isArray(snapshot.intentionsDoc?.intentions) ? snapshot.intentionsDoc.intentions : []
  const intentionIdMap = new Map<string, string>()

  const canonicalIntentions: StudentCanvasIntention[] = legacyIntentions.map((intention) => {
    const rawId = typeof intention?.id === "string" ? intention.id.trim() : ""
    const canonicalId = toCanonicalId(rawId, "intention")
    if (rawId.length > 0) {
      intentionIdMap.set(rawId, canonicalId)
    }

    stats.intentions_migrated += 1

    return {
      id: canonicalId,
      title: typeof intention?.title === "string" && intention.title.trim().length > 0 ? intention.title : "Untitled intention",
      description: typeof intention?.description === "string" ? intention.description : undefined,
      bucket: normalizeBucket(intention?.bucket),
      progress_status: normalizeProgress(intention?.progress_status),
      created_at: toIsoString(intention?.created_at, fallbackTime),
      updated_at: toIsoString(intention?.updated_at, fallbackTime),
      steps: [],
    }
  })

  const stepsByIntention = new Map<string, StudentCanvasStep[]>()
  const stepIdMap = new Map<string, string>()

  for (const step of snapshot.steps) {
    const intentionRef = typeof step.intentionId === "string" ? step.intentionId.trim() : ""
    if (!intentionRef) {
      stats.rejects.push({
        entity: "step",
        legacy_id: toStringId(step.id || step._id) || "unknown",
        reason: "missing_intention_id",
      })
      continue
    }

    const canonicalIntentionId = intentionIdMap.get(intentionRef) ?? toCanonicalId(intentionRef, "intention")

    const rawId = toStringId(step.id) || toStringId(step._id)
    const stepId = toCanonicalId(rawId, "step")
    if (rawId) {
      stepIdMap.set(rawId, stepId)
    }

    const mapped: StudentCanvasStep = {
      id: stepId,
      title:
        typeof step.title === "string" && step.title.trim().length > 0
          ? step.title
          : typeof step.text === "string" && step.text.trim().length > 0
            ? step.text
            : "Untitled step",
      description: typeof step.text === "string" ? step.text : undefined,
      bucket: normalizeBucket(step.bucket),
      order: typeof step.order === "number" ? step.order : 0,
      progress_status: normalizeProgress(step.status),
      created_at: toIsoString(step.createdAt, fallbackTime),
      updated_at: toIsoString(step.updatedAt, fallbackTime),
      opportunities: [],
    }

    const existing = stepsByIntention.get(canonicalIntentionId) ?? []
    existing.push(mapped)
    stepsByIntention.set(canonicalIntentionId, existing)
    stats.steps_migrated += 1
  }

  for (const opportunity of snapshot.opportunities) {
    const stepRefRaw = typeof opportunity.stepId === "string" ? opportunity.stepId.trim() : ""
    if (!stepRefRaw) {
      stats.rejects.push({
        entity: "opportunity",
        legacy_id: toStringId(opportunity._id) || "unknown",
        reason: "missing_step_id",
      })
      continue
    }

    const stepRef = stepIdMap.get(stepRefRaw) ?? toCanonicalId(stepRefRaw, "step")
    const parentStep = Array.from(stepsByIntention.values()).flat().find((candidate) => candidate.id === stepRef)
    if (!parentStep) {
      stats.rejects.push({
        entity: "opportunity",
        legacy_id: toStringId(opportunity._id) || "unknown",
        reason: `step_not_found:${stepRefRaw}`,
      })
      continue
    }

    const canonicalId = toCanonicalId(toStringId(opportunity._id), "opportunity")
    const mapped: StudentCanvasOpportunity = {
      id: canonicalId,
      title: typeof opportunity.title === "string" ? opportunity.title : "Untitled opportunity",
      description: typeof opportunity.summary === "string" ? opportunity.summary : undefined,
      decision_status: opportunity.status === "saved" ? "accepted" : "suggested",
      progress_status: undefined,
      source: opportunity.source === "kings-edge-simulated" ? "catalogue" : "free_text",
      catalogue_ref: opportunity.source === "kings-edge-simulated" ? buildCatalogueRef(canonicalId) : undefined,
      created_at: toIsoString(opportunity.createdAt, fallbackTime),
      updated_at: toIsoString(opportunity.updatedAt, fallbackTime),
    }

    parentStep.opportunities.push(mapped)
    stats.opportunities_migrated += 1
  }

  const enrichedIntentions = canonicalIntentions.map((intention) => ({
    ...intention,
    steps: (stepsByIntention.get(intention.id) ?? []).sort((a, b) => a.order - b.order),
  }))

  const document: StudentCanvasDocument = {
    schema_version: STUDENT_CANVAS_SCHEMA_VERSION,
    student_id: studentId,
    created_at: toIsoString(snapshot.intentionsDoc?.createdAt, fallbackTime),
    updated_at: toIsoString(snapshot.intentionsDoc?.updatedAt, fallbackTime),
    tutorial_state: snapshot.intentionsDoc?.tutorialState,
    canvas: {
      intentions: enrichedIntentions,
    },
  }

  return { document, stats }
}

export async function readLegacySnapshot(studentId: string): Promise<LegacySnapshot> {
  const { getCollection } = await import("@/lib/dbHelpers")
  const intentionsCollection = await getCollection<LegacyIntentionsDocument>("intentions")
  const stepsCollection = await getCollection<LegacyStepDocument>("steps")
  const opportunitiesCollection = await getCollection<LegacyOpportunityDocument>("opportunities")

  const [intentionsDoc, steps, opportunities] = await Promise.all([
    intentionsCollection.findOne({ user: studentId }),
    stepsCollection.find({ user: studentId }).toArray(),
    opportunitiesCollection.find({ user: studentId }).toArray(),
  ])

  return {
    intentionsDoc,
    steps,
    opportunities,
  }
}

export async function writeMigrationMarker(marker: MigrationMarker): Promise<void> {
  const { getCollection } = await import("@/lib/dbHelpers")
  const markers = await getCollection<MigrationMarker>(STUDENT_CANVAS_MIGRATION_COLLECTION)
  await markers.updateOne(
    { student_id: marker.student_id, schema_version: marker.schema_version },
    {
      $set: marker,
    },
    { upsert: true },
  )
}

export async function migrateStudentFromLegacy(studentId: string): Promise<StudentCanvasDocument | null> {
  const { getCollection } = await import("@/lib/dbHelpers")
  const { validateStudentCanvasDocument } = await import("@/lib/studentCanvas/validation")
  const snapshot = await readLegacySnapshot(studentId)
  const { document, stats } = assembleCanonicalDocument(studentId, snapshot)

  if (!document) {
    return null
  }
  const validation = validateStudentCanvasDocument(document)
  if (!validation.valid) {
    throw new Error(
      `Student canvas schema validation failed (migrateStudentFromLegacy): ${validation.issues
        .map((issue) => `${issue.path}:${issue.message}`)
        .join("; ")}`,
    )
  }

  const collection = await getCollection<StudentCanvasDocument>(STUDENT_CANVAS_PRIMARY_COLLECTION)
  await collection.updateOne(
    { student_id: studentId },
    {
      $set: {
        ...document,
        schema_version: STUDENT_CANVAS_SCHEMA_VERSION,
      },
      $setOnInsert: {
        created_at: document.created_at,
      },
    },
    { upsert: true },
  )

  await writeMigrationMarker({
    student_id: studentId,
    schema_version: STUDENT_CANVAS_SCHEMA_VERSION,
    status: "migrated",
    migrated_at: nowIso(),
    updated_at: nowIso(),
    counts: {
      intentions_total: stats.intentions_total,
      intentions_migrated: stats.intentions_migrated,
      steps_total: stats.steps_total,
      steps_migrated: stats.steps_migrated,
      opportunities_total: stats.opportunities_total,
      opportunities_migrated: stats.opportunities_migrated,
    },
    reject_count: stats.rejects.length,
    rejects: stats.rejects,
  })

  debug.info("StudentCanvas migration completed", {
    studentId,
    schemaVersion: STUDENT_CANVAS_SCHEMA_VERSION,
    counts: stats,
  })

  return document
}
