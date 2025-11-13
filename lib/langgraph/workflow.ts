import { getChatModel } from "@/lib/ai/client"
import { buildSuggestionPromptV2 } from "../ai/promptBuilder"
import { debug } from "@/lib/debug"
import type { BucketId } from "@/types/canvas"

type SuggestStepsInput = {
  intentionText?: string
  intentionBucket?: string
  historyAccepted?: string[]
  historyRejected?: string[]
}

type Suggestion = { bucket: BucketId; text: string }

type WorkflowName = "suggest-steps"

type WorkflowResult = { suggestions: Suggestion[] }

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

function extractResponseText(response: unknown): string {
  if (typeof response === "string") {
    return response
  }

  if (response && typeof response === "object") {
    const message = response as { content?: unknown }
    const { content } = message

    if (typeof content === "string") {
      return content
    }

    if (Array.isArray(content)) {
      return content
        .map((part) => {
          if (typeof part === "string") {
            return part
          }

          if (part && typeof part === "object" && typeof (part as { text?: unknown }).text === "string") {
            return (part as { text: string }).text
          }

          return ""
        })
        .filter(Boolean)
        .join("\n")
    }
  }

  return String(response ?? "")
}

export async function runWorkflow(name: WorkflowName, input: SuggestStepsInput): Promise<WorkflowResult> {
  if (name !== "suggest-steps") {
    throw new Error(`Unknown workflow: ${name}`)
  }

  const bucket = normaliseBucket(input.intentionBucket)
  const promptBucket = mapBucketToPromptTarget(bucket)
  const intentionText = (input.intentionText ?? "").trim() || "your intention"
  const historyAccepted = sanitiseHistory(input.historyAccepted)
  const historyRejected = sanitiseHistory(input.historyRejected)

  const prompt = buildSuggestionPromptV2({
    intentionText,
    targetBucket: promptBucket,
    historyAccepted,
    historyRejected
  })

  debug.trace("AI Prompt Builder v2: constructed prompt", {
    bucket: input.intentionBucket ?? bucket,
    intention: intentionText
  })

  const llm = getChatModel()
  const response = await llm.invoke(prompt)
  const responseText = extractResponseText(response).trim()

  debug.info("AI: model response (prompt v2)", {
    bucket: input.intentionBucket ?? bucket,
    preview: responseText.slice(0, 120)
  })

  return {
    suggestions: [
      {
        bucket,
        text: responseText
      }
    ]
  }
}
