import { getCollection } from "@/lib/dbHelpers"
import { debug } from "@/lib/debug"
import { canonicalIdFromLegacyRef, createCanonicalId, isCanonicalId, nowIso, toIsoString } from "@/lib/studentCanvas/identity"
import { isOpportunitySchemaCompliant } from "@/lib/studentCanvas/opportunityRules"
import { assertValidStudentCanvasDocument } from "@/lib/studentCanvas/validation"
import type { TutorialState } from "@/lib/tutorial/state"
import type {
  Intention as StudentCanvasIntention,
  Opportunity as StudentCanvasOpportunity,
  Step as StudentCanvasStep,
  StudentCanvasDocument,
} from "@/types/studentCanvasV1"

const SCHEMA_VERSION = "1.0.0" as const
const PRIMARY_COLLECTION = "student_canvas"

type LegacyIntentionsDocument = {
  user: string
  intentions?: StudentCanvasIntention[]
  tutorialState?: TutorialState
  createdAt?: Date
  updatedAt?: Date
}

type LegacyStepDocument = {
  _id?: string | { toHexString?: () => string; toString?: () => string }
  id?: string
  user: string
  intentionId?: string
  createdAt?: Date | string
  updatedAt?: Date | string
  [key: string]: unknown
}

type LegacyOpportunityDocument = {
  _id: string | { toHexString?: () => string; toString?: () => string }
  user: string
  stepId: string
  createdAt?: Date | string
  updatedAt?: Date | string
  [key: string]: unknown
}

function buildCatalogueRef(opportunityId: string) {
  return {
    system: "legacy-opportunity",
    id: opportunityId,
  }
}

function toStepId(step: LegacyStepDocument): string {
  const legacyId = typeof step.id === "string" ? step.id.trim() : ""
  if (isCanonicalId(legacyId)) {
    return legacyId
  }
  if (legacyId.length > 0) {
    return canonicalIdFromLegacyRef(legacyId, "step")
  }

  const legacyRawId = step._id
  if (typeof legacyRawId === "string" && isCanonicalId(legacyRawId.trim())) {
    return legacyRawId.trim()
  }
  if (typeof legacyRawId === "string" && legacyRawId.trim().length > 0) {
    return canonicalIdFromLegacyRef(legacyRawId.trim(), "step")
  }
  if (legacyRawId && typeof legacyRawId === "object") {
    const stringified =
      typeof legacyRawId.toHexString === "function"
        ? legacyRawId.toHexString()
        : typeof legacyRawId.toString === "function"
          ? legacyRawId.toString()
          : ""
    if (stringified.trim().length > 0) {
      return canonicalIdFromLegacyRef(stringified.trim(), "step")
    }
  }

  return createCanonicalId()
}

function toOpportunityId(opportunity: LegacyOpportunityDocument): string {
  const legacyId = typeof opportunity._id === "string" ? opportunity._id.trim() : ""
  if (isCanonicalId(legacyId)) {
    return legacyId
  }

  const ref =
    typeof opportunity._id === "string"
      ? opportunity._id
      : typeof opportunity._id?.toHexString === "function"
        ? opportunity._id.toHexString()
        : String(opportunity._id)
  return canonicalIdFromLegacyRef(ref, "opportunity")
}

function withUpdatedAt<T extends Record<string, unknown>>(record: T, timestamp: string): T & { updated_at: string } {
  return {
    ...record,
    updated_at: timestamp,
  }
}

function applyStepPatch(step: StudentCanvasStep, patch: Record<string, unknown>, timestamp: string): StudentCanvasStep {
  return withUpdatedAt(
    {
      ...step,
      ...patch,
    },
    timestamp,
  ) as StudentCanvasStep
}

function applyOpportunityPatch(
  opportunity: StudentCanvasOpportunity,
  patch: Record<string, unknown>,
  timestamp: string,
): StudentCanvasOpportunity {
  return withUpdatedAt(
    {
      ...opportunity,
      ...patch,
    },
    timestamp,
  ) as StudentCanvasOpportunity
}

async function buildFromLegacy(studentId: string): Promise<StudentCanvasDocument | null> {
  const intentionsCollection = await getCollection<LegacyIntentionsDocument>("intentions")
  const stepsCollection = await getCollection<LegacyStepDocument>("steps")
  const opportunitiesCollection = await getCollection<LegacyOpportunityDocument>("opportunities")

  const [legacyIntentions, legacySteps, legacyOpportunities] = await Promise.all([
    intentionsCollection.findOne({ user: studentId }),
    stepsCollection.find({ user: studentId }).toArray(),
    opportunitiesCollection.find({ user: studentId }).toArray(),
  ])

  if (!legacyIntentions && legacySteps.length === 0 && legacyOpportunities.length === 0) {
    return null
  }

  const fallbackTime = nowIso()
  const opportunitiesByStep = new Map<string, StudentCanvasOpportunity[]>()

  for (const opportunity of legacyOpportunities) {
    const stepId = String(opportunity.stepId)
    const canonicalId = toOpportunityId(opportunity)
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

    const existing = opportunitiesByStep.get(stepId) ?? []
    existing.push(mapped)
    opportunitiesByStep.set(stepId, existing)
  }

  const stepsByIntention = new Map<string, StudentCanvasStep[]>()

  for (const step of legacySteps) {
    const intentionId = typeof step.intentionId === "string" ? step.intentionId : ""
    if (!intentionId) {
      continue
    }

    const stepId = toStepId(step)
    const mapped: StudentCanvasStep = {
      id: stepId,
      title:
        typeof step.title === "string" && step.title.trim().length > 0
          ? step.title
          : typeof step.text === "string" && step.text.trim().length > 0
            ? step.text
            : "Untitled step",
      description: typeof step.text === "string" ? step.text : undefined,
      bucket:
        step.bucket === "do_later" ||
        step.bucket === "before_graduation" ||
        step.bucket === "after_graduation" ||
        step.bucket === "do_now"
          ? step.bucket
          : step.bucket === "do-later"
            ? "do_later"
            : step.bucket === "before-graduation"
              ? "before_graduation"
              : step.bucket === "after-graduation"
                ? "after_graduation"
                : "do_now",
      order: typeof step.order === "number" ? step.order : 0,
      progress_status:
        step.status === "accepted"
          ? "in_progress"
          : step.status === "completed"
            ? "completed"
            : step.status === "rejected"
              ? "abandoned"
              : "not_started",
      created_at: toIsoString(step.createdAt, fallbackTime),
      updated_at: toIsoString(step.updatedAt, fallbackTime),
      opportunities: opportunitiesByStep.get(stepId) ?? [],
    }

    const existing = stepsByIntention.get(intentionId) ?? []
    existing.push(mapped)
    stepsByIntention.set(intentionId, existing)
  }

  const intentions = Array.isArray(legacyIntentions?.intentions) ? legacyIntentions.intentions : []

  const mergedIntentions = intentions.map((intention) => {
    const intentionId = typeof intention?.id === "string" ? intention.id : ""
    return {
      ...intention,
      steps: intentionId ? stepsByIntention.get(intentionId) ?? [] : [],
      updated_at: toIsoString(intention?.updated_at, fallbackTime),
      created_at: toIsoString(intention?.created_at, fallbackTime),
    }
  })

  return {
    schema_version: SCHEMA_VERSION,
    student_id: studentId,
    created_at: toIsoString(legacyIntentions?.createdAt, fallbackTime),
    updated_at: toIsoString(legacyIntentions?.updatedAt, fallbackTime),
    tutorial_state: legacyIntentions?.tutorialState,
    canvas: {
      intentions: mergedIntentions,
    },
  }
}

async function getPrimaryCollection() {
  return getCollection<StudentCanvasDocument>(PRIMARY_COLLECTION)
}

async function ensurePrimaryDocument(studentId: string): Promise<void> {
  const timestamp = nowIso()
  const collection = await getPrimaryCollection()
  await collection.updateOne(
    { student_id: studentId },
    {
      $set: {
        student_id: studentId,
        schema_version: SCHEMA_VERSION,
        updated_at: timestamp,
      },
      $setOnInsert: {
        created_at: timestamp,
        canvas: {
          intentions: [],
        },
      },
    },
    { upsert: true },
  )
}

export async function getStudentCanvas(studentId: string): Promise<StudentCanvasDocument | null> {
  const collection = await getPrimaryCollection()
  const primary = await collection.findOne({ student_id: studentId })

  if (primary) {
    return {
      ...primary,
      schema_version: SCHEMA_VERSION,
      canvas: {
        intentions: Array.isArray(primary.canvas?.intentions) ? primary.canvas.intentions : [],
      },
    }
  }

  return buildFromLegacy(studentId)
}

async function mirrorLegacyIntentions(studentId: string, intentions: StudentCanvasIntention[], tutorialState?: TutorialState) {
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
        ...(tutorialState ? { tutorialState } : {}),
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    },
    { upsert: true },
  )
}

export async function upsertStudentCanvas(
  studentId: string,
  payload: Partial<Pick<StudentCanvasDocument, "tutorial_state" | "canvas">>,
): Promise<void> {
  const collection = await getPrimaryCollection()
  const timestamp = nowIso()

  const existing = await collection.findOne({ student_id: studentId })
  const currentIntentions = Array.isArray(existing?.canvas?.intentions) ? existing.canvas.intentions : []

  const nextIntentions = Array.isArray(payload.canvas?.intentions) ? payload.canvas?.intentions : currentIntentions

  const update: Record<string, unknown> = {
    student_id: studentId,
    schema_version: SCHEMA_VERSION,
    updated_at: timestamp,
    canvas: {
      intentions: nextIntentions,
    },
  }

  if (Object.prototype.hasOwnProperty.call(payload, "tutorial_state")) {
    update.tutorial_state = payload.tutorial_state
  }

  await collection.updateOne(
    { student_id: studentId },
    {
      $set: update,
      $setOnInsert: {
        created_at: timestamp,
      },
    },
    { upsert: true },
  )

  await mirrorLegacyIntentions(studentId, nextIntentions, payload.tutorial_state)
}

export async function patchIntentionById(studentId: string, intentionId: string, patch: Record<string, unknown>) {
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
  opportunityId: string,
): boolean {
  if (opportunity.id === opportunityId) {
    return true
  }

  if (!isCanonicalId(opportunityId) && opportunity.id === canonicalIdFromLegacyRef(opportunityId, "opportunity")) {
    return true
  }

  return false
}

export async function patchStepById(studentId: string, stepId: string, patch: Record<string, unknown>) {
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
  patch: Record<string, unknown>,
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
        timestamp,
      )
    })

    return withUpdatedAt({ ...intention, steps: nextSteps }, timestamp) as StudentCanvasIntention
  })

  await upsertStudentCanvas(studentId, { canvas: { intentions: nextIntentions } })
}

export async function getStudentTutorialState(studentId: string): Promise<TutorialState | undefined> {
  const canvas = await getStudentCanvas(studentId)
  return canvas?.tutorial_state
}

export async function saveStudentTutorialState(studentId: string, tutorialState: TutorialState): Promise<void> {
  await upsertStudentCanvas(studentId, { tutorial_state: tutorialState })
}

export async function getStudentIntentions(studentId: string): Promise<StudentCanvasIntention[]> {
  const canvas = await getStudentCanvas(studentId)
  return Array.isArray(canvas?.canvas.intentions) ? canvas.canvas.intentions : []
}

export async function saveStudentIntentions(studentId: string, intentions: StudentCanvasIntention[]): Promise<void> {
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

export async function upsertStudentStep(studentId: string, step: RawStepInput): Promise<{ stepId: string }> {
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
    providedId.length === 0 ? createCanonicalId() : isCanonicalId(providedId) ? providedId : canonicalIdFromLegacyRef(providedId, "step")
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
      opportunities:
        Array.isArray(step.opportunities)
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
  suggestions: Array<Partial<StudentCanvasStep>>,
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

export async function updateStudentStepStatus(studentId: string, stepId: string, status: string): Promise<boolean> {
  await patchStepById(studentId, stepId, { progress_status: toProgressStatus(status) })
  return true
}

export async function getStudentStepById(studentId: string, stepId: string): Promise<StudentCanvasStep | null> {
  const steps = await getStudentSteps(studentId)
  return steps.find((step) => stepMatchesId(step, stepId)) ?? null
}

export async function getStudentOpportunitiesByStep(studentId: string, stepId: string): Promise<StudentCanvasOpportunity[]> {
  const step = await getStudentStepById(studentId, stepId)
  return Array.isArray(step?.opportunities) ? step.opportunities : []
}

export async function replaceStudentOpportunitiesByStep(
  studentId: string,
  stepId: string,
  opportunities: Array<Partial<StudentCanvasOpportunity> & { _id?: string }>,
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
      description: typeof opportunity.description === "string" ? opportunity.description : undefined,
      decision_status: opportunity.decision_status === "accepted" ? "accepted" : "suggested",
      progress_status:
        opportunity.progress_status && opportunity.decision_status !== "accepted" ? undefined : opportunity.progress_status,
      source: opportunity.source === "catalogue" ? "catalogue" : "free_text",
      catalogue_ref: opportunity.source === "catalogue" ? opportunity.catalogue_ref ?? buildCatalogueRef(id) : undefined,
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

export async function getStudentIntentionTitle(studentId: string, intentionId?: string): Promise<string | undefined> {
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

export async function listRecentStudentStepHistory(studentId: string, intentionId: string, limit = 25) {
  const intentions = await getStudentIntentions(studentId)
  const targetIntention = intentions.find((intention) => intention.id === intentionId)
  const steps = Array.isArray(targetIntention?.steps) ? targetIntention.steps : []
  const filtered = steps
    .filter((step) => step?.progress_status === "in_progress" || step?.progress_status === "abandoned")
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
