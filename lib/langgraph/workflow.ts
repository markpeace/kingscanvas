import { client } from "@/lib/ai/client"
import { buildStepPrompt } from "@/lib/prompts/steps"
import { debug } from "@/lib/debug"
import type { BucketId } from "@/types/canvas"

type SuggestStepsInput = {
  intentionText?: string
  intentionBucket?: string
  historyAccepted?: string[]
  historyRejected?: string[]
}

type Suggestion = { bucket: BucketId; text: string; model: string | null }

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

    debug.trace("AI: suggest-step using model (PR-2)", {
      model: process.env.LLM
    })

    const response = await client.responses.create({
      model: process.env.LLM,
      input: prompt
    })

    const text =
      typeof response.output_text === "string"
        ? response.output_text.trim()
        : String(response.output_text || "").trim()

    debug.info("AI: step-generation response (PR-3-final)", {
      bucket: payload.intentionBucket ?? bucket,
      preview: text.slice(0, 120)
    })

    return {
      suggestions: [
        {
          bucket,
          text,
          model: process.env.LLM || null
        }
      ]
    }
  }

  throw new Error(`Unhandled workflow: ${workflowName}`)
}
