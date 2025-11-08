import { BUCKETS } from '@/lib/buckets'
import type { BucketId, Intention, Step } from '@/types/canvas'

const BUCKET_SEQUENCE = BUCKETS.map((bucket) => bucket.id)

export function concertinaSteps(intentions: Intention[], targetBucket: BucketId, movedIntentionId: string): Step[] {
  const targetIndex = BUCKET_SEQUENCE.indexOf(targetBucket)
  if (targetIndex === -1) {
    return []
  }

  const prevBucket = BUCKET_SEQUENCE[Math.max(targetIndex - 1, 0)] ?? 'do-now'
  const movedIntention = intentions.find((intention) => intention.id === movedIntentionId)

  if (!movedIntention) {
    return []
  }

  const reassignedSteps = movedIntention.steps.map((step) => {
    const stepIndex = BUCKET_SEQUENCE.indexOf(step.bucket)

    if (stepIndex === -1) {
      return step
    }

    if (stepIndex >= targetIndex) {
      return { ...step, bucket: prevBucket }
    }

    return step
  })

  return BUCKET_SEQUENCE.reduce<Step[]>((allSteps, bucketId) => {
    const stepsForBucket = reassignedSteps
      .filter((step) => step.bucket === bucketId)
      .sort((a, b) => a.order - b.order)
      .map((step, index) => ({ ...step, order: index + 1 }))

    return [...allSteps, ...stepsForBucket]
  }, [])
}
