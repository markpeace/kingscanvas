import { isStepEligibleForOpportunities } from "@/lib/opportunities/eligibility"

describe("isStepEligibleForOpportunities", () => {
  it("treats manual steps with persisted ids as eligible", () => {
    expect(
      isStepEligibleForOpportunities({
        id: "step-123",
        status: "active"
      })
    ).toBe(true)
  })

  it("allows accepted AI steps that have a Mongo id", () => {
    const objectId = { toHexString: () => "507f1f77bcf86cd799439011" }
    expect(
      isStepEligibleForOpportunities({
        _id: objectId,
        status: "accepted"
      })
    ).toBe(true)
  })

  it("blocks ghost placeholder steps", () => {
    expect(
      isStepEligibleForOpportunities({
        id: "ghost-1",
        status: "ghost"
      })
    ).toBe(false)
  })

  it("blocks suggested AI steps even if they have ids", () => {
    expect(
      isStepEligibleForOpportunities({
        id: "ai-123",
        status: "suggested"
      })
    ).toBe(false)
  })

  it("rejects steps without a persisted id", () => {
    expect(
      isStepEligibleForOpportunities({
        id: "",
        status: "active"
      })
    ).toBe(false)
    expect(isStepEligibleForOpportunities({ status: "active" })).toBe(false)
  })
})
