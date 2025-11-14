import { getChatModel } from "@/lib/ai/client"
import { buildSuggestionPromptV5 } from "../ai/promptBuilder"
import { debug } from "@/lib/debug"
import type {
  BucketId,
  OpportunityFocus,
  OpportunityForm,
  OpportunitySource,
  OpportunityStatus
} from "@/types/canvas"

export type OpportunityDraft = {
  title: string
  summary: string
  source: OpportunitySource
  form: OpportunityForm
  focus: OpportunityFocus
  status?: OpportunityStatus
}

type SimulateOpportunitiesInput = {
  stepTitle: string
  intentionTitle?: string
  bucketId?: string
}

const OPPORTUNITY_SOURCES: OpportunitySource[] = ["edge_simulated", "independent"]
const OPPORTUNITY_FORMS: OpportunityForm[] = ["intensive", "evergreen", "short_form", "sustained"]
const OPPORTUNITY_STATUSES: OpportunityStatus[] = ["suggested", "saved", "dismissed"]
type OpportunityFocusValue = "capability" | "capital" | "credibility"
const OPPORTUNITY_FOCUS_VALUES: OpportunityFocusValue[] = ["capability", "capital", "credibility"]

type SuggestStepsInput = {
  intentionText?: string
  intentionBucket?: string
  historyAccepted?: string[]
  historyRejected?: string[]
}

type Suggestion = { bucket: BucketId; text: string }

type WorkflowName = "suggest-step"

type WorkflowResult = { suggestions: Suggestion[] }

const VALID_BUCKETS: BucketId[] = ["do-now", "do-later", "before-graduation", "after-graduation"]

function extractMessageContent(response: unknown): string {
  if (!response || typeof response !== "object") {
    return ""
  }

  const content = (response as { content?: unknown }).content

  if (typeof content === "string") {
    return content
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") {
          return part
        }

        if (part && typeof part === "object" && "text" in part && typeof (part as { text?: unknown }).text === "string") {
          return (part as { text: string }).text
        }

        return ""
      })
      .join("")
  }

  if (content != null) {
    return String(content)
  }

  return ""
}

function normaliseBucket(bucket?: string): BucketId {
  if (bucket && (VALID_BUCKETS as string[]).includes(bucket)) {
    return bucket as BucketId
  }

  return "do-now"
}

function mapBucketToPromptTarget(bucket: BucketId): string {
  switch (bucket) {
    case "do-now":
      return "do_now"
    case "do-later":
      return "do_soon"
    case "before-graduation":
      return "before_grad"
    case "after-graduation":
      return "before_grad"
    default:
      return "do_now"
  }
}

function sanitiseHistory(history?: string[]): string[] {
  if (!Array.isArray(history)) {
    return []
  }

  return history.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
}

export async function runWorkflow(workflowName: WorkflowName, payload: SuggestStepsInput): Promise<WorkflowResult> {
  if (workflowName !== "suggest-step") {
    throw new Error(`Unknown workflow: ${workflowName}`)
  }

  const bucket = normaliseBucket(payload.intentionBucket)
  const promptBucket = mapBucketToPromptTarget(bucket)
  const intentionText = (payload.intentionText ?? "").trim() || "your intention"
  const historyAccepted = sanitiseHistory(payload.historyAccepted).slice(-5)
  const historyRejected = sanitiseHistory(payload.historyRejected).slice(-5)

  if (workflowName === "suggest-step") {
    const prompt = buildSuggestionPromptV5({
      intentionText,
      targetBucket: promptBucket,
      historyAccepted,
      historyRejected
    })

    debug.trace("AI Prompt Builder v5: constructed prompt", {
      bucket: payload.intentionBucket ?? bucket,
      intention: intentionText
    })

    const llm = getChatModel()
    const resolvedModel =
      (typeof llm.model === "string" && llm.model.trim().length > 0
        ? llm.model
        : undefined) ??
      (typeof llm.modelName === "string" && llm.modelName.trim().length > 0
        ? llm.modelName
        : undefined) ??
      process.env.OPENAI_MODEL ??
      "gpt-4o-mini"

    debug.trace("AI: suggest-step using model", {
      model: resolvedModel,
      ...(llm.modelName && llm.modelName !== resolvedModel ? { modelName: llm.modelName } : {}),
      ...(llm.model && llm.model !== resolvedModel ? { rawModel: llm.model } : {}),
      ...(process.env.OPENAI_BASE_URL ? { baseURL: process.env.OPENAI_BASE_URL } : {})
    })
    const response = await llm.invoke(prompt)
    const rawContent = extractMessageContent(response)
    const text = rawContent.trim()

    debug.info("AI: model response (prompt v5)", {
      bucket: payload.intentionBucket ?? bucket,
      preview: text.slice(0, 120)
    })

    return {
      suggestions: [
        {
          bucket,
          text
        }
      ]
    }
  }

  throw new Error(`Unhandled workflow: ${workflowName}`)
}

function isOpportunitySource(value: unknown): value is OpportunitySource {
  return typeof value === "string" && OPPORTUNITY_SOURCES.includes(value as OpportunitySource)
}

function isOpportunityForm(value: unknown): value is OpportunityForm {
  return typeof value === "string" && OPPORTUNITY_FORMS.includes(value as OpportunityForm)
}

function isOpportunityFocusValue(value: unknown): value is OpportunityFocusValue {
  return typeof value === "string" && OPPORTUNITY_FOCUS_VALUES.includes(value as OpportunityFocusValue)
}

function normaliseOpportunityFocus(value: unknown): OpportunityFocus | null {
  if (isOpportunityFocusValue(value)) {
    return value
  }

  if (Array.isArray(value)) {
    const filtered = value
      .filter((entry): entry is OpportunityFocusValue => isOpportunityFocusValue(entry))

    const unique = Array.from(new Set(filtered))

    if (unique.length === 1) {
      return unique[0] as OpportunityFocus
    }

    if (unique.length > 1) {
      return unique as OpportunityFocus
    }
  }

  return null
}

function normaliseOpportunityStatus(value: unknown): OpportunityStatus {
  if (typeof value === "string" && OPPORTUNITY_STATUSES.includes(value as OpportunityStatus)) {
    return value as OpportunityStatus
  }

  return "suggested"
}

function toOpportunityDraft(candidate: unknown, index: number): OpportunityDraft | null {
  if (!candidate || typeof candidate !== "object") {
    debug.warn("AI: simulate-opportunities skipped invalid entry", { index, reason: "not an object" })
    return null
  }

  const data = candidate as Record<string, unknown>
  const title = typeof data.title === "string" ? data.title.trim() : ""
  const summary = typeof data.summary === "string" ? data.summary.trim() : ""
  const source = data.source
  const form = data.form
  const focus = normaliseOpportunityFocus(data.focus)

  if (!title || !summary || !isOpportunitySource(source) || !isOpportunityForm(form) || !focus) {
    debug.warn("AI: simulate-opportunities skipped invalid entry", {
      index,
      hasTitle: !!title,
      hasSummary: !!summary,
      source,
      form,
      focus
    })
    return null
  }

  const status = normaliseOpportunityStatus(data.status)

  return {
    title,
    summary,
    source,
    form,
    focus,
    status
  }
}

function parseOpportunityDrafts(rawContent: string): OpportunityDraft[] {
  let parsed: unknown

  try {
    parsed = JSON.parse(rawContent)
  } catch (error) {
    debug.error("AI: failed to parse simulate-opportunities response", {
      message: error instanceof Error ? error.message : String(error),
      preview: rawContent.slice(0, 200)
    })
    throw new Error("Failed to parse simulate-opportunities response")
  }

  if (!Array.isArray(parsed)) {
    debug.error("AI: simulate-opportunities response was not an array", {
      preview: rawContent.slice(0, 200)
    })
    throw new Error("Failed to parse simulate-opportunities response")
  }

  const drafts = parsed
    .map((item, index) => toOpportunityDraft(item, index))
    .filter((item): item is OpportunityDraft => item !== null)

  debug.info("AI: parsed opportunity drafts", { count: drafts.length })

  return drafts
}

function describeBucket(bucketId?: string): string | undefined {
  if (!bucketId) {
    return undefined
  }

  switch (bucketId) {
    case "do-now":
      return "immediate focus"
    case "do-later":
      return "upcoming focus"
    case "before-graduation":
      return "before graduation"
    case "after-graduation":
      return "after graduation"
    default:
      return bucketId
  }
}

export async function runSimulateOpportunitiesWorkflow(
  input: SimulateOpportunitiesInput
): Promise<OpportunityDraft[]> {
  const { stepTitle, intentionTitle, bucketId } = input
  const trimmedStepTitle = stepTitle.trim()

  if (!trimmedStepTitle) {
    throw new Error("Step title is required to simulate opportunities")
  }

  const contextParts = [
    "You are Opportunity AI for King's Canvas, supporting King's College London students.",
    `The student is working on the step titled "${trimmedStepTitle}".`
  ]

  if (intentionTitle && intentionTitle.trim().length > 0) {
    contextParts.push(`This step is part of the wider intention "${intentionTitle.trim()}".`)
  }

  const bucketDescription = describeBucket(bucketId)
  if (bucketDescription) {
    contextParts.push(`The step sits in the ${bucketDescription} time horizon.`)
  }

  const prompt = `${contextParts.join("\n\n")}\n\nGenerate 3 or 4 fictional opportunity drafts that meet all of the following requirements:\n- 2 or 3 opportunities must have "source": "edge_simulated".\n- Exactly 1 opportunity must have "source": "independent".\n- Every opportunity must include: title, summary, source, form, focus, and optionally status.\n- The "form" field must be one of: intensive, evergreen, short_form, sustained.\n- The "focus" field must be either a single value or short list from: capability, capital, credibility.\n- All opportunities should be fictional, inclusive, encouraging, and clearly examples rather than real listings.\n\nRespond with a strict JSON array of opportunity objects and nothing else. No prose or commentary.`

  debug.trace("AI: simulate-opportunities prompt constructed", {
    stepTitle: trimmedStepTitle,
    hasIntention: Boolean(intentionTitle),
    bucketId: bucketId ?? null
  })

  const llm = getChatModel()
  const response = await llm.invoke(prompt)
  const rawContent = extractMessageContent(response).trim()

  debug.info("AI: simulate-opportunities model response", {
    preview: rawContent.slice(0, 200)
  })

  return parseOpportunityDrafts(rawContent)
}
