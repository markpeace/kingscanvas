import { buildSuggestionPromptV5 } from "@/lib/ai/promptBuilder"
import { getChatModel } from "@/lib/ai/client"
import { debug } from "@/lib/debug"
import type { BucketId } from "@/types/canvas"

if (!process.env.LLM) {
  const message = "LLM environment variable must be set."
  debug.error(message) // visible in Debug Panel
  throw new Error(message) // prevents silent failure
}

const model = process.env.LLM

type SuggestNextStepInput = {
  intentionText?: string
  intentionBucket?: string
  historyAccepted?: string[]
  historyRejected?: string[]
}

type Suggestion = { bucket: BucketId; text: string }

type SuggestNextStepResult = { suggestions: Suggestion[] }

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

export default async function handler(payload: SuggestNextStepInput): Promise<SuggestNextStepResult> {
  const bucket = normaliseBucket(payload.intentionBucket)
  const promptBucket = mapBucketToPromptTarget(bucket)
  const intentionText = (payload.intentionText ?? "").trim() || "your intention"
  const historyAccepted = sanitiseHistory(payload.historyAccepted).slice(-5)
  const historyRejected = sanitiseHistory(payload.historyRejected).slice(-5)

  debug.info("Active LLM model (suggest-next-step workflow)", {
    model
  })

  const prompt = buildSuggestionPromptV5({
    intentionText,
    targetBucket: promptBucket,
    historyAccepted,
    historyRejected
  })

  debug.trace("Step generation prompt (suggest-next-step workflow)", {
    prompt
  })

  const llm = getChatModel()

  debug.info("LLM request (runtime ai)", {
    model,
    type: "chat-completion"
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

  return {
    suggestions: [
      {
        bucket,
        text
      }
    ]
  }
}
