import { StateGraph } from "@langchain/langgraph"
import { getChatModel } from "@/lib/ai/client"
import {
  buildStepOpportunitiesPromptLite,
  buildStepOpportunitiesPromptV1,
  type StepOpportunityPromptContext
} from "@/lib/ai/opportunityPrompt"
import { buildSuggestionPromptLite, buildSuggestionPromptV5 } from "@/lib/ai/stepPrompt"
import { debug } from "@/lib/debug"
import { DEFAULT_STUDENT_PERSONA_ID, getStudentPersona, type StudentPersona } from "@/lib/context/studentPersonas"
import type { BucketId } from "@/types/canvas"

type SuggestStepsInput = {
  intentionText?: string
  intentionBucket?: string
  historyAccepted?: string[]
  historyRejected?: string[]
  lastSuggestion?: string
  persona?: StudentPersona
  fast?: boolean
}

type Suggestion = { bucket: BucketId; text: string }

// New workflows (e.g. opportunity recommendations) will be added here in future iterations.
type WorkflowName = "suggest-step"

export type OpportunitySuggestion = {
  title: string
  summary: string
  source?: string
  form?: string
  focus?: string
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
      ((process.env.LLM ?? "").trim() || "gpt-4o-mini")

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

function isFastModelName(modelName?: string): boolean {
  if (!modelName) return false
  const lower = modelName.toLowerCase()
  return ["mini", "small", "fast", "lite", "turbo"].some((token) => lower.includes(token))
}

function inferModelHintFromEnv(): string | undefined {
  const envHint = (
    process.env.LLM ??
    process.env.OPENAI_MODEL ??
    process.env.OPENAI_MODEL_NAME ??
    "gpt-4o-mini"
  ).trim()
  return envHint.length > 0 ? envHint : "gpt-4o-mini"
}

function resolveModelHint(llm: { model?: unknown; modelName?: unknown } | null | undefined): string | undefined {
  const raw =
    (llm && typeof llm === "object" && "model" in llm && typeof (llm as any).model === "string"
      ? (llm as any).model
      : undefined) ??
    (llm && typeof llm === "object" && "modelName" in llm && typeof (llm as any).modelName === "string"
      ? (llm as any).modelName
      : undefined)

  return raw && raw.trim().length > 0 ? raw.trim() : undefined
}

function shouldUseLitePrompt({ fastFlag, modelHint }: { fastFlag?: boolean; modelHint?: string }): boolean {
  if (process.env.LLM_FAST === "true") return true
  if (fastFlag === true) return true
  if (isFastModelName(modelHint)) return true
  if (fastFlag === false) return false
  return true
}

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
  const persona = payload.persona ?? getStudentPersona(DEFAULT_STUDENT_PERSONA_ID)
  const envModelHint = inferModelHintFromEnv()
  const promptModelHint = resolveModelHint(getChatModel()) ?? envModelHint
  const useLitePrompt = shouldUseLitePrompt({ fastFlag: payload.fast, modelHint: promptModelHint })

  try {
    if (workflowName === "suggest-step") {
      const prompt = (useLitePrompt ? buildSuggestionPromptLite : buildSuggestionPromptV5)({
        intentionText,
        targetBucket: promptBucket,
        historyAccepted,
        historyRejected,
        lastSuggestion,
        persona
      })

      debug.trace("AI Prompt Builder: constructed prompt", {
        bucket: payload.intentionBucket ?? bucket,
        intention: intentionText,
        promptVariant: useLitePrompt ? "lite" : "v5",
        ...(persona ? { persona: persona.shortLabel } : {})
      })

      const initialState: SuggestState = {
        prompt,
        suggestionText: "",
        model: ""
      }

      const finalState = await suggestStepGraph.invoke(initialState)

      resolvedModel = finalState.model ?? "unknown"
      const text = (finalState.suggestionText ?? "").trim()

      debug.info("AI: model response (suggest-step)", {
        bucket: payload.intentionBucket ?? bucket,
        preview: text.slice(0, 120),
        promptVariant: useLitePrompt ? "lite" : "v5",
        ...(persona ? { persona: persona.shortLabel } : {})
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
        ...(payload.intentionText ? { intention: intentionText } : {}),
        ...(persona ? { persona: persona.shortLabel } : {})
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
  const stepBucket = payload.stepBucket || "do-now"
  const intentionTitle = payload.intentionTitle
  const existingOpportunityTitles = Array.isArray(payload.existingOpportunityTitles)
    ? payload.existingOpportunityTitles.filter((t) => typeof t === "string" && t.trim().length > 0).slice(-10)
    : []

  const persona = payload.persona ?? getStudentPersona(DEFAULT_STUDENT_PERSONA_ID)
  const llm = getChatModel()
  const modelHint = resolveModelHint(llm) ?? inferModelHintFromEnv()
  const useLitePrompt = shouldUseLitePrompt({ fastFlag: payload.fast, modelHint })

  const prompt = (useLitePrompt ? buildStepOpportunitiesPromptLite : buildStepOpportunitiesPromptV1)({
    stepTitle,
    stepBucket,
    intentionTitle,
    existingOpportunityTitles,
    persona
  })

  const resolvedModel =
    (typeof (llm as any).model === "string" && (llm as any).model.trim().length > 0
      ? (llm as any).model
      : undefined) ??
    (typeof (llm as any).modelName === "string" && (llm as any).modelName.trim().length > 0
      ? (llm as any).modelName
      : undefined) ??
    process.env.OPENAI_MODEL ??
    "gpt-4o-mini"

  debug.trace("AI: suggest-opportunities using model", {
    model: resolvedModel,
    promptVariant: useLitePrompt ? "lite" : "v1",
    ...(persona ? { persona: persona.shortLabel } : {}),
    ...(process.env.OPENAI_BASE_URL ? { baseURL: process.env.OPENAI_BASE_URL } : {})
  })

  const response = await llm.invoke(prompt)
  
  let rawContent = ""
  const content = (response as any)?.content

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

  const trimmed = rawContent.trim()

  debug.info("AI: raw suggest-opportunities response", {
    preview: trimmed.slice(0, 200),
    promptVariant: useLitePrompt ? "lite" : "v1",
    ...(persona ? { persona: persona.shortLabel } : {})
  })

  let parsed: any
  try {
    parsed = JSON.parse(trimmed)
  } catch {
    debug.warn("AI: suggest-opportunities returned non JSON, wrapping as single summary")
    return {
      opportunities: [
        {
          title: stepTitle,
          summary: trimmed.slice(0, 240),
          source: "independent",
          form: "independent-action",
          focus: "experience"
        }
      ]
    }
  }

  const opportunities = Array.isArray(parsed?.opportunities)
    ? parsed.opportunities
        .filter((item: any) => item && typeof item.title === "string" && typeof item.summary === "string")
        .map(
          (item: any): OpportunitySuggestion => ({
            title: String(item.title).trim(),
            summary: String(item.summary).trim(),
            source: typeof item.source === "string" ? item.source : undefined,
            form: typeof item.form === "string" ? item.form : undefined,
            focus: typeof item.focus === "string" ? item.focus : undefined
          })
        )
    : []

  debug.info("AI: suggest-opportunities parsed response", {
    count: opportunities.length,
    example: opportunities[0]?.title || "(none)",
    promptVariant: useLitePrompt ? "lite" : "v1",
    ...(persona ? { persona: persona.shortLabel } : {})
  })

  return { opportunities }
}
