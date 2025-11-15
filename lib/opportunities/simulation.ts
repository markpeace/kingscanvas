import { getChatModel } from "@/lib/ai/client"
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

const VALID_SOURCES: OpportunitySource[] = ["edge_simulated", "independent"]
const VALID_FORMS: OpportunityForm[] = ["intensive", "evergreen", "short_form", "sustained"]
const VALID_FOCUS_VALUES = ["capability", "capital", "credibility"] as const
const VALID_STATUSES: OpportunityStatus[] = ["suggested", "saved", "dismissed"]
const DEFAULT_STATUS: OpportunityStatus = "suggested"

type SimulateOpportunitiesInput = {
  stepTitle: string
  intentionTitle?: string
  bucketId?: BucketId | string
}

function buildPrompt({ stepTitle, intentionTitle, bucketId }: SimulateOpportunitiesInput): string {
  const contextLines = [
    "You are assisting a King's College London student in discovering opportunities that align with their plan.",
    `Step title: "${stepTitle.trim()}"`
  ]

  if (intentionTitle && intentionTitle.trim().length > 0) {
    contextLines.push(`Intention: "${intentionTitle.trim()}"`)
  }

  if (bucketId && `${bucketId}`.trim().length > 0) {
    contextLines.push(`Time horizon: "${`${bucketId}`.trim()}"`)
  }

  const requirements = [
    "Return 3 or 4 opportunity drafts as a JSON array.",
    "Include 2 or 3 items with \"source\": \"edge_simulated\" and 1 item with \"source\": \"independent\".",
    "Every object must include the fields: title, summary, source, form, focus, status (optional).",
    "Use one of these values for form: intensive, evergreen, short_form, sustained.",
    "Use one or more of these values for focus: capability, capital, credibility.",
    "Respond with ONLY valid JSON. No narration or explanation."
  ]

  return `${contextLines.join("\n")}\n\nRequirements:\n- ${requirements.join("\n- ")}`
}

function extractTextFromResponse(response: unknown): string {
  if (!response || typeof response !== "object") {
    return ""
  }

  const content = (response as { content?: unknown }).content

  if (typeof content === "string") {
    return content.trim()
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") {
          return part
        }

        if (part && typeof part === "object" && "text" in part && typeof (part as any).text === "string") {
          return (part as { text: string }).text
        }

        return ""
      })
      .join("")
      .trim()
  }

  if (content != null) {
    return String(content).trim()
  }

  return ""
}

type FocusValue = (typeof VALID_FOCUS_VALUES)[number]

type RawDraft = Partial<OpportunityDraft> & Record<string, unknown>

function parseFocus(value: unknown): OpportunityFocus | null {
  if (typeof value === "string") {
    const normalised = value.trim().toLowerCase()
    if (VALID_FOCUS_VALUES.includes(normalised as FocusValue)) {
      return normalised as OpportunityFocus
    }

    return null
  }

  if (Array.isArray(value)) {
    const unique = Array.from(
      new Set(
        value
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim().toLowerCase())
          .filter((item): item is FocusValue => VALID_FOCUS_VALUES.includes(item as FocusValue))
      )
    )

    if (unique.length === 0) {
      return null
    }

    return unique as OpportunityFocus
  }

  return null
}

function parseDraft(raw: RawDraft): OpportunityDraft | null {
  const title = typeof raw.title === "string" ? raw.title.trim() : ""
  const summary = typeof raw.summary === "string" ? raw.summary.trim() : ""
  const source =
    typeof raw.source === "string" ? (raw.source.trim().toLowerCase() as OpportunitySource) : undefined
  const form = typeof raw.form === "string" ? (raw.form.trim().toLowerCase() as OpportunityForm) : undefined
  const focus = parseFocus(raw.focus)

  if (!title || !summary || !source || !form || !focus) {
    return null
  }

  if (!VALID_SOURCES.includes(source) || !VALID_FORMS.includes(form)) {
    return null
  }

  let status: OpportunityStatus = DEFAULT_STATUS
  if (typeof raw.status === "string") {
    const normalised = raw.status.trim().toLowerCase() as OpportunityStatus
    if (VALID_STATUSES.includes(normalised)) {
      status = normalised
    }
  }

  return {
    title,
    summary,
    source,
    form,
    focus,
    status
  }
}

function safeParseDrafts(json: string): OpportunityDraft[] {
  let parsed: unknown

  try {
    parsed = JSON.parse(json)
  } catch (error) {
    debug.error("AI: failed to parse simulate-opportunities response", {
      preview: json.slice(0, 200)
    })
    throw new Error("Failed to parse simulate-opportunities response")
  }

  if (!Array.isArray(parsed)) {
    debug.error("AI: simulate-opportunities response was not an array", { parsedType: typeof parsed })
    return []
  }

  const drafts: OpportunityDraft[] = []

  for (const item of parsed) {
    if (item && typeof item === "object") {
      const draft = parseDraft(item as RawDraft)
      if (draft) {
        drafts.push(draft)
      }
    }
  }

  return drafts
}

export async function runSimulateOpportunitiesWorkflow(
  input: SimulateOpportunitiesInput
): Promise<OpportunityDraft[]> {
  const { stepTitle } = input
  if (!stepTitle || stepTitle.trim().length === 0) {
    throw new Error("stepTitle is required to simulate opportunities")
  }

  const prompt = buildPrompt(input)

  debug.trace("AI: simulate-opportunities prompt", {
    stepTitle: stepTitle.trim(),
    ...(input.intentionTitle ? { intentionTitle: input.intentionTitle.trim() } : {}),
    ...(input.bucketId ? { bucketId: `${input.bucketId}`.trim() } : {})
  })

  const model = getChatModel()
  const response = await model.invoke(prompt)
  const text = extractTextFromResponse(response)

  if (!text) {
    debug.error("AI: simulate-opportunities returned empty response")
    return []
  }

  return safeParseDrafts(text)
}

export async function generateOpportunityDraftsForStep(
  input: SimulateOpportunitiesInput
): Promise<OpportunityDraft[]> {
  try {
    return await runSimulateOpportunitiesWorkflow(input)
  } catch (error) {
    if (error instanceof Error && error.message.includes("Failed to parse simulate-opportunities response")) {
      throw error
    }

    const message =
      error instanceof Error && error.message
        ? `Failed to generate opportunity drafts: ${error.message}`
        : "Failed to generate opportunity drafts"

    throw new Error(message)
  }
}
