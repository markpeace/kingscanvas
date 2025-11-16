jest.mock("@/lib/ai/client", () => ({
  getChatModel: jest.fn()
}))

jest.mock("@/lib/debug", () => ({
  debug: {
    trace: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}))

describe("simulate opportunities workflow", () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  it("returns parsed drafts when the model responds with valid JSON", async () => {
    const mockDrafts = [
      {
        title: "Edge leadership sprint",
        summary: "Join a fictional King's Edge leadership intensive for first years.",
        source: "edge_simulated",
        form: "intensive",
        focus: ["capability", "credibility"],
        status: "suggested"
      },
      {
        title: "Edge networking dinner",
        summary: "Attend a curated dinner with alumni mentors.",
        source: "edge_simulated",
        form: "short_form",
        focus: "capital",
        status: "saved"
      },
      {
        title: "Independent volunteering",
        summary: "Arrange a weekend volunteering session at a local charity.",
        source: "independent",
        form: "evergreen",
        focus: "capability",
        status: "dismissed"
      }
    ]

    const invoke = jest.fn().mockResolvedValue({ content: JSON.stringify(mockDrafts) })
    const { getChatModel } = jest.requireMock("@/lib/ai/client") as { getChatModel: jest.Mock }
    getChatModel.mockReturnValue({ invoke })

    const { generateOpportunityDraftsForStep } = await import("@/lib/opportunities/simulation")
    const result = await generateOpportunityDraftsForStep({ stepTitle: "Prepare portfolio" })

    expect(result).toHaveLength(mockDrafts.length)
    result.forEach((draft, index) => {
      expect(draft.title).toBe(mockDrafts[index].title)
      expect(draft.summary).toBe(mockDrafts[index].summary)
      expect(draft.source).toBe(mockDrafts[index].source)
      expect(draft.form).toBe(mockDrafts[index].form)
      expect(draft.focus).toEqual(mockDrafts[index].focus)
      expect(draft.status).toBe(mockDrafts[index].status)
    })
  })

  it("throws a descriptive error when the model returns invalid JSON", async () => {
    const invoke = jest.fn().mockResolvedValue({ content: "not valid json" })
    const { getChatModel } = jest.requireMock("@/lib/ai/client") as { getChatModel: jest.Mock }
    getChatModel.mockReturnValue({ invoke })

    const { generateOpportunityDraftsForStep } = await import("@/lib/opportunities/simulation")

    await expect(
      generateOpportunityDraftsForStep({ stepTitle: "Draft presentation" })
    ).rejects.toThrow("Failed to parse simulate-opportunities response")
  })

  it("defaults missing statuses to suggested", async () => {
    const mockDrafts = [
      {
        title: "Edge mentorship circle",
        summary: "Participate in a rotating mentorship group.",
        source: "edge_simulated",
        form: "sustained",
        focus: ["capital", "credibility"]
      },
      {
        title: "Independent blog series",
        summary: "Write and publish a three-part reflective blog.",
        source: "independent",
        form: "evergreen",
        focus: "credibility"
      }
    ]

    const invoke = jest.fn().mockResolvedValue({ content: JSON.stringify(mockDrafts) })
    const { getChatModel } = jest.requireMock("@/lib/ai/client") as { getChatModel: jest.Mock }
    getChatModel.mockReturnValue({ invoke })

    const { generateOpportunityDraftsForStep } = await import("@/lib/opportunities/simulation")
    const result = await generateOpportunityDraftsForStep({ stepTitle: "Plan showcase" })

    expect(result).toHaveLength(mockDrafts.length)
    result.forEach((draft) => {
      expect(draft.status).toBe("suggested")
    })
  })
})
