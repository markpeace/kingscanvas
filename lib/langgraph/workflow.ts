import { getChatModel } from "@/lib/ai/client"
import { buildStepPrompt } from "@/lib/prompts/steps"
import { debug } from "@/lib/debug"
import type { BucketId } from "@/types/canvas"

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

function normaliseBucket(bucket?: string): BucketId {
  if (bucket && (VALID_BUCKETS as string[]).includes(bucket)) {
    return bucket as BucketId
  }

  return "do-now"
}

export async function runWorkflow(workflowName: WorkflowName, payload: SuggestStepsInput): Promise<WorkflowResult> {
  if (workflowName !== "suggest-step") {
    throw new Error(`Unknown workflow: ${workflowName}`)
  }

  const bucket = normaliseBucket(payload.intentionBucket)
  const intentionText = (payload.intentionText ?? "").trim() || "your intention"

  if (workflowName === "suggest-step") {
    const prompt = buildStepPrompt({
      intention: intentionText,
      bucket
    })

    debug.trace("AI: step-generation prompt (PR-3)", {
      preview: prompt.slice(0, 200)
    })

    const llm = getChatModel()
    const resolvedModel =
      (typeof llm.model === "string" && llm.model.trim().length > 0
        ? llm.model
        : undefined) ??
      (typeof llm.modelName === "string" && llm.modelName.trim().length > 0
        ? llm.modelName
        : undefined) ??
      null

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
      ]
    }
  }

  throw new Error(`Unhandled workflow: ${workflowName}`)
}
