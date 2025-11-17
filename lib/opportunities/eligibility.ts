import type { Step } from "@/types/canvas"

const DISQUALIFYING_STATUSES = new Set(["ghost", "suggested"])

type StepEligibilityInput = Pick<Step, "id" | "status" | "source"> | { id?: string | null; status?: string | null; source?: string | null }

function normalize(value?: string | null): string {
  return typeof value === "string" ? value.trim().toLowerCase() : ""
}

export function isStepEligibleForOpportunities(step?: StepEligibilityInput | null): boolean {
  if (!step) {
    return false
  }

  const normalizedId = normalize(step.id)
  if (!normalizedId) {
    return false
  }

  const normalizedStatus = normalize(step.status)
  if (DISQUALIFYING_STATUSES.has(normalizedStatus)) {
    return false
  }

  const normalizedSource = normalize(step.source)

  if (normalizedSource === "ai") {
    return normalizedStatus === "accepted"
  }

  return true
}

