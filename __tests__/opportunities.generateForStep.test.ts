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
  getOpportunitiesByStep: jest.fn(),
  getUserIntentions: jest.fn()
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

const { getCollection } = jest.requireMock("@/lib/dbHelpers") as { getCollection: jest.Mock }
const { generateOpportunityDraftsForStep } = jest.requireMock("@/lib/ai/opportunities") as {
  generateOpportunityDraftsForStep: jest.Mock
}
const { createOpportunitiesForStep, deleteOpportunitiesForStep, getOpportunitiesByStep, getUserIntentions } = jest.requireMock("@/lib/userData") as {
  createOpportunitiesForStep: jest.Mock
  deleteOpportunitiesForStep: jest.Mock
  getOpportunitiesByStep: jest.Mock
  getUserIntentions: jest.Mock
}
const { debug } = jest.requireMock("@/lib/debug") as {
  debug: {
    trace: jest.Mock
    debug: jest.Mock
    info: jest.Mock
    warn: jest.Mock
    error: jest.Mock
  }
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

describe("stepHasOpportunities", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("returns true when a step already has opportunities", async () => {
    const stepId = "507f1f77bcf86cd799439011"
    const stepDocument = {
      _id: { toHexString: () => stepId, toString: () => stepId },
      user: "owner@example.com"
    }

    getCollection.mockImplementation(async (name: string) => {
      if (name === "steps") {
        return { findOne: jest.fn().mockResolvedValue(stepDocument) }
      }
      throw new Error(`Unexpected collection requested: ${name}`)
    })

    getOpportunitiesByStep.mockResolvedValue([{ id: "opp-1" }])

    const { stepHasOpportunities } = await import("@/lib/opportunities/generation")

    const result = await stepHasOpportunities(stepId)

    expect(result).toBe(true)
    expect(getOpportunitiesByStep).toHaveBeenCalledWith("owner@example.com", stepId)
  })

  it("returns false when the step cannot be found", async () => {
    getCollection.mockImplementation(async (name: string) => {
      if (name === "steps") {
        return { findOne: jest.fn().mockResolvedValue(null) }
      }
      throw new Error(`Unexpected collection requested: ${name}`)
    })

    const { stepHasOpportunities } = await import("@/lib/opportunities/generation")

    const result = await stepHasOpportunities("missing")

    expect(result).toBe(false)
    expect(getOpportunitiesByStep).not.toHaveBeenCalled()
  })
})

describe("safelyGenerateOpportunitiesForStep", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("invokes generation and logs on success", async () => {
    const stepId = "507f1f77bcf86cd799439011"
    const stepDocument = {
      _id: { toHexString: () => stepId, toString: () => stepId },
      user: "owner@example.com",
      title: "Shadow a teacher",
      bucket: "do-now",
      intentionId: "int-123"
    }

    getCollection.mockImplementation(async (name: string) => {
      if (name === "steps") {
        return { findOne: jest.fn().mockResolvedValue(stepDocument) }
      }
      throw new Error(`Unexpected collection requested: ${name}`)
    })

    getUserIntentions.mockResolvedValue({ intentions: [] })
    generateOpportunityDraftsForStep.mockResolvedValue([])
    createOpportunitiesForStep.mockResolvedValue([])

    const { safelyGenerateOpportunitiesForStep } = await import("@/lib/opportunities/generation")

    await safelyGenerateOpportunitiesForStep(stepId, "manual")

    expect(debug.info).toHaveBeenCalledWith("Opportunities: auto generation requested", {
      stepId,
      origin: "manual"
    })
    expect(debug.error).not.toHaveBeenCalled()
  })

  it("swallows errors when generation fails", async () => {
    const stepId = "507f1f77bcf86cd799439011"
    const stepDocument = {
      _id: { toHexString: () => stepId, toString: () => stepId },
      user: "owner@example.com",
      title: "Shadow a teacher",
      bucket: "do-now",
      intentionId: "int-123"
    }

    getCollection.mockImplementation(async (name: string) => {
      if (name === "steps") {
        return { findOne: jest.fn().mockResolvedValue(stepDocument) }
      }
      throw new Error(`Unexpected collection requested: ${name}`)
    })

    getUserIntentions.mockResolvedValue({ intentions: [] })
    generateOpportunityDraftsForStep.mockRejectedValue(new Error("workflow timeout"))

    const { safelyGenerateOpportunitiesForStep } = await import("@/lib/opportunities/generation")

    await expect(safelyGenerateOpportunitiesForStep(stepId, "manual")).resolves.toBeUndefined()

    expect(debug.info).toHaveBeenCalledWith("Opportunities: auto generation requested", {
      stepId,
      origin: "manual"
    })
    expect(debug.error).toHaveBeenCalledWith("Opportunities: auto generation failed", {
      stepId,
      origin: "manual",
      message: "workflow timeout"
    })
  })
})
