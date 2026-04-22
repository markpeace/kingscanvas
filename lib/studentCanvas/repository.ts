import { ObjectId } from "mongodb"

import { getCollection } from "@/lib/dbHelpers"
import { debug } from "@/lib/debug"
import type { TutorialState } from "@/lib/tutorial/state"
import { assertValidStudentCanvasDocument } from "@/lib/studentCanvas/validation"
import type {
  Intention as StudentCanvasIntention,
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
  _id?: ObjectId | string
  id?: string
  user: string
  intentionId?: string
  createdAt?: Date | string
  updatedAt?: Date | string
  [key: string]: unknown
}

type LegacyOpportunityDocument = {
  _id: ObjectId | string
  user: string
  stepId: string
  createdAt?: Date | string
  updatedAt?: Date | string
  [key: string]: unknown
}

function nowIso(): string {
  return new Date().toISOString()
}

function toIso(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.trim().length > 0) {
    return value
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  return fallback
}

function toStepId(step: LegacyStepDocument): string {
  if (typeof step.id === "string" && step.id.trim().length > 0) {
    return step.id
  }

  const rawId = step._id
  if (typeof rawId === "string" && rawId.trim().length > 0) {
    return rawId
  }

  if (rawId instanceof ObjectId) {
    return rawId.toHexString()
  }

  return new ObjectId().toHexString()
}

function toOpportunityId(opportunity: LegacyOpportunityDocument): string {
  if (typeof opportunity._id === "string") {
    return opportunity._id
  }

  if (opportunity._id instanceof ObjectId) {
    return opportunity._id.toHexString()
  }

  return String(opportunity._id)
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
  const opportunitiesByStep = new Map<string, any[]>()
  for (const opportunity of legacyOpportunities) {
    const stepId = String(opportunity.stepId)
    const mapped = {
      ...opportunity,
      id: toOpportunityId(opportunity),
      _id: toOpportunityId(opportunity),
      createdAt: toIso(opportunity.createdAt, fallbackTime),
      updatedAt: toIso(opportunity.updatedAt, fallbackTime),
    }

    const existing = opportunitiesByStep.get(stepId) ?? []
    existing.push(mapped)
    opportunitiesByStep.set(stepId, existing)
  }

  const stepsByIntention = new Map<string, any[]>()

  for (const step of legacySteps) {
    const intentionId = typeof step.intentionId === "string" ? step.intentionId : ""
    if (!intentionId) {
      continue
    }

    const stepId = toStepId(step)
    const mapped = {
      ...step,
      id: stepId,
      _id: stepId,
      createdAt: toIso(step.createdAt, fallbackTime),
      updatedAt: toIso(step.updatedAt, fallbackTime),
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
    }
  })

  return {
    schema_version: SCHEMA_VERSION,
    student_id: studentId,
    created_at: toIso(legacyIntentions?.createdAt, fallbackTime),
    updated_at: toIso(legacyIntentions?.updatedAt, fallbackTime),
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
    { upsert: true }
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
    { upsert: true }
  )
}

export async function upsertStudentCanvas(
  studentId: string,
  payload: Partial<Pick<StudentCanvasDocument, "tutorial_state" | "canvas">>
): Promise<void> {
  const collection = await getPrimaryCollection()
  const timestamp = nowIso()

  const existing = await collection.findOne({ student_id: studentId })
  const currentIntentions = Array.isArray(existing?.canvas?.intentions) ? existing.canvas.intentions : []

  const nextIntentions = Array.isArray(payload.canvas?.intentions)
    ? payload.canvas?.intentions
    : currentIntentions

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
    { upsert: true }
  )

  await mirrorLegacyIntentions(studentId, nextIntentions, payload.tutorial_state)
}

export async function patchIntentionById(studentId: string, intentionId: string, patch: Record<string, unknown>) {
  await ensurePrimaryDocument(studentId)
  const canvas = await getStudentCanvas(studentId)
  const intentions = Array.isArray(canvas?.canvas.intentions) ? canvas.canvas.intentions : []

  const nextIntentions = intentions.map((intention) => {
    if (intention?.id !== intentionId) {
      return intention
    }

    return { ...intention, ...patch }
  })

  await upsertStudentCanvas(studentId, { canvas: { intentions: nextIntentions } })
}

export async function patchStepById(studentId: string, stepId: string, patch: Record<string, unknown>) {
  await ensurePrimaryDocument(studentId)
  const canvas = await getStudentCanvas(studentId)
  const intentions = Array.isArray(canvas?.canvas.intentions) ? canvas.canvas.intentions : []

  const nextIntentions = intentions.map((intention) => {
    const steps = Array.isArray(intention?.steps) ? intention.steps : []
    return {
      ...intention,
      steps: steps.map((step: any) => {
        if (step?.id !== stepId && step?._id !== stepId) {
          return step
        }

        return { ...step, ...patch }
      }),
    }
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

  const nextIntentions = intentions.map((intention) => {
    const steps = Array.isArray(intention?.steps) ? intention.steps : []

    return {
      ...intention,
      steps: steps.map((step: any) => {
        const currentStepId = step?.id ?? step?._id
        if (currentStepId !== stepId) {
          return step
        }

        const opportunities = Array.isArray(step?.opportunities) ? step.opportunities : []

        return {
          ...step,
          opportunities: opportunities.map((opportunity: any) => {
            const currentOpportunityId = opportunity?.id ?? opportunity?._id
            if (currentOpportunityId !== opportunityId) {
              return opportunity
            }

            return { ...opportunity, ...patch }
          }),
        }
      }),
    }
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

export async function getStudentSteps(studentId: string): Promise<any[]> {
  const intentions = await getStudentIntentions(studentId)
  return intentions.flatMap((intention) => (Array.isArray(intention?.steps) ? intention.steps : []))
}

export async function upsertStudentStep(studentId: string, step: any): Promise<{ stepId: string }> {
  const canvas = await getStudentCanvas(studentId)
  const intentions = Array.isArray(canvas?.canvas.intentions) ? canvas.canvas.intentions : []
  const timestamp = nowIso()
  const stepId =
    typeof step?.id === "string" && step.id.trim().length > 0
      ? step.id
      : typeof step?._id === "string" && step._id.trim().length > 0
      ? step._id
      : new ObjectId().toHexString()

  const intentionId = typeof step?.intentionId === "string" ? step.intentionId : ""
  const nextIntentions = intentions.map((intention) => {
    if (intention?.id !== intentionId) {
      return intention
    }

    const steps = Array.isArray(intention?.steps) ? (intention.steps as any[]) : []
    const existingIndex = steps.findIndex((item: any) => item?.id === stepId || item?._id === stepId)

    const nextStep = {
      ...step,
      id: stepId,
      _id: stepId,
      user: studentId,
      createdAt: toIso(
        steps[existingIndex]?.createdAt ?? steps[existingIndex]?.created_at ?? step?.createdAt ?? step?.created_at,
        timestamp
      ),
      updatedAt: timestamp,
      opportunities: Array.isArray(step?.opportunities)
        ? step.opportunities
        : Array.isArray(steps[existingIndex]?.opportunities)
        ? steps[existingIndex].opportunities
        : [],
    }

    if (existingIndex >= 0) {
      const cloned = [...steps]
      cloned[existingIndex] = nextStep
      return { ...intention, steps: cloned }
    }

    return { ...intention, steps: [...steps, nextStep] }
  })

  await upsertStudentCanvas(studentId, { canvas: { intentions: nextIntentions } })
  return { stepId }
}

export async function createSuggestedStudentSteps(
  studentId: string,
  intentionId: string,
  suggestions: any[]
): Promise<{ insertedIds: string[] }> {
  const insertedIds: string[] = []

  for (const suggestion of suggestions) {
    const stepId = new ObjectId().toHexString()
    insertedIds.push(stepId)
    await upsertStudentStep(studentId, {
      ...suggestion,
      id: stepId,
      intentionId,
      status: suggestion?.status ?? "suggested",
    })
  }

  return { insertedIds }
}

export async function updateStudentStepStatus(studentId: string, stepId: string, status: string): Promise<boolean> {
  const timestamp = nowIso()
  await patchStepById(studentId, stepId, { status, updatedAt: timestamp })
  return true
}

export async function getStudentStepById(studentId: string, stepId: string): Promise<any | null> {
  const steps = await getStudentSteps(studentId)
  return steps.find((step) => step?.id === stepId || step?._id === stepId) ?? null
}

export async function getStudentOpportunitiesByStep(studentId: string, stepId: string): Promise<any[]> {
  const step = await getStudentStepById(studentId, stepId)
  return Array.isArray(step?.opportunities) ? step.opportunities : []
}

export async function replaceStudentOpportunitiesByStep(
  studentId: string,
  stepId: string,
  opportunities: any[]
): Promise<any[]> {
  const timestamp = nowIso()
  const next = opportunities.map((opportunity) => {
    const id =
      typeof opportunity?.id === "string" && opportunity.id.trim().length > 0
        ? opportunity.id
        : typeof opportunity?._id === "string" && opportunity._id.trim().length > 0
        ? opportunity._id
        : new ObjectId().toHexString()

    return {
      ...opportunity,
      id,
      _id: id,
      createdAt: toIso(opportunity?.createdAt, timestamp),
      updatedAt: timestamp,
    }
  })

  await patchStepById(studentId, stepId, { opportunities: next, updatedAt: timestamp })
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
  const steps = await getStudentSteps(studentId)
  const filtered = steps
    .filter(
      (step) =>
        step?.intentionId === intentionId &&
        (step?.status === "accepted" || step?.status === "rejected")
    )
    .sort((a, b) => {
      const aTime = new Date(a?.updatedAt ?? 0).getTime()
      const bTime = new Date(b?.updatedAt ?? 0).getTime()
      return bTime - aTime
    })
    .slice(0, limit)

  const accepted = filtered.filter((step) => step?.status === "accepted").map((step) => step?.text)
  const rejected = filtered.filter((step) => step?.status === "rejected").map((step) => step?.text)

  debug.info("StudentCanvas: step history loaded", {
    studentId,
    intentionId,
    accepted: accepted.length,
    rejected: rejected.length,
  })

  return { accepted, rejected }
}
