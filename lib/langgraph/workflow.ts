import { getChatModel } from "@/lib/ai/client"
import { buildSuggestionPromptV5 } from "../ai/promptBuilder"
import { debug } from "@/lib/debug"
import type { BucketId } from "@/types/canvas"

type SuggestStepsInput = {
  intentionText?: string
  intentionBucket?: string
  historyAccepted?: string[]
  historyRejected?: string[]
}

type Suggestion = { bucket: BucketId; text: string }

type SimulateOpportunitiesInput = {
  stepTitle: string
  stepBucket?: string | null
  intentionTitle?: string | null
  tags?: string[]
}

type SimulatedOpportunityDraft = {
  title: string
  summary: string
  source: string
  form: string
  focus: string[] | string
}

type WorkflowName = "suggest-step" | "simulate-opportunities"

type SuggestWorkflowResult = { suggestions: Suggestion[] }

type SimulateOpportunitiesWorkflowResult = {
  opportunities: SimulatedOpportunityDraft[]
  rawText: string
}

type WorkflowResult = SuggestWorkflowResult | SimulateOpportunitiesWorkflowResult

const VALID_BUCKETS: BucketId[] = ["do-now", "do-later", "before-graduation", "after-graduation"]

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

function resolveModelName(llm: ReturnType<typeof getChatModel>): string {
  return (
    (typeof llm.model === "string" && llm.model.trim().length > 0
      ? llm.model
      : undefined) ??
    (typeof llm.modelName === "string" && llm.modelName.trim().length > 0
      ? llm.modelName
      : undefined) ??
    process.env.OPENAI_MODEL ??
    "gpt-4o-mini"
  )
}

function buildSimulatedOpportunitiesPrompt(payload: SimulateOpportunitiesInput): string {
  const intentionTitle = payload.intentionTitle?.trim()
  const stepTitle = payload.stepTitle.trim() || "this step"
  const stepBucket = payload.stepBucket?.trim() || "unspecified"
  const tagsList = Array.isArray(payload.tags) ? payload.tags.filter((tag) => tag.trim()) : []

  const contextLines = [
    `Intention: ${intentionTitle || "(not provided)"}`,
    `Step: ${stepTitle}`,
    `Time horizon: ${stepBucket}`,
    tagsList.length ? `Tags: ${tagsList.join(", ")}` : null
  ].filter(Boolean)

  return `
You are an assistant for King's Canvas simulating example opportunities inspired by the historic King's Edge style.

CONTEXT
${contextLines.join("\n")}

TASK
Invent 3 or 4 opportunities that *feel* like King's Edge experiences, purely as illustrative examples. These are NOT real listings and must stay clearly labelled as simulated.

OUTPUT REQUIREMENTS
- Provide exactly 3 or 4 entries.
- 2 or 3 entries must have "source": "edge_simulated" and capture the tone of King's Edge style developmental experiences.
- 1 entry must have "source": "independent" and describe something the student can initiate on their own.
- Each entry must include:
  - "title": short, action-oriented headline in plain inclusive language.
  - "summary": 1–2 sentences explaining the simulated example. Explicitly signal that it is a simulated illustration, not a real listing.
  - "form": one of "intensive", "evergreen", "short_form", "sustained".
  - "focus": an array using one or more of "capability", "capital", "credibility".
- Avoid jargon, keep language warm and encouraging, and ensure the opportunities feel relevant to the provided context.
- Do not reference confidential data or promise real services.

FORMAT
Respond with a single JSON object only, no commentary:
{
  "opportunities": [
    {
      "title": "...",
      "summary": "...",
      "source": "edge_simulated" | "independent",
      "form": "intensive" | "evergreen" | "short_form" | "sustained",
      "focus": ["capability" | "capital" | "credibility", ...]
    }
  ]
}
`
}

function extractJsonPayload(raw: string): string {
  const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)

  if (codeBlockMatch && codeBlockMatch[1]) {
    return codeBlockMatch[1]
  }

  const start = raw.indexOf("{")
  const end = raw.lastIndexOf("}")

  if (start !== -1 && end !== -1 && end >= start) {
    return raw.slice(start, end + 1)
  }

  return raw
}

function parseOpportunityDrafts(rawContent: string): SimulatedOpportunityDraft[] {
  const normalised = extractJsonPayload(rawContent)

  try {
    const parsed = JSON.parse(normalised)
    const items = parsed?.opportunities

    if (!Array.isArray(items)) {
      throw new Error("Missing opportunities array in response")
    }

    return items
      .filter((item): item is Record<string, unknown> => item && typeof item === "object")
      .map((item) => {
        const focusValue = Array.isArray(item.focus)
          ? item.focus.filter((entry): entry is string => typeof entry === "string")
          : typeof item.focus === "string"
          ? item.focus
          : []

        return {
          title: typeof item.title === "string" ? item.title.trim() : "",
          summary: typeof item.summary === "string" ? item.summary.trim() : "",
          source: typeof item.source === "string" ? item.source.trim() : "",
          form: typeof item.form === "string" ? item.form.trim() : "",
          focus: focusValue
        }
      })
  } catch (error) {
    const message =
      error instanceof Error ? `Failed to parse AI response: ${error.message}` : "Failed to parse AI response"

    debug.error("AI: simulate-opportunities parse failure", {
      message,
      preview: normalised.slice(0, 200)
    })

    throw new Error(
      error instanceof Error
        ? `Failed to parse AI response: ${error.message}`
        : "Failed to parse AI response"
    )
  }
}

export async function runWorkflow(
  workflowName: "suggest-step",
  payload: SuggestStepsInput
): Promise<SuggestWorkflowResult>
export async function runWorkflow(
  workflowName: "simulate-opportunities",
  payload: SimulateOpportunitiesInput
): Promise<SimulateOpportunitiesWorkflowResult>
export async function runWorkflow(
  workflowName: WorkflowName,
  payload: SuggestStepsInput | SimulateOpportunitiesInput
): Promise<WorkflowResult> {
  if (workflowName === "suggest-step") {
    const suggestPayload = payload as SuggestStepsInput
    const bucket = normaliseBucket(suggestPayload.intentionBucket)
    const promptBucket = mapBucketToPromptTarget(bucket)
    const intentionText = (suggestPayload.intentionText ?? "").trim() || "your intention"
    const historyAccepted = sanitiseHistory(suggestPayload.historyAccepted).slice(-5)
    const historyRejected = sanitiseHistory(suggestPayload.historyRejected).slice(-5)

    const prompt = buildSuggestionPromptV5({
      intentionText,
      targetBucket: promptBucket,
      historyAccepted,
      historyRejected
    })

    debug.trace("AI Prompt Builder v5: constructed prompt", {
      bucket: suggestPayload.intentionBucket ?? bucket,
      intention: intentionText
    })

    const llm = getChatModel()
    const resolvedModel = resolveModelName(llm)

    debug.trace("AI: suggest-step using model", {
      model: resolvedModel,
      ...(llm.modelName && llm.modelName !== resolvedModel ? { modelName: llm.modelName } : {}),
      ...(llm.model && llm.model !== resolvedModel ? { rawModel: llm.model } : {}),
      ...(process.env.OPENAI_BASE_URL ? { baseURL: process.env.OPENAI_BASE_URL } : {})
    })
    const response = await llm.invoke(prompt)
    let rawContent = ""

    const content = response?.content

    if (typeof content === "string") {
      rawContent = content
    } else if (Array.isArray(content)) {
      rawContent = content
        .map((part) => {
          if (typeof part === "string") {
            return part
          }

          if (part && typeof part === "object" && "text" in part && typeof part.text === "string") {
            return part.text
          }

          return ""
        })
        .join("")
    } else if (content != null) {
      rawContent = String(content)
    }

    const text = rawContent.trim()

    debug.info("AI: model response (prompt v5)", {
      bucket: suggestPayload.intentionBucket ?? bucket,
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

  if (workflowName === "simulate-opportunities") {
    const simPayload = payload as SimulateOpportunitiesInput
    const prompt = buildSimulatedOpportunitiesPrompt(simPayload)

    debug.trace("AI Prompt: simulate-opportunities", {
      stepTitle: simPayload.stepTitle,
      stepBucket: simPayload.stepBucket,
      intentionTitle: simPayload.intentionTitle
    })

    debug.info("AI: simulate-opportunities prompt", {
      preview: prompt.slice(0, 200),
      length: prompt.length
    })

    const llm = getChatModel()
    const resolvedModel = resolveModelName(llm)

    debug.trace("AI: simulate-opportunities using model", {
      model: resolvedModel,
      ...(llm.modelName && llm.modelName !== resolvedModel ? { modelName: llm.modelName } : {}),
      ...(llm.model && llm.model !== resolvedModel ? { rawModel: llm.model } : {}),
      ...(process.env.OPENAI_BASE_URL ? { baseURL: process.env.OPENAI_BASE_URL } : {})
    })

    const response = await llm.invoke(prompt)
    let rawContent = ""
    const content = response?.content

    if (typeof content === "string") {
      rawContent = content
    } else if (Array.isArray(content)) {
      rawContent = content
        .map((part) => {
          if (typeof part === "string") {
            return part
          }

          if (part && typeof part === "object" && "text" in part && typeof part.text === "string") {
            return part.text
          }

          return ""
        })
        .join("")
    } else if (content != null) {
      rawContent = String(content)
    }

    const text = rawContent.trim()

    debug.info("AI: simulate-opportunities model response", {
      preview: text.slice(0, 160)
    })

    const drafts = parseOpportunityDrafts(text)

    debug.info("AI: simulate-opportunities parsed drafts", { count: drafts.length })

    return { opportunities: drafts, rawText: text }
  }

  throw new Error(`Unhandled workflow: ${workflowName}`)
}

export type {
  SuggestStepsInput,
  SuggestWorkflowResult,
  SimulateOpportunitiesInput,
  SimulateOpportunitiesWorkflowResult,
  SimulatedOpportunityDraft,
  Suggestion
}
