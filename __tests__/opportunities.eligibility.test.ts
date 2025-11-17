import { isStepEligibleForOpportunities } from "@/lib/opportunities/eligibility"

describe("isStepEligibleForOpportunities", () => {
  it("returns true for manual steps with backend ids", () => {
    expect(
      isStepEligibleForOpportunities({
        id: "step-manual-1",
        status: "active",
        source: "manual"
      })
    ).toBe(true)
  })

  it("returns true for accepted AI steps", () => {
    expect(
      isStepEligibleForOpportunities({
        id: "step-ai-accepted",
        status: "accepted",
        source: "ai"
      })
    ).toBe(true)
  })

  it("returns false for ghost or suggested steps", () => {
    expect(
      isStepEligibleForOpportunities({
        id: "ghost-1",
        status: "ghost",
        source: "manual"
      })
    ).toBe(false)

    expect(
      isStepEligibleForOpportunities({
        id: "ai-suggestion-1",
        status: "suggested",
        source: "ai"
      })
    ).toBe(false)
  })

  it("returns false for AI steps that have not been accepted", () => {
    expect(
      isStepEligibleForOpportunities({
        id: "ai-pending-1",
        status: "active",
        source: "ai"
      })
    ).toBe(false)
  })

  it("returns false for steps without persisted ids", () => {
    expect(
      isStepEligibleForOpportunities({
        id: " ",
        status: "active",
        source: "manual"
      })
    ).toBe(false)
  })
})
