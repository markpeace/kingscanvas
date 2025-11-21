import { getChatModel, defaultModel } from "@/lib/ai/client"
import { buildSuggestionPromptV5 } from "../ai/promptBuilder"
import { debug } from "@/lib/debug"
import { debugSink } from "@/components/debug/sink"
import { serverDebug } from "@/lib/debug/serverSink"
import type { BucketId } from "@/types/canvas"

type SuggestStepsInput = {
  intentionText?: string
  intentionBucket?: string
  historyAccepted?: string[]
  historyRejected?: string[]
}

type Suggestion = { bucket: BucketId; text: string }

type WorkflowName = "suggest-step"

type WorkflowResult = { suggestions: Suggestion[]; prompt: string }

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

    debugSink.push({
      label: "Step generation prompt",
      payload: prompt,
      channel: "ai",
      level: "trace"
    })

    serverDebug.push({
      label: "Step generation prompt",
      payload: prompt,
      channel: "ai",
      level: "trace"
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
      defaultModel

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
      bucket: payload.intentionBucket ?? bucket,
      preview: text.slice(0, 120)
    })

    return {
      suggestions: [
        {
          bucket,
          text
        }
      ],
      prompt
    }
  }

  throw new Error(`Unhandled workflow: ${workflowName}`)
}
