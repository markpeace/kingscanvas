import type { Step } from "@/types/canvas"

type StepLike = Partial<Pick<Step, "id" | "status">> & { _id?: unknown }

const INELIGIBLE_STATUSES = new Set(["ghost", "suggested", "rejected"])

function hasPersistedIdentifier(step: StepLike): boolean {
  const stepId = typeof step.id === "string" ? step.id.trim() : ""
  if (stepId.length > 0) {
    return true
  }

  const rawId = step._id

  if (typeof rawId === "string" && rawId.trim().length > 0) {
    return true
  }

  if (rawId && typeof rawId === "object") {
    const maybeHex = (rawId as { toHexString?: () => string }).toHexString
    if (typeof maybeHex === "function") {
      const value = maybeHex.call(rawId)
      return typeof value === "string" && value.trim().length > 0
    }
  }

  return false
}

export function isStepEligibleForOpportunities(step?: StepLike | null): boolean {
  if (!step) {
    return false
  }

  if (!hasPersistedIdentifier(step)) {
    return false
  }

  const status = typeof step.status === "string" ? step.status.toLowerCase() : ""

  if (status && INELIGIBLE_STATUSES.has(status)) {
    return false
  }

  return true
}
