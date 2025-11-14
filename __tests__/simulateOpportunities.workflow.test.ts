import { generateOpportunityDraftsForStep } from "@/lib/ai/opportunities"
import { runSimulateOpportunitiesWorkflow } from "@/lib/langgraph/workflow"

let invokeMock: jest.Mock

jest.mock("@/lib/ai/client", () => ({
  getChatModel: jest.fn()
}))

jest.mock("@/lib/debug", () => ({
  debug: {
    trace: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}))

describe("simulate-opportunities workflow", () => {
  beforeEach(() => {
    const { getChatModel } = jest.requireMock("@/lib/ai/client") as { getChatModel: jest.Mock }
    invokeMock = jest.fn()
    getChatModel.mockReset()
    getChatModel.mockReturnValue({ invoke: invokeMock })
  })

  it("parses valid drafts and defaults missing status", async () => {
    const mockResponse = [
      {
        title: "Attend creative sprint",
        summary: "Join a weekend sprint to collaborate on a creative brief with peers.",
        source: "edge_simulated",
        form: "intensive",
        focus: "capability",
        status: "saved"
      },
      {
        title: "Shadow a student ambassador",
        summary: "Observe a senior ambassador to learn how they engage prospective students.",
        source: "edge_simulated",
        form: "sustained",
        focus: ["credibility", "capital"]
      },
      {
        title: "Independent portfolio clinic",
        summary: "Host your own mini-portfolio review with friends and share constructive feedback.",
        source: "independent",
        form: "evergreen",
        focus: "credibility"
      }
    ]

    invokeMock.mockResolvedValue({ content: JSON.stringify(mockResponse) })

    const results = await generateOpportunityDraftsForStep({ stepTitle: "Build creative confidence" })

    expect(results).toHaveLength(3)
    expect(results.map((item) => item.title)).toEqual(mockResponse.map((item) => item.title))
    expect(results[0].status).toBe("saved")
    expect(results[1].status).toBe("suggested")
    expect(results[2].status).toBe("suggested")
  })

  it("throws an error when the model returns malformed JSON", async () => {
    invokeMock.mockResolvedValue({ content: "not-json" })

    await expect(
      runSimulateOpportunitiesWorkflow({ stepTitle: "Prepare interview stories" })
    ).rejects.toThrow("Failed to parse simulate-opportunities response")
  })

  it("normalises partial data and filters invalid entries", async () => {
    const mockResponse = [
      {
        title: "Studio skills lab",
        summary: "Drop into the maker space to learn one new prototyping technique.",
        source: "edge_simulated",
        form: "short_form",
        focus: ["capability", "unknown"]
      },
      {
        title: "Community spotlight blog",
        summary: "Publish a short profile celebrating a peer's recent achievement.",
        source: "independent",
        form: "evergreen",
        focus: ["credibility", "credibility"]
      },
      {
        title: "Invalid entry",
        summary: "",
        source: "edge_simulated",
        form: "intensive",
        focus: "capital"
      }
    ]

    invokeMock.mockResolvedValue({ content: JSON.stringify(mockResponse) })

    const results = await runSimulateOpportunitiesWorkflow({
      stepTitle: "Celebrate progress",
      intentionTitle: "Grow your creative network"
    })

    expect(results).toHaveLength(2)
    expect(results[0].focus).toBe("capability")
    expect(results[0].status).toBe("suggested")
    expect(results[1].focus).toBe("credibility")
    expect(results[1].status).toBe("suggested")
  })
})
