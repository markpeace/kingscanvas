import { getCollection } from "@/lib/dbHelpers"
import { debug } from "@/lib/debug"
import {
  createOpportunities,
  getOpportunitiesByStep,
  getStepById,
  getUserIntentions,
  type OpportunityUpsertInput,
  type StepDocument,
} from "@/lib/userData"
import { runWorkflow, type SimulatedOpportunityDraft } from "@/lib/langgraph/workflow"
import type {
  Intention,
  Opportunity,
  OpportunityFocus,
  OpportunityForm,
  OpportunitySource,
  Step,
} from "@/types/canvas"

type IntentionsDocument = {
  intentions?: Array<{ id?: string; title?: string }>
}

const SOURCE_VALUES: OpportunitySource[] = ["edge_simulated", "independent"]
const FORM_VALUES: OpportunityForm[] = ["intensive", "evergreen", "short_form", "sustained"]
const FOCUS_VALUES: OpportunityFocus[] = ["capability", "capital", "credibility"]
const MAX_OPPORTUNITIES = 4
const MIN_OPPORTUNITIES = 3

type GenerationOrigin = "manual" | "ai-accepted" | "ai-ghost" | (string & {})

type GenerationMeta = {
  origin: GenerationOrigin
}

class OpportunityGenerationError extends Error {
  statusCode: number

  constructor(message: string, statusCode = 500) {
    super(message)
    this.name = "OpportunityGenerationError"
    this.statusCode = statusCode
  }
}

function normaliseString(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

function normaliseFocusList(value: unknown): OpportunityFocus[] {
  const candidates: string[] = Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : typeof value === "string"
    ? value.split(/[,/&]+/)
    : []

  const normalised = candidates
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.length > 0)

  const unique = Array.from(new Set(normalised))

  return unique
    .map((item) => item as OpportunityFocus)
    .filter((item) => FOCUS_VALUES.includes(item))
}

function normaliseForm(value: unknown): OpportunityForm | null {
  if (typeof value !== "string") {
    return null
  }

  const candidate = value.trim().toLowerCase() as OpportunityForm
  return FORM_VALUES.includes(candidate) ? candidate : null
}

function normaliseSource(value: unknown): OpportunitySource | null {
  if (typeof value !== "string") {
    return null
  }

  const candidate = value.trim().toLowerCase() as OpportunitySource
  return SOURCE_VALUES.includes(candidate) ? candidate : null
}

function ensureSimulatedSummary(summary: string, source: OpportunitySource): string {
  const trimmed = summary.trim()
  if (/\bsimulated\b/i.test(trimmed)) {
    return trimmed
  }

  const prefix = source === "independent" ? "Simulated independent idea: " : "Simulated example: "
  return `${prefix}${trimmed}`
}

function resolveIntentionTitle(intentionsDoc: IntentionsDocument | null, intentionId: string | null): string | null {
  if (!intentionsDoc?.intentions || !intentionId) {
    return null
  }

  const match = intentionsDoc.intentions.find((item) => item?.id === intentionId)
  return match && typeof match.title === "string" ? match.title : null
}

function extractTags(step: StepDocument | (Step & { tags?: string[] })): string[] {
  if (!Array.isArray(step.tags)) {
    return []
  }

  return step.tags
    .filter((tag): tag is string => typeof tag === "string")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
}

type OpportunityInsertDraft = {
  title: string
  summary: string
  source: OpportunitySource
  form: OpportunityForm
  focus: OpportunityFocus[]
}

function buildOpportunityInputs(drafts: SimulatedOpportunityDraft[]): OpportunityInsertDraft[] {
  return drafts
    .map((draft) => {
      const title = normaliseString(draft.title)
      const summary = normaliseString(draft.summary)
      const source = normaliseSource(draft.source)
      const form = normaliseForm(draft.form)
      const focus = normaliseFocusList(draft.focus)

      if (!title || !summary || !source || !form || focus.length === 0) {
        return null
      }

      return {
        title,
        summary: ensureSimulatedSummary(summary, source),
        source,
        form,
        focus,
      }
    })
    .filter((draft): draft is OpportunityInsertDraft => draft !== null)
}

function resolveStepId(step: Step | StepDocument): string {
  if (typeof (step as Step).id === "string" && (step as Step).id) {
    return (step as Step).id
  }

  const rawId = (step as StepDocument)._id

  if (typeof rawId === "string" && rawId.length > 0) {
    return rawId
  }

  if (rawId && typeof (rawId as { toString?: () => string }).toString === "function") {
    const serialised = rawId.toString()
    if (serialised && serialised !== "[object Object]") {
      return serialised
    }
  }

  throw new OpportunityGenerationError("Step is missing a valid identifier", 400)
}

function resolveIntentionContext(
  intention?: Intention | null,
  fallbackDoc?: IntentionsDocument | null,
  intentionId?: string | null,
): string | null {
  if (intention && typeof intention.title === "string" && intention.title.trim().length > 0) {
    return intention.title.trim()
  }

  return resolveIntentionTitle(fallbackDoc ?? null, intentionId ?? null)
}

async function purgeExistingDrafts(user: string, stepId: string) {
  const col = await getCollection("opportunities")
  await col.deleteMany({
    user,
    stepId,
    source: { $in: SOURCE_VALUES },
    status: "suggested",
  })
}

export async function generateOpportunitiesForStep(
  user: string,
  step: Step | (StepDocument & { tags?: string[] }),
  intention: Intention | null | undefined,
  meta: GenerationMeta,
): Promise<Opportunity[]> {
  const stepId = resolveStepId(step)
  const stepTitle = normaliseString(step.title) || normaliseString((step as StepDocument).text) || "this step"
  const stepBucket = normaliseString(step.bucket)
  const tags = extractTags(step)
  const intentionId = typeof step.intentionId === "string" ? step.intentionId : null

  debug.info("Opportunities: generateOpportunitiesForStep called", {
    user,
    stepId,
    title: stepTitle,
    origin: meta.origin,
  })

  const intentionsDoc = intention ? null : ((await getUserIntentions(user)) as IntentionsDocument | null)
  const intentionTitle = resolveIntentionContext(intention ?? null, intentionsDoc, intentionId)

  debug.info("AI: simulate-opportunities invoked", {
    user,
    stepId,
    stepTitle,
    origin: meta.origin,
  })

  let workflowResult
  try {
    workflowResult = await runWorkflow("simulate-opportunities", {
      stepTitle,
      stepBucket,
      intentionTitle,
      tags,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown AI error"
    debug.error("Opportunity generation: workflow failed", {
      user,
      stepId,
      origin: meta.origin,
      message,
    })
    throw new OpportunityGenerationError(message, 503)
  }

  const rawPreview = workflowResult.rawText?.slice(0, 200) ?? ""
  const preview = rawPreview || "(empty)"
  debug.info("AI: simulate-opportunities raw response", { user, stepId, preview })

  const drafts: OpportunityUpsertInput[] = buildOpportunityInputs(
    workflowResult.opportunities,
  ).map(
    (draft) => ({
      stepId,
      title: draft.title,
      summary: draft.summary,
      source: draft.source,
      form: draft.form,
      focus: draft.focus,
      status: "suggested",
    }),
  )

  debug.info("AI: simulate-opportunities parsed opportunities", {
    user,
    stepId,
    count: drafts.length,
  })

  if (!drafts.some((item) => item.source === "independent")) {
    drafts.push({
      stepId,
      title: `Independent idea: Reflect on ${stepTitle}`,
      summary: ensureSimulatedSummary(
        `Spend dedicated time mapping how you could progress "${stepTitle}" on your own, identifying first moves you can test yourself.`,
        "independent",
      ),
      source: "independent",
      form: "evergreen",
      focus: ["capability"],
      status: "suggested",
    })
  }

  if (drafts.length < MIN_OPPORTUNITIES) {
    throw new OpportunityGenerationError("AI returned insufficient opportunities", 503)
  }

  const limited = drafts.slice(0, MAX_OPPORTUNITIES)

  debug.info("Opportunities: persisting generated items", {
    user,
    stepId,
    count: limited.length,
  })

  await purgeExistingDrafts(user, stepId)
  const stored = await createOpportunities(user, limited)

  debug.info("Opportunity generation: completed", {
    user,
    stepId,
    generated: stored.length,
  })

  const persisted = await getOpportunitiesByStep(user, stepId)
  debug.info("Opportunities: post-write check", {
    user,
    stepId,
    count: persisted.length,
  })

  return persisted
}

export async function generateSimulatedOpportunitiesForStep(
  user: string,
  stepId: string,
  meta: GenerationMeta,
): Promise<Opportunity[]> {
  debug.trace("Opportunity generation: starting", { user, stepId, origin: meta.origin })

  const step = await getStepById(user, stepId)

  if (!step) {
    throw new OpportunityGenerationError("Step not found", 404)
  }

  return generateOpportunitiesForStep(user, step, null, meta)
}

async function hasExistingOpportunitiesForStep(user: string, stepId: string): Promise<boolean> {
  const col = await getCollection("opportunities")
  const existing = await col.findOne({ user, stepId })
  return Boolean(existing)
}

export async function generateSimulatedOpportunitiesForStepIfNeeded(
  user: string,
  stepId: string,
  meta: GenerationMeta,
): Promise<Opportunity[] | null> {
  if (await hasExistingOpportunitiesForStep(user, stepId)) {
    debug.info("Opportunities: existing entries detected, skipping generation", {
      user,
      stepId,
      origin: meta.origin,
    })
    return getOpportunitiesByStep(user, stepId)
  }

  return generateSimulatedOpportunitiesForStep(user, stepId, meta)
}

export { OpportunityGenerationError }
