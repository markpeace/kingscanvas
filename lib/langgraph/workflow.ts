import { StateGraph } from "@langchain/langgraph"
import { getChatModel } from "@/lib/ai/client"
import { buildStepOpportunitiesPromptV1, type StepOpportunityPromptContext } from "@/lib/ai/opportunityPrompt"
import { buildSuggestionPromptV5 } from "@/lib/ai/stepPrompt"
import { debug } from "@/lib/debug"
import type { BucketId } from "@/types/canvas"

type SuggestStepsInput = {
  intentionText?: string
  intentionBucket?: string
  historyAccepted?: string[]
  historyRejected?: string[]
  lastSuggestion?: string
}

type Suggestion = { bucket: BucketId; text: string }

// New workflows (e.g. opportunity recommendations) will be added here in future iterations.
type WorkflowName = "suggest-step"

export type OpportunitySuggestion = {
  title: string
  summary: string
  tier?: "Intensive" | "Sustained" | "Short" | "Evergreen"
}

export type SuggestOpportunitiesInput = StepOpportunityPromptContext

type WorkflowResult = { suggestions: Suggestion[]; model: string }

type SuggestState = {
  prompt: string
  suggestionText?: string
  model?: string
}

type WorkflowTrace = {
  workflow: WorkflowName
  model: string
  durationMs: number
  error?: string
}

const suggestStepGraph = (() => {
  const graph = new StateGraph<SuggestState>({
    channels: {
      prompt: { value: null },
      suggestionText: { value: null },
      model: { value: null }
    }
  })

  graph.addNode("call_model", async (state: SuggestState): Promise<SuggestState> => {
    const llm = getChatModel()
    const resolvedModel =
      (typeof llm.model === "string" && llm.model.trim().length > 0
        ? llm.model
        : undefined) ??
      (typeof llm.modelName === "string" && llm.modelName.trim().length > 0
        ? llm.modelName
        : undefined) ??
      ((process.env.LLM ?? "").trim() || undefined) ??
      "unknown"

    debug.trace("AI: suggest-step using model", {
      model: resolvedModel,
      ...(llm.modelName && llm.modelName !== resolvedModel ? { modelName: llm.modelName } : {}),
      ...(llm.model && llm.model !== resolvedModel ? { rawModel: llm.model } : {}),
      ...(process.env.OPENAI_BASE_URL ? { baseURL: process.env.OPENAI_BASE_URL } : {})
    })

    try {
      const response = await llm.invoke(state.prompt)
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

      return {
        ...state,
        suggestionText: text,
        model: resolvedModel
      }
    } catch (error) {
      if (error && typeof error === "object") {
        ;(error as Record<string, unknown>).model = resolvedModel
      }

      throw error
    }
  })

  graph.setEntryPoint("call_model")
  graph.setFinishPoint("call_model")

  return graph.compile()
})()

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

export async function runWorkflow(workflowName: WorkflowName, payload: SuggestStepsInput): Promise<WorkflowResult> {
  if (workflowName !== "suggest-step") {
    throw new Error(`Unknown workflow: ${workflowName}`)
  }

  const startedAt = Date.now()
  let resolvedModel = "unknown"

  const bucket = normaliseBucket(payload.intentionBucket)
  const promptBucket = mapBucketToPromptTarget(bucket)
  const intentionText = (payload.intentionText ?? "").trim() || "your intention"
  const historyAccepted = sanitiseHistory(payload.historyAccepted).slice(-5)
  const historyRejected = sanitiseHistory(payload.historyRejected).slice(-5)
  const lastSuggestionRaw = typeof payload.lastSuggestion === "string" ? payload.lastSuggestion.trim() : ""
  const lastSuggestion = lastSuggestionRaw.length > 0 ? lastSuggestionRaw : undefined

  try {
    if (workflowName === "suggest-step") {
      const prompt = buildSuggestionPromptV5({
        intentionText,
        targetBucket: promptBucket,
        historyAccepted,
        historyRejected,
        lastSuggestion
      })

      debug.trace("AI Prompt Builder v5: constructed prompt", {
        bucket: payload.intentionBucket ?? bucket,
        intention: intentionText
      })

      const initialState: SuggestState = {
        prompt,
        suggestionText: "",
        model: ""
      }

      const finalState = await suggestStepGraph.invoke(initialState)

      resolvedModel = finalState.model ?? "unknown"
      const text = (finalState.suggestionText ?? "").trim()

      debug.info("AI: model response (prompt v5)", {
        bucket: payload.intentionBucket ?? bucket,
        preview: text.slice(0, 120)
      })

      const workflowDuration = Date.now() - startedAt
      const trace: WorkflowTrace = {
        workflow: workflowName,
        model: resolvedModel,
        durationMs: workflowDuration
      }

      debug.info("AI workflow completed", {
        ...trace,
        ...(payload.intentionBucket ? { bucket: payload.intentionBucket } : {}),
        ...(payload.intentionText ? { intention: intentionText } : {})
      })

      return {
        model: resolvedModel,
        suggestions: [
          {
            bucket,
            text
          }
        ]
      }
    }

    throw new Error(`Unhandled workflow: ${workflowName}`)
  } catch (error) {
    if (error && typeof error === "object" && "model" in error && typeof (error as Record<string, unknown>).model === "string") {
      resolvedModel = (error as Record<string, string>).model
    }

    const workflowDuration = Date.now() - startedAt
    const trace: WorkflowTrace = {
      workflow: workflowName,
      model: resolvedModel,
      durationMs: workflowDuration,
      error: error instanceof Error ? error.message : String(error)
    }

    debug.error("AI workflow failed", {
      ...trace,
      ...(payload.intentionBucket ? { bucket: payload.intentionBucket } : {})
    })

    throw error
  }
}

export async function runOpportunityWorkflow(
  payload: SuggestOpportunitiesInput
): Promise<{ opportunities: OpportunitySuggestion[] }> {
  const stepTitle = (payload.stepTitle || "").trim() || "your step"
  const stepBucket = payload.stepBucket
  const intentionTitle = payload.intentionTitle
  const existingOpportunityTitles = Array.isArray(payload.existingOpportunityTitles)
    ? payload.existingOpportunityTitles.filter((t) => typeof t === "string" && t.trim().length > 0).slice(-10)
    : []

  const prompt = buildStepOpportunitiesPromptV1({
    stepTitle,
    stepBucket,
    intentionTitle,
    existingOpportunityTitles
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

  debug.trace("AI: suggest-opportunities using model", {
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
        if (typeof part === "string") return part
        if (part && typeof part === "object" && "text" in part && typeof (part as any).text === "string") {
          return (part as any).text
        }
        return ""
      })
      .join("")
  } else if (content != null) {
    rawContent = String(content)
  }

  debug.info("AI: raw suggest-opportunities response", {
    preview: rawContent.slice(0, 200)
  })

  let parsed: unknown
  try {
    parsed = JSON.parse(rawContent)
  } catch {
    debug.warn("AI: suggest-opportunities returned non JSON, wrapping as single summary")
    return {
      opportunities: [
        {
          title: stepTitle,
          summary: rawContent.slice(0, 240)
        }
      ]
    }
  }

  const opportunities = Array.isArray((parsed as any)?.opportunities)
    ? (parsed as any).opportunities
        .filter((item: any) => item && typeof item.title === "string" && typeof item.summary === "string")
        .map((item: any): OpportunitySuggestion => ({
          title: String(item.title).trim(),
          summary: String(item.summary).trim(),
          tier:
            item.tier === "Intensive" ||
            item.tier === "Sustained" ||
            item.tier === "Short" ||
            item.tier === "Evergreen"
              ? item.tier
              : undefined
        }))
    : []

  debug.info("AI: suggest-opportunities parsed response", {
    count: opportunities.length,
    example: opportunities[0]?.title || "(none)"
  })

  return { opportunities }
}
