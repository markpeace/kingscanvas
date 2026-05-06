import { getCollection } from "@/lib/dbHelpers"
import { debug } from "@/lib/debug"
import {
  canonicalIdFromLegacyRef,
  createCanonicalId,
  isCanonicalId,
  nowIso,
  toIsoString,
} from "@/lib/studentCanvas/identity"
import {
  assembleCanonicalDocument,
  readLegacySnapshot,
  STUDENT_CANVAS_PRIMARY_COLLECTION,
  STUDENT_CANVAS_SCHEMA_VERSION,
  migrateStudentFromLegacy,
} from "@/lib/studentCanvas/migration"
import { isOpportunitySchemaCompliant } from "@/lib/studentCanvas/opportunityRules"
import { toCanonicalIntentionsFromUnknown } from "@/lib/studentCanvas/mappers"
import { assertValidStudentCanvasDocument } from "@/lib/studentCanvas/validation"
import type { TutorialState } from "@/lib/tutorial/state"
import type {
  Intention as StudentCanvasIntention,
  Opportunity as StudentCanvasOpportunity,
  Step as StudentCanvasStep,
  StudentCanvasDocument,
} from "@/types/studentCanvasV1"

const SCHEMA_VERSION = STUDENT_CANVAS_SCHEMA_VERSION
const PRIMARY_COLLECTION = STUDENT_CANVAS_PRIMARY_COLLECTION

type LegacyIntentionsDocument = {
  user: string
  intentions?: StudentCanvasIntention[]
  tutorialState?: TutorialState
  createdAt?: Date
  updatedAt?: Date
}

type PrimaryStudentCanvasDocument = StudentCanvasDocument & {
  tutorialState?: TutorialState
}

function buildCatalogueRef(opportunityId: string) {
  return {
    system: "legacy-opportunity",
    id: opportunityId,
  }
}

function buildEmptyDocument(studentId: string, timestamp: string): StudentCanvasDocument {
  return {
    schema_version: SCHEMA_VERSION,
    student_id: studentId,
    created_at: timestamp,
    updated_at: timestamp,
    canvas: {
      intentions: [],
    },
  }
}

function sanitizeStoredDocument(
  studentId: string,
  document: PrimaryStudentCanvasDocument | StudentCanvasDocument | null | undefined,
  timestamp: string = nowIso()
): StudentCanvasDocument {
  const tutorialState =
    document?.tutorial_state ??
    (document as PrimaryStudentCanvasDocument | null | undefined)?.tutorialState

  return {
    schema_version: SCHEMA_VERSION,
    student_id:
      typeof document?.student_id === "string" && document.student_id.trim().length > 0
        ? document.student_id
        : studentId,
    created_at: toIsoString(document?.created_at, timestamp),
    updated_at: toIsoString(document?.updated_at, timestamp),
    ...(tutorialState ? { tutorial_state: tutorialState } : {}),
    canvas: {
      intentions: toCanonicalIntentionsFromUnknown(document?.canvas?.intentions),
    },
  }
}

async function replaceCanonicalDocument(document: StudentCanvasDocument): Promise<void> {
  assertValidStudentCanvasDocument(document, "studentCanvas.replaceCanonicalDocument")
  const collection = await getPrimaryCollection()
  if (typeof collection.replaceOne === "function") {
    await collection.replaceOne({ student_id: document.student_id }, document, { upsert: true })
  } else {
    await collection.updateOne(
      { student_id: document.student_id },
      { $set: document, $unset: { tutorialState: "" } },
      { upsert: true }
    )
  }
  await mirrorLegacyIntentions(document.student_id, document.canvas.intentions)
}

function withUpdatedAt<T extends Record<string, unknown>>(
  record: T,
  timestamp: string
): T & { updated_at: string } {
  return {
    ...record,
    updated_at: timestamp,
  }
}

function applyStepPatch(
  step: StudentCanvasStep,
  patch: Record<string, unknown>,
  timestamp: string
): StudentCanvasStep {
  return withUpdatedAt(
    {
      ...step,
      ...patch,
    },
    timestamp
  ) as StudentCanvasStep
}

function applyOpportunityPatch(
  opportunity: StudentCanvasOpportunity,
  patch: Record<string, unknown>,
  timestamp: string
): StudentCanvasOpportunity {
  return withUpdatedAt(
    {
      ...opportunity,
      ...patch,
    },
    timestamp
  ) as StudentCanvasOpportunity
}

async function buildFromLegacy(studentId: string): Promise<StudentCanvasDocument | null> {
  const snapshot = await readLegacySnapshot(studentId)
  return assembleCanonicalDocument(studentId, snapshot).document
}

async function getPrimaryCollection() {
  return getCollection<StudentCanvasDocument>(PRIMARY_COLLECTION)
}

async function ensurePrimaryDocument(studentId: string): Promise<void> {
  const collection = await getCollection<PrimaryStudentCanvasDocument>(PRIMARY_COLLECTION)
  const existing = await collection.findOne({ student_id: studentId })

  if (existing?.schema_version === SCHEMA_VERSION) {
    assertValidStudentCanvasDocument(
      sanitizeStoredDocument(studentId, existing),
      "studentCanvas.ensurePrimaryDocument"
    )
    return
  }

  const timestamp = nowIso()
  await replaceCanonicalDocument(buildEmptyDocument(studentId, timestamp))
}

export async function getStudentCanvas(studentId: string): Promise<StudentCanvasDocument | null> {
  const collection = await getCollection<PrimaryStudentCanvasDocument>(PRIMARY_COLLECTION)
  const primary = await collection.findOne({ student_id: studentId })

  if (primary?.schema_version === SCHEMA_VERSION) {
    const document = sanitizeStoredDocument(studentId, primary)
    assertValidStudentCanvasDocument(document, "studentCanvas.getStudentCanvas")
    return document
  }

  if (primary) {
    debug.warn("StudentCanvas: stale primary schema, attempting lazy migration", {
      studentId,
      expectedSchemaVersion: SCHEMA_VERSION,
      currentSchemaVersion: primary.schema_version,
    })
  }

  const lazyMigrationEnabled = process.env.STUDENT_CANVAS_ENABLE_LAZY_MIGRATION === "true"
  if (lazyMigrationEnabled) {
    const migrated = await migrateStudentFromLegacy(studentId)
    if (migrated) {
      return migrated
    }
  }

  return buildFromLegacy(studentId)
}

async function mirrorLegacyIntentions(studentId: string, intentions: StudentCanvasIntention[]) {
  if (process.env.STUDENT_CANVAS_MIRROR_LEGACY_WRITES !== "true") {
    return
  }

  const collection = await getCollection<LegacyIntentionsDocument>("intentions")
  await collection.updateOne(
    { user: studentId },
    {
      $set: {
        user: studentId,
        intentions,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    },
    { upsert: true }
  )
}

export async function upsertStudentCanvas(
  studentId: string,
  payload: Partial<Pick<StudentCanvasDocument, "tutorial_state" | "canvas">>
): Promise<void> {
  const collection = await getCollection<PrimaryStudentCanvasDocument>(PRIMARY_COLLECTION)
  const timestamp = nowIso()
  const existing = await collection.findOne({ student_id: studentId })
  const current =
    existing?.schema_version === SCHEMA_VERSION
      ? sanitizeStoredDocument(studentId, existing, timestamp)
      : buildEmptyDocument(studentId, timestamp)

  const nextDocument: StudentCanvasDocument = {
    ...current,
    updated_at: timestamp,
    canvas: {
      intentions: Array.isArray(payload.canvas?.intentions)
        ? payload.canvas.intentions
        : current.canvas.intentions,
    },
  }

  if (Object.prototype.hasOwnProperty.call(payload, "tutorial_state")) {
    if (payload.tutorial_state) {
      nextDocument.tutorial_state = payload.tutorial_state
    } else {
      delete nextDocument.tutorial_state
    }
  }

  await replaceCanonicalDocument(nextDocument)
}

export async function patchIntentionById(
  studentId: string,
  intentionId: string,
  patch: Record<string, unknown>
) {
  await ensurePrimaryDocument(studentId)
  const canvas = await getStudentCanvas(studentId)
  const intentions = Array.isArray(canvas?.canvas.intentions) ? canvas.canvas.intentions : []
  const timestamp = nowIso()

  const nextIntentions = intentions.map((intention) => {
    if (intention?.id !== intentionId) {
      return intention
    }

    return withUpdatedAt({ ...intention, ...patch }, timestamp) as StudentCanvasIntention
  })

  await upsertStudentCanvas(studentId, { canvas: { intentions: nextIntentions } })
}

function stepMatchesId(step: StudentCanvasStep, stepId: string): boolean {
  if (step.id === stepId) {
    return true
  }

  if (!isCanonicalId(stepId) && step.id === canonicalIdFromLegacyRef(stepId, "step")) {
    return true
  }

  return false
}

function opportunityMatchesId(
  opportunity: StudentCanvasOpportunity,
  opportunityId: string
): boolean {
  if (opportunity.id === opportunityId) {
    return true
  }

  if (
    !isCanonicalId(opportunityId) &&
    opportunity.id === canonicalIdFromLegacyRef(opportunityId, "opportunity")
  ) {
    return true
  }

  return false
}

export async function patchStepById(
  studentId: string,
  stepId: string,
  patch: Record<string, unknown>
) {
  await ensurePrimaryDocument(studentId)
  const canvas = await getStudentCanvas(studentId)
  const intentions = Array.isArray(canvas?.canvas.intentions) ? canvas.canvas.intentions : []
  const timestamp = nowIso()

  const nextIntentions = intentions.map((intention) => {
    const steps = Array.isArray(intention?.steps) ? intention.steps : []
    const nextSteps = steps.map((step) => {
      if (!stepMatchesId(step, stepId)) {
        return step
      }

      return applyStepPatch(step, patch, timestamp)
    })

    return withUpdatedAt({ ...intention, steps: nextSteps }, timestamp) as StudentCanvasIntention
  })

  await upsertStudentCanvas(studentId, { canvas: { intentions: nextIntentions } })
}

export async function patchOpportunityById(
  studentId: string,
  stepId: string,
  opportunityId: string,
  patch: Record<string, unknown>
) {
  await ensurePrimaryDocument(studentId)
  const canvas = await getStudentCanvas(studentId)
  const intentions = Array.isArray(canvas?.canvas.intentions) ? canvas.canvas.intentions : []
  const timestamp = nowIso()

  const nextIntentions = intentions.map((intention) => {
    const steps = Array.isArray(intention?.steps) ? intention.steps : []

    const nextSteps = steps.map((step) => {
      if (!stepMatchesId(step, stepId)) {
        return step
      }

      const opportunities = Array.isArray(step?.opportunities) ? step.opportunities : []
      const nextOpportunities = opportunities.map((opportunity) => {
        if (!opportunityMatchesId(opportunity, opportunityId)) {
          return opportunity
        }

        return applyOpportunityPatch(opportunity, patch, timestamp)
      })

      return applyStepPatch(
        {
          ...step,
          opportunities: nextOpportunities,
        },
        {},
        timestamp
      )
    })

    return withUpdatedAt({ ...intention, steps: nextSteps }, timestamp) as StudentCanvasIntention
  })

  await upsertStudentCanvas(studentId, { canvas: { intentions: nextIntentions } })
}

export async function getStudentTutorialState(
  studentId: string
): Promise<TutorialState | undefined> {
  const canvas = await getStudentCanvas(studentId)
  return canvas?.tutorial_state
}

export async function saveStudentTutorialState(
  studentId: string,
  tutorialState: TutorialState
): Promise<void> {
  await upsertStudentCanvas(studentId, { tutorial_state: tutorialState })
}

export async function getStudentIntentions(studentId: string): Promise<StudentCanvasIntention[]> {
  const canvas = await getStudentCanvas(studentId)
  return Array.isArray(canvas?.canvas.intentions) ? canvas.canvas.intentions : []
}

export async function saveStudentIntentions(
  studentId: string,
  intentions: StudentCanvasIntention[]
): Promise<void> {
  const existing = await getStudentCanvas(studentId)
  const timestamp = nowIso()
  const candidateDocument: StudentCanvasDocument = {
    schema_version: SCHEMA_VERSION,
    student_id: studentId,
    created_at: existing?.created_at ?? timestamp,
    updated_at: timestamp,
    canvas: { intentions },
    ...(existing?.tutorial_state ? { tutorial_state: existing.tutorial_state } : {}),
  }

  assertValidStudentCanvasDocument(candidateDocument, "saveStudentIntentions")

  await upsertStudentCanvas(studentId, { canvas: { intentions } })
}

export async function getStudentSteps(studentId: string): Promise<StudentCanvasStep[]> {
  const intentions = await getStudentIntentions(studentId)
  return intentions.flatMap((intention) => (Array.isArray(intention?.steps) ? intention.steps : []))
}

type RawStepInput = Partial<StudentCanvasStep> & {
  _id?: string
  intentionId?: string
  status?: string
}

function toProgressStatus(status: unknown): StudentCanvasStep["progress_status"] {
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
      return "not_started"
  }
}

export async function upsertStudentStep(
  studentId: string,
  step: RawStepInput
): Promise<{ stepId: string }> {
  const canvas = await getStudentCanvas(studentId)
  const intentions = Array.isArray(canvas?.canvas.intentions) ? canvas.canvas.intentions : []
  const timestamp = nowIso()

  const providedId =
    typeof step?.id === "string" && step.id.trim().length > 0
      ? step.id.trim()
      : typeof step?._id === "string" && step._id.trim().length > 0
        ? step._id.trim()
        : ""

  const stepId =
    providedId.length === 0
      ? createCanonicalId()
      : isCanonicalId(providedId)
        ? providedId
        : canonicalIdFromLegacyRef(providedId, "step")
  const intentionId = typeof step?.intentionId === "string" ? step.intentionId : ""

  const nextIntentions = intentions.map((intention) => {
    if (intention?.id !== intentionId) {
      return intention
    }

    const steps = Array.isArray(intention?.steps) ? intention.steps : []
    const existingIndex = steps.findIndex((item) => stepMatchesId(item, providedId || stepId))

    const nextStep: StudentCanvasStep = {
      id: stepId,
      title:
        typeof step.title === "string" && step.title.trim().length > 0
          ? step.title
          : typeof step.description === "string" && step.description.trim().length > 0
            ? step.description
            : "Untitled step",
      description: typeof step.description === "string" ? step.description : undefined,
      bucket:
        step.bucket === "do_later" ||
        step.bucket === "before_graduation" ||
        step.bucket === "after_graduation" ||
        step.bucket === "do_now"
          ? step.bucket
          : "do_now",
      order: typeof step.order === "number" ? step.order : 0,
      progress_status: toProgressStatus(step.status ?? step.progress_status),
      created_at:
        existingIndex >= 0
          ? toIsoString(steps[existingIndex].created_at, timestamp)
          : toIsoString(step.created_at, timestamp),
      updated_at: timestamp,
      opportunities: Array.isArray(step.opportunities)
        ? step.opportunities
        : existingIndex >= 0 && Array.isArray(steps[existingIndex].opportunities)
          ? steps[existingIndex].opportunities
          : [],
    }

    const nextSteps = existingIndex >= 0 ? [...steps] : [...steps, nextStep]
    if (existingIndex >= 0) {
      nextSteps[existingIndex] = nextStep
    }

    return withUpdatedAt({ ...intention, steps: nextSteps }, timestamp) as StudentCanvasIntention
  })

  await upsertStudentCanvas(studentId, { canvas: { intentions: nextIntentions } })
  return { stepId }
}

export async function createSuggestedStudentSteps(
  studentId: string,
  intentionId: string,
  suggestions: Array<Partial<StudentCanvasStep>>
): Promise<{ insertedIds: string[] }> {
  const insertedIds: string[] = []

  for (const suggestion of suggestions) {
    const stepId = createCanonicalId()
    insertedIds.push(stepId)
    await upsertStudentStep(studentId, {
      ...suggestion,
      id: stepId,
      intentionId,
      status: "suggested",
    })
  }

  return { insertedIds }
}

export async function updateStudentStepStatus(
  studentId: string,
  stepId: string,
  status: string
): Promise<boolean> {
  await patchStepById(studentId, stepId, { progress_status: toProgressStatus(status) })
  return true
}

export async function getStudentStepById(
  studentId: string,
  stepId: string
): Promise<StudentCanvasStep | null> {
  const steps = await getStudentSteps(studentId)
  return steps.find((step) => stepMatchesId(step, stepId)) ?? null
}

export async function getStudentOpportunitiesByStep(
  studentId: string,
  stepId: string
): Promise<StudentCanvasOpportunity[]> {
  const step = await getStudentStepById(studentId, stepId)
  return Array.isArray(step?.opportunities) ? step.opportunities : []
}

export async function replaceStudentOpportunitiesByStep(
  studentId: string,
  stepId: string,
  opportunities: Array<Partial<StudentCanvasOpportunity> & { _id?: string }>
): Promise<StudentCanvasOpportunity[]> {
  const timestamp = nowIso()
  const next = opportunities.map((opportunity) => {
    const providedId =
      typeof opportunity?.id === "string" && opportunity.id.trim().length > 0
        ? opportunity.id.trim()
        : typeof opportunity?._id === "string" && opportunity._id.trim().length > 0
          ? opportunity._id.trim()
          : ""

    const id =
      providedId.length === 0
        ? createCanonicalId()
        : isCanonicalId(providedId)
          ? providedId
          : canonicalIdFromLegacyRef(providedId, "opportunity")

    const mapped: StudentCanvasOpportunity = {
      id,
      title: typeof opportunity.title === "string" ? opportunity.title : "Untitled opportunity",
      description:
        typeof opportunity.description === "string" ? opportunity.description : undefined,
      decision_status: opportunity.decision_status === "accepted" ? "accepted" : "suggested",
      progress_status:
        opportunity.progress_status && opportunity.decision_status !== "accepted"
          ? undefined
          : opportunity.progress_status,
      source: opportunity.source === "catalogue" ? "catalogue" : "free_text",
      catalogue_ref:
        opportunity.source === "catalogue"
          ? (opportunity.catalogue_ref ?? buildCatalogueRef(id))
          : undefined,
      created_at: toIsoString(opportunity?.created_at, timestamp),
      updated_at: timestamp,
    }

    if (!isOpportunitySchemaCompliant(mapped)) {
      throw new Error("Invalid opportunity payload")
    }

    return mapped
  })

  await patchStepById(studentId, stepId, { opportunities: next })
  return next
}

export async function getStudentIntentionTitle(
  studentId: string,
  intentionId?: string
): Promise<string | undefined> {
  if (!intentionId) {
    return undefined
  }

  const intentions = await getStudentIntentions(studentId)
  const match = intentions.find((item) => item?.id === intentionId)
  const title = match?.title

  if (typeof title === "string" && title.trim().length > 0) {
    return title
  }

  return undefined
}

export async function listRecentStudentStepHistory(
  studentId: string,
  intentionId: string,
  limit = 25
) {
  const intentions = await getStudentIntentions(studentId)
  const targetIntention = intentions.find((intention) => intention.id === intentionId)
  const steps = Array.isArray(targetIntention?.steps) ? targetIntention.steps : []
  const filtered = steps
    .filter(
      (step) => step?.progress_status === "in_progress" || step?.progress_status === "abandoned"
    )
    .sort((a, b) => new Date(b?.updated_at ?? 0).getTime() - new Date(a?.updated_at ?? 0).getTime())
    .slice(0, limit)

  const accepted = filtered
    .filter((step) => step?.progress_status === "in_progress")
    .map((step) => step?.title)
    .filter((value): value is string => typeof value === "string")
  const rejected = filtered
    .filter((step) => step?.progress_status === "abandoned")
    .map((step) => step?.title)
    .filter((value): value is string => typeof value === "string")

  debug.info("StudentCanvas: step history loaded", {
    studentId,
    intentionId,
    accepted: accepted.length,
    rejected: rejected.length,
  })

  return { accepted, rejected }
}
