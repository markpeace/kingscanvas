import { createSimulatedOpportunityDrafts, generateOpportunityDraftsForStep } from "@/lib/opportunities/simulation"

describe("deterministic opportunity simulation", () => {
  it("creates bucket-aware King's Edge drafts and an independent action for school themed steps", () => {
    const drafts = createSimulatedOpportunityDrafts({ stepTitle: "Get experience in a school", bucket: "do-now" })

    expect(drafts).toHaveLength(4)

    const [first, second, third, fourth] = drafts

    expect(first.title).toBe("Join a King's Edge taster on routes into teaching")
    expect(second.title).toBe("Support a King's outreach visit to a local school")
    expect(third.title).toBe("Book a one to one to map your teaching pathway")

    drafts.slice(0, 3).forEach((draft) => {
      expect(draft.source).toBe("kings-edge-simulated")
    })

    expect(fourth.source).toBe("independent")
    expect(fourth.form).toBe("independent-action")
    expect(fourth.summary).toContain("Get experience in a school")
  })

  it("normalises legacy buckets and generates themed templates", () => {
    const drafts = createSimulatedOpportunityDrafts({
      stepTitle: "Plan a summer research project",
      bucket: "before-graduation"
    })

    expect(drafts.map((draft) => draft.title)).toEqual([
      "Complete a King's Edge research methods micro-credential",
      "Lead a King's Edge research dissemination project",
      "Assemble a research showcase portfolio",
      "Design a small independent research mini project"
    ])

    expect(drafts.some((draft) => draft.summary.toLowerCase().includes("plan a summer research project"))).toBe(true)
  })

  it("returns the same drafts via the async generator wrapper", async () => {
    const direct = createSimulatedOpportunityDrafts({
      stepTitle: "Prepare for teaching practice",
      intentionTitle: "Develop classroom confidence",
      bucket: "after-graduation",
      theme: "teaching"
    })

    const viaAsync = await generateOpportunityDraftsForStep({
      stepTitle: "Prepare for teaching practice",
      intentionTitle: "Develop classroom confidence",
      bucketId: "after-graduation"
    })

    expect(viaAsync).toEqual(direct)
  })

  it("always returns four drafts with populated content", () => {
    const drafts = createSimulatedOpportunityDrafts({
      stepTitle: "Shadow a neurology clinic",
      intentionTitle: "Explore health careers"
    })

    expect(drafts).toHaveLength(4)
    drafts.forEach((draft) => {
      expect(draft.title.trim().length).toBeGreaterThan(0)
      expect(draft.summary.trim().length).toBeGreaterThan(0)
    })
  })

  it("guarantees a 3:1 mix of King's Edge to independent sources", () => {
    const drafts = createSimulatedOpportunityDrafts({
      stepTitle: "Plan a research placement"
    })

    const edgeDrafts = drafts.filter((draft) => draft.source === "kings-edge-simulated")
    const independentDrafts = drafts.filter((draft) => draft.source === "independent")

    expect(edgeDrafts).toHaveLength(3)
    expect(independentDrafts).toHaveLength(1)
  })

  it("is deterministic for identical inputs", () => {
    const firstRun = createSimulatedOpportunityDrafts({
      stepTitle: "Develop science communication skills",
      bucket: "do-later"
    })
    const secondRun = createSimulatedOpportunityDrafts({
      stepTitle: "Develop science communication skills",
      bucket: "do-later"
    })

    expect(secondRun).toEqual(firstRun)
  })
})
