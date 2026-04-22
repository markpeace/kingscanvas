import { createHash, randomUUID } from "node:crypto"

import { z } from "zod"

const SCHEMA_VERSION = "1.0.0" as const

const CanvasBucketSchema = z.enum([
  "do_now",
  "do_later",
  "before_graduation",
  "after_graduation",
])

const ProgressStatusSchema = z.enum([
  "not_started",
  "in_progress",
  "completed",
  "abandoned",
])

const OpportunityDecisionStatusSchema = z.enum(["suggested", "accepted"])
const OpportunitySourceSchema = z.enum(["catalogue", "free_text"])

const CatalogueRefSchema = z.object({
  system: z.string().min(1),
  id: z.string().min(1),
})

const OpportunitySchema = z
  .object({
    id: z.string().uuid(),
    title: z.string().min(1),
    description: z.string().optional(),
    decision_status: OpportunityDecisionStatusSchema,
    progress_status: ProgressStatusSchema.optional(),
    source: OpportunitySourceSchema,
    catalogue_ref: CatalogueRefSchema.optional(),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
  })
  .superRefine((value, ctx) => {
    if (value.source === "catalogue" && !value.catalogue_ref) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "catalogue_ref is required when source is catalogue",
      })
    }

    if (value.source === "free_text" && value.catalogue_ref) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "catalogue_ref must not be set when source is free_text",
      })
    }

    if (value.progress_status && value.decision_status !== "accepted") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "decision_status must be accepted when progress_status is present",
      })
    }
  })

const StepSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  bucket: CanvasBucketSchema,
  order: z.number().int().min(0),
  progress_status: ProgressStatusSchema,
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  opportunities: z.array(OpportunitySchema).default([]),
})

const IntentionSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  bucket: CanvasBucketSchema,
  progress_status: ProgressStatusSchema,
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  steps: z.array(StepSchema).default([]),
})

const CanvasStateSchema = z.object({
  intentions: z.array(IntentionSchema).default([]),
})

export const StudentCanvasSchema = z.object({
  schema_version: z.literal(SCHEMA_VERSION),
  student_id: z.string().min(1),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  tutorial_state: z.record(z.any()).optional(),
  canvas: CanvasStateSchema,
})

export type StudentCanvas = z.infer<typeof StudentCanvasSchema>

type LegacyBucket = "do-now" | "do-later" | "before-graduation" | "after-graduation"

const LEGACY_TO_CANONICAL_BUCKET: Record<LegacyBucket, z.infer<typeof CanvasBucketSchema>> = {
  "do-now": "do_now",
  "do-later": "do_later",
  "before-graduation": "before_graduation",
  "after-graduation": "after_graduation",
}

const CANONICAL_TO_LEGACY_BUCKET: Record<z.infer<typeof CanvasBucketSchema>, LegacyBucket> = {
  do_now: "do-now",
  do_later: "do-later",
  before_graduation: "before-graduation",
  after_graduation: "after-graduation",
}

function mapBucketToCanonical(bucket: unknown): z.infer<typeof CanvasBucketSchema> {
  if (typeof bucket !== "string") {
    return "do_now"
  }

  if (bucket in LEGACY_TO_CANONICAL_BUCKET) {
    return LEGACY_TO_CANONICAL_BUCKET[bucket as LegacyBucket]
  }

  if (bucket in CANONICAL_TO_LEGACY_BUCKET) {
    return bucket as z.infer<typeof CanvasBucketSchema>
  }

  return "do_now"
}

function mapBucketToLegacy(bucket: unknown): LegacyBucket {
  if (typeof bucket !== "string") {
    return "do-now"
  }

  if (bucket in CANONICAL_TO_LEGACY_BUCKET) {
    return CANONICAL_TO_LEGACY_BUCKET[bucket as z.infer<typeof CanvasBucketSchema>]
  }

  if (bucket in LEGACY_TO_CANONICAL_BUCKET) {
    return bucket as LegacyBucket
  }

  return "do-now"
}

function isIsoDateString(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value))
}

function safeIsoTimestamp(value: unknown, fallback: string): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString()
  }

  if (isIsoDateString(value)) {
    return new Date(value).toISOString()
  }

  return fallback
}

function statusToProgressStatus(status: unknown): z.infer<typeof ProgressStatusSchema> {
  if (typeof status !== "string") {
    return "not_started"
  }

  const normalized = status.trim().toLowerCase()

  if (normalized === "in_progress" || normalized === "in-progress") {
    return "in_progress"
  }

  if (normalized === "completed" || normalized === "accepted") {
    return "completed"
  }

  if (normalized === "abandoned" || normalized === "rejected") {
    return "abandoned"
  }

  return "not_started"
}

function toDeterministicUuid(value: unknown, prefix: string): string {
  if (typeof value === "string") {
    const trimmed = value.trim()

    if (z.string().uuid().safeParse(trimmed).success) {
      return trimmed
    }

    if (trimmed.length > 0) {
      return hashToUuid(`${prefix}:${trimmed}`)
    }
  }

  return randomUUID()
}

function hashToUuid(seed: string): string {
  const hash = createHash("sha1").update(seed).digest("hex").slice(0, 32)
  const chars = hash.split("")
  chars[12] = "5"
  const variant = parseInt(chars[16], 16)
  chars[16] = ((variant & 0x3) | 0x8).toString(16)

  return `${chars.slice(0, 8).join("")}-${chars.slice(8, 12).join("")}-${chars
    .slice(12, 16)
    .join("")}-${chars.slice(16, 20).join("")}-${chars.slice(20, 32).join("")}`
}

function deriveIntentionProgress(steps: Array<{ progress_status: z.infer<typeof ProgressStatusSchema> }>) {
  if (steps.length === 0) {
    return "not_started" as const
  }

  if (steps.every((step) => step.progress_status === "completed")) {
    return "completed" as const
  }

  if (steps.some((step) => step.progress_status === "in_progress" || step.progress_status === "completed")) {
    return "in_progress" as const
  }

  if (steps.every((step) => step.progress_status === "abandoned")) {
    return "abandoned" as const
  }

  return "not_started" as const
}

export function buildStudentCanvasDocument(studentId: string, input: any, previous?: Partial<StudentCanvas>): StudentCanvas {
  const now = new Date().toISOString()
  const rootCreatedAt = safeIsoTimestamp(previous?.created_at, now)

  const intentionsInput = Array.isArray(input?.intentions)
    ? input.intentions
    : Array.isArray(input?.canvas?.intentions)
      ? input.canvas.intentions
      : []

  const intentions = intentionsInput.map((intention: any, intentionIndex: number) => {
    const intentionNow = new Date().toISOString()

    const stepsInput = Array.isArray(intention?.steps) ? intention.steps : []

    const steps = stepsInput.map((step: any, stepIndex: number) => {
      const stepNow = new Date().toISOString()
      return {
        id: toDeterministicUuid(step?.id ?? step?.clientId ?? `${intentionIndex}-${stepIndex}`, "step"),
        title:
          typeof step?.title === "string" && step.title.trim().length > 0
            ? step.title.trim()
            : typeof step?.text === "string" && step.text.trim().length > 0
              ? step.text.trim()
              : "Untitled step",
        description: typeof step?.description === "string" ? step.description : undefined,
        bucket: mapBucketToCanonical(step?.bucket ?? intention?.bucket),
        order: Number.isInteger(step?.order) && step.order >= 0 ? step.order : stepIndex,
        progress_status: statusToProgressStatus(step?.status),
        created_at: safeIsoTimestamp(step?.createdAt ?? step?.created_at, stepNow),
        updated_at: now,
        opportunities: [],
      }
    })

    const explicitIntentionProgress =
      typeof intention?.progress_status === "string" ? statusToProgressStatus(intention.progress_status) : null

    return {
      id: toDeterministicUuid(intention?.id ?? intentionIndex, "intention"),
      title:
        typeof intention?.title === "string" && intention.title.trim().length > 0
          ? intention.title.trim()
          : `Untitled intention ${intentionIndex + 1}`,
      description: typeof intention?.description === "string" ? intention.description : undefined,
      bucket: mapBucketToCanonical(intention?.bucket),
      progress_status: explicitIntentionProgress ?? deriveIntentionProgress(steps),
      created_at: safeIsoTimestamp(intention?.createdAt ?? intention?.created_at, intentionNow),
      updated_at: now,
      steps,
    }
  })

  const candidate = {
    schema_version: SCHEMA_VERSION,
    student_id: studentId,
    created_at: rootCreatedAt,
    updated_at: now,
    tutorial_state: input?.tutorial_state ?? previous?.tutorial_state,
    canvas: {
      intentions,
    },
  }

  return StudentCanvasSchema.parse(candidate)
}

export function toLegacyIntentionsPayload(document: Partial<StudentCanvas> | null | undefined): { intentions: any[] } {
  if (!document || !document.canvas || !Array.isArray(document.canvas.intentions)) {
    return { intentions: [] }
  }

  const intentions = document.canvas.intentions.map((intention) => ({
    id: intention.id,
    title: intention.title,
    description: intention.description,
    bucket: mapBucketToLegacy(intention.bucket),
    createdAt: intention.created_at,
    updatedAt: intention.updated_at,
    steps: intention.steps.map((step) => ({
      id: step.id,
      clientId: step.id,
      intentionId: intention.id,
      title: step.title,
      text: step.title,
      bucket: mapBucketToLegacy(step.bucket),
      order: step.order,
      status: step.progress_status,
      createdAt: step.created_at,
    })),
  }))

  return { intentions }
}

export function parseStudentCanvasDocument(raw: unknown): StudentCanvas | null {
  const parsed = StudentCanvasSchema.safeParse(raw)
  if (parsed.success) {
    return parsed.data
  }

  return null
}
