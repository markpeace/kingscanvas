import { debug } from "@/lib/debug"
import { runSimulateOpportunitiesWorkflow } from "@/lib/langgraph/workflow"
import type { OpportunityDraft } from "@/lib/langgraph/workflow"

export type GenerateOpportunityDraftsInput = {
  stepTitle: string
  intentionTitle?: string
  bucketId?: string
}

export async function generateOpportunityDraftsForStep(
  input: GenerateOpportunityDraftsInput
): Promise<OpportunityDraft[]> {
  try {
    return await runSimulateOpportunitiesWorkflow(input)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"

    debug.error("AI: failed to generate opportunity drafts", {
      message,
      stepTitle: input.stepTitle,
      bucketId: input.bucketId ?? null
    })

    const cause = error instanceof Error ? error : undefined

    if (cause) {
      throw new Error(`Failed to generate opportunity drafts: ${message}`, { cause })
    }

    throw new Error(`Failed to generate opportunity drafts: ${message}`)
  }
}
