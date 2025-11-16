import { createSimulatedOpportunityDrafts, generateOpportunityDraftsForStep } from "@/lib/opportunities/simulation"

describe("deterministic opportunity simulation", () => {
  it("creates 3 King's Edge style drafts and 1 independent draft for school themed steps", () => {
    const drafts = createSimulatedOpportunityDrafts({ stepTitle: "Get experience in a school" })

    expect(drafts).toHaveLength(4)
    expect(drafts.filter((draft) => draft.source === "kings-edge-simulated")).toHaveLength(3)
    const independentDrafts = drafts.filter((draft) => draft.source === "independent")
    expect(independentDrafts).toHaveLength(1)
    expect(independentDrafts[0]?.form).toBe("independent-action")
  })

  it("creates contextual drafts for non school themes", () => {
    const drafts = createSimulatedOpportunityDrafts({ stepTitle: "Plan a summer research project" })

    expect(drafts).toHaveLength(4)
    drafts.forEach((draft) => {
      expect(draft.title.length).toBeGreaterThan(0)
      expect(draft.summary.length).toBeGreaterThan(0)
      expect(draft.summary.toLowerCase()).toContain("plan a summer research project")
    })
  })

  it("returns the same drafts via the async generator wrapper", async () => {
    const direct = createSimulatedOpportunityDrafts({
      stepTitle: "Prepare for teaching practice",
      intentionTitle: "Develop classroom confidence",
      bucket: "do-now"
    })

    const viaAsync = await generateOpportunityDraftsForStep({
      stepTitle: "Prepare for teaching practice",
      intentionTitle: "Develop classroom confidence",
      bucketId: "do-now"
    })

    expect(viaAsync).toEqual(direct)
  })
})
