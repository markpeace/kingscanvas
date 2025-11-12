import { BUCKETS, bucketOrder } from '@/lib/buckets'
import type { BucketId } from '@/types/canvas'

type SuggestStepsInput = {
  intentionText?: string
  intentionBucket?: string
  historyAccepted?: string[]
  historyRejected?: string[]
}

type Suggestion = { bucket: BucketId; text: string }

type WorkflowName = 'suggest-steps'

type WorkflowResult = { suggestions: Suggestion[] }

const suggestionTemplates: Record<BucketId, (goal: string) => string> = {
  'do-now': (goal) => `Write a quick action list for "${goal}" to capture momentum today.`,
  'do-later': (goal) => `Schedule a 30-minute block this week to explore next steps toward "${goal}".`,
  'before-graduation': (goal) => `Map the skills, qualifications, and milestones needed before graduating to achieve "${goal}".`,
  'after-graduation': (goal) => `Outline a post-graduation support network that keeps "${goal}" moving forward.`
}

function normaliseBucket(bucket?: string): BucketId | undefined {
  if (!bucket) return undefined
  return BUCKETS.find((b) => b.id === bucket)?.id
}

function lowerSet(values: string[] | undefined) {
  return new Set((values || []).map((value) => value.trim().toLowerCase()).filter(Boolean))
}

function buildSuggestions(input: SuggestStepsInput): Suggestion[] {
  const intentionText = (input.intentionText || 'your goal').trim()
  const normalisedBucket = normaliseBucket(input.intentionBucket)
  const intentionIndex = normalisedBucket ? bucketOrder[normalisedBucket] ?? BUCKETS.length - 1 : BUCKETS.length - 1
  const allowedBuckets = BUCKETS.filter((bucket) => (bucketOrder[bucket.id] ?? BUCKETS.length) <= intentionIndex)
  const consideredBuckets = allowedBuckets.length > 0 ? allowedBuckets : BUCKETS.slice(0, 1)

  const seen = lowerSet([...(input.historyAccepted || []), ...(input.historyRejected || [])])

  const suggestions = consideredBuckets
    .map(({ id }) => {
      const template = suggestionTemplates[id]
      return { bucket: id, text: template(intentionText) }
    })
    .filter((suggestion) => !seen.has(suggestion.text.toLowerCase()))

  return suggestions
}

export async function runWorkflow(name: WorkflowName, input: SuggestStepsInput): Promise<WorkflowResult> {
  if (name !== 'suggest-steps') {
    throw new Error(`Unknown workflow: ${name}`)
  }

  const suggestions = buildSuggestions(input)
  return { suggestions }
}
