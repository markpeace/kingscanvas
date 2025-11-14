jest.mock("mongodb", () => {
  class MockObjectId {
    private value: string

    constructor(id?: string) {
      this.value = id ?? "507f1f77bcf86cd799439011"
    }

    toHexString() {
      return this.value
    }

    toString() {
      return this.value
    }

    static isValid(value: unknown) {
      return typeof value === "string" && value.length > 0
    }
  }

  return { ObjectId: MockObjectId }
})

jest.mock("@/lib/dbHelpers", () => ({
  getCollection: jest.fn()
}))

jest.mock("@/lib/ai/opportunities", () => ({
  generateOpportunityDraftsForStep: jest.fn()
}))

jest.mock("@/lib/userData", () => ({
  createOpportunitiesForStep: jest.fn(),
  deleteOpportunitiesForStep: jest.fn(),
  getUserIntentions: jest.fn()
}))

const { getCollection } = jest.requireMock("@/lib/dbHelpers") as { getCollection: jest.Mock }
const { generateOpportunityDraftsForStep } = jest.requireMock("@/lib/ai/opportunities") as {
  generateOpportunityDraftsForStep: jest.Mock
}
const { createOpportunitiesForStep, deleteOpportunitiesForStep, getUserIntentions } = jest.requireMock("@/lib/userData") as {
  createOpportunitiesForStep: jest.Mock
  deleteOpportunitiesForStep: jest.Mock
  getUserIntentions: jest.Mock
}

describe("generateOpportunitiesForStep", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("generates and stores opportunities for a persisted step", async () => {
    const stepId = "507f1f77bcf86cd799439011"
    const stepDocument = {
      _id: {
        toHexString: () => stepId,
        toString: () => stepId
      },
      user: "owner@example.com",
      title: "Shadow a teacher",
      bucket: "do-now",
      intentionId: "int-123"
    }

    const stepsFindOne = jest.fn()
    stepsFindOne.mockImplementation(async (query: Record<string, unknown>) => {
      if ("_id" in query && (query._id === stepId || typeof query._id === "object")) {
        return stepDocument
      }
      if ("id" in query && query.id === stepId) {
        return stepDocument
      }
      return null
    })

    getCollection.mockImplementation(async (name: string) => {
      if (name === "steps") {
        return { findOne: stepsFindOne }
      }
      throw new Error(`Unexpected collection requested: ${name}`)
    })

    getUserIntentions.mockResolvedValue({
      intentions: [
        { id: "int-123", title: "Become a teacher" }
      ]
    })

    generateOpportunityDraftsForStep.mockResolvedValue([
      {
        title: "Visit a local school",
        summary: "Spend a day shadowing a teacher at a partner school.",
        source: "edge_simulated",
        form: "intensive",
        focus: "capability",
        status: "suggested"
      },
      {
        title: "Talk to alumni",
        summary: "Interview an alumnus who works in education.",
        source: "edge_simulated",
        form: "short_form",
        focus: "credibility"
      },
      {
        title: "Apply for mentorship",
        summary: "Join the university's teaching mentorship scheme.",
        source: "independent",
        form: "sustained",
        focus: "capital",
        status: "saved"
      }
    ])

    const created = [
      {
        id: "opp-1",
        stepId,
        title: "Visit a local school",
        summary: "Spend a day shadowing a teacher at a partner school.",
        source: "edge_simulated",
        form: "intensive",
        focus: "capability",
        status: "suggested"
      },
      {
        id: "opp-2",
        stepId,
        title: "Talk to alumni",
        summary: "Interview an alumnus who works in education.",
        source: "edge_simulated",
        form: "short_form",
        focus: "credibility",
        status: "suggested"
      },
      {
        id: "opp-3",
        stepId,
        title: "Apply for mentorship",
        summary: "Join the university's teaching mentorship scheme.",
        source: "independent",
        form: "sustained",
        focus: "capital",
        status: "saved"
      }
    ]

    createOpportunitiesForStep.mockResolvedValue(created)

    const { generateOpportunitiesForStep } = await import("@/lib/opportunities/generation")

    const result = await generateOpportunitiesForStep({ stepId, origin: "shuffle" })

    expect(result).toEqual(created)
    expect(generateOpportunityDraftsForStep).toHaveBeenCalledWith({
      stepTitle: "Shadow a teacher",
      intentionTitle: "Become a teacher",
      bucketId: "do-now"
    })

    expect(deleteOpportunitiesForStep).toHaveBeenCalledWith("owner@example.com", stepId)
    expect(createOpportunitiesForStep).toHaveBeenCalledWith(
      "owner@example.com",
      stepId,
      [
        {
          title: "Visit a local school",
          summary: "Spend a day shadowing a teacher at a partner school.",
          source: "edge_simulated",
          form: "intensive",
          focus: "capability",
          status: "suggested"
        },
        {
          title: "Talk to alumni",
          summary: "Interview an alumnus who works in education.",
          source: "edge_simulated",
          form: "short_form",
          focus: "credibility",
          status: "suggested"
        },
        {
          title: "Apply for mentorship",
          summary: "Join the university's teaching mentorship scheme.",
          source: "independent",
          form: "sustained",
          focus: "capital",
          status: "saved"
        }
      ]
    )

    const deleteOrder = deleteOpportunitiesForStep.mock.invocationCallOrder[0]
    const createOrder = createOpportunitiesForStep.mock.invocationCallOrder[0]
    expect(deleteOrder).toBeLessThan(createOrder)
  })
})
