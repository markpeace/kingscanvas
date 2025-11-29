import { isStepEligibleForOpportunities, resolvePersistedStepId } from "@/lib/opportunities/eligibility"

describe("isStepEligibleForOpportunities", () => {
  it("treats manual steps with persisted ids as eligible", () => {
    expect(
      isStepEligibleForOpportunities({
        id: "step-123",
        status: "active",
        bucket: "do-now"
      })
    ).toBe(true)
  })

  it("allows accepted AI steps that have a Mongo id", () => {
    const objectId = { toHexString: () => "507f1f77bcf86cd799439011" }
    expect(
      isStepEligibleForOpportunities({
        _id: objectId,
        status: "accepted",
        bucket: "do-later"
      })
    ).toBe(true)
  })

  it("blocks ghost placeholder steps", () => {
    expect(
      isStepEligibleForOpportunities({
        id: "ghost-1",
        status: "ghost",
        bucket: "do-now"
      })
    ).toBe(false)
  })

  it("blocks suggested AI steps even if they have ids", () => {
    expect(
      isStepEligibleForOpportunities({
        id: "ai-123",
        status: "suggested",
        bucket: "before-graduation"
      })
    ).toBe(false)
  })

  it("rejects steps without a persisted id", () => {
    expect(
      isStepEligibleForOpportunities({
        id: "",
        status: "active",
        bucket: "do-now"
      })
    ).toBe(false)
    expect(isStepEligibleForOpportunities({ status: "active", bucket: "do-now" })).toBe(false)
  })

  it("rejects steps in buckets that do not surface opportunities", () => {
    expect(
      isStepEligibleForOpportunities({
        id: "step-123",
        status: "active",
        bucket: "after-graduation"
      })
    ).toBe(false)
  })

  it("extracts a persisted identifier from Mongo object ids", () => {
    const objectId = { toHexString: () => "507f1f77bcf86cd799439011" }
    expect(resolvePersistedStepId({ _id: objectId })).toBe("507f1f77bcf86cd799439011")
  })

  it("prefers string ids when both id and _id are present", () => {
    expect(resolvePersistedStepId({ id: "step-456", _id: "507f1f77bcf86cd799439012" })).toBe("step-456")
  })
})
