import type { BucketId, Step } from "@/types/canvas"

type StepLike = Partial<Pick<Step, "id" | "status" | "bucket">> & { _id?: unknown }

const INELIGIBLE_STATUSES = new Set(["ghost", "suggested", "rejected"])
const ELIGIBLE_BUCKETS: ReadonlySet<BucketId> = new Set(["do-now", "do-later", "before-graduation"])

export function resolvePersistedStepId(step?: StepLike | null): string | null {
  if (!step) {
    return null
  }

  const id = typeof step.id === "string" ? step.id.trim() : ""
  if (id.length > 0) {
    return id
  }

  const rawId = step._id

  if (rawId && typeof rawId === "object" && "toHexString" in rawId && typeof rawId.toHexString === "function") {
    const hex = rawId.toHexString()
    return typeof hex === "string" && hex.trim().length > 0 ? hex.trim() : null
  }

  if (typeof rawId === "string" && rawId.trim().length > 0) {
    return rawId.trim()
  }

  return null
}

// Eligibility: persisted steps that are active (not ghost/suggested/rejected) and live in a main bucket
// (do-now, do-later, before-graduation) can request opportunities once saved.
export function isStepEligibleForOpportunities(step?: StepLike | null): boolean {
  if (!step) {
    return false
  }

  const persistedId = resolvePersistedStepId(step)

  if (!persistedId) {
    return false
  }

  const status = typeof step.status === "string" ? step.status.toLowerCase() : ""

  if (status && INELIGIBLE_STATUSES.has(status)) {
    return false
  }

  const bucket = typeof step.bucket === "string" ? (step.bucket.trim() as BucketId) : ""

  if (!bucket || !ELIGIBLE_BUCKETS.has(bucket as BucketId)) {
    return false
  }

  // Eligible steps must be persisted, active (not ghost/suggested/rejected), and live in a main bucket.

  return true
}
