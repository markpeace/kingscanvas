jest.mock("mongodb", () => {
  let counter = 0

  class MockObjectId {
    private value: string

    constructor(id?: string) {
      if (id) {
        this.value = id
        return
      }

      counter += 1
      const seed = (Date.now() + counter).toString(16)
      this.value = seed.padStart(24, "0").slice(-24)
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

jest.mock("@/lib/dbHelpers", () => {
  const { ObjectId } = jest.requireMock("mongodb") as { ObjectId: new () => { toHexString: () => string; toString: () => string } }
  type MockId = InstanceType<typeof ObjectId>
  const stores: Record<string, Array<Record<string, any>>> = {}

  const matches = (doc: Record<string, any>, filter: Record<string, any>) =>
    Object.entries(filter).every(([key, value]) => {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        if ("$in" in value && Array.isArray(value.$in)) {
          return value.$in.includes(doc[key])
        }
        if (
          doc[key] &&
          typeof doc[key] === "object" &&
          "toHexString" in doc[key] &&
          typeof (doc[key] as { toHexString: () => string }).toHexString === "function" &&
          "toHexString" in value &&
          typeof (value as { toHexString?: () => string }).toHexString === "function"
        ) {
          return (doc[key] as { toHexString: () => string }).toHexString() ===
            (value as { toHexString: () => string }).toHexString()
        }
      }

      if (
        doc[key] &&
        typeof doc[key] === "object" &&
        "toHexString" in doc[key] &&
        typeof (doc[key] as { toHexString: () => string }).toHexString === "function" &&
        typeof value === "string"
      ) {
        return (doc[key] as { toHexString: () => string }).toHexString() === value
      }

      if (
        value &&
        typeof value === "object" &&
        "toHexString" in value &&
        typeof (value as { toHexString: () => string }).toHexString === "function" &&
        typeof doc[key] === "string"
      ) {
        return doc[key] === (value as { toHexString: () => string }).toHexString()
      }

      return doc[key] === value
    })

  const getCollection = jest.fn(async (name: string) => {
    if (!stores[name]) {
      stores[name] = []
    }

    return {
      find(filter: Record<string, any>) {
        const results = stores[name].filter((doc) => matches(doc, filter))
        return {
          async toArray() {
            return results.slice()
          }
        }
      },
      async findOne(filter: Record<string, any>) {
        return stores[name].find((doc) => matches(doc, filter)) ?? null
      },
      async insertMany(docs: Array<Record<string, any>>) {
        const insertedIds: Record<number, MockId> = {}
        docs.forEach((doc, index) => {
          const id = doc._id instanceof ObjectId ? doc._id : new ObjectId()
          stores[name].push({ ...doc, _id: id })
          insertedIds[index] = id
        })
        return { acknowledged: true, insertedCount: docs.length, insertedIds }
      },
      async deleteMany(filter: Record<string, any>) {
        const before = stores[name].length
        stores[name] = stores[name].filter((doc) => !matches(doc, filter))
        return { acknowledged: true, deletedCount: before - stores[name].length }
      },
      async updateOne() {
        return { acknowledged: true, matchedCount: 0, modifiedCount: 0, upsertedCount: 0, upsertedId: null }
      }
    }
  })

  const resetCollections = () => {
    Object.keys(stores).forEach((key) => {
      stores[key] = []
    })
  }

  return {
    getCollection,
    ensureStepIndexes: jest.fn(),
    ensureOpportunityIndexes: jest.fn(),
    resetCollections
  }
})

jest.mock("@/lib/debug", () => ({
  debug: {
    trace: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}))

jest.mock("@/lib/opportunities/simulation", () => ({
  generateOpportunityDraftsForStep: jest.fn()
}))

const { resetCollections } = jest.requireMock("@/lib/dbHelpers") as { resetCollections: () => void }
const { generateOpportunityDraftsForStep } = jest.requireMock("@/lib/opportunities/simulation") as {
  generateOpportunityDraftsForStep: jest.MockedFunction<(
    input: { stepTitle: string; intentionTitle?: string; bucketId?: string }
  ) => Promise<
    Array<{
      title: string
      summary: string
      source: "edge_simulated" | "independent"
      form: "intensive" | "evergreen" | "short_form" | "sustained"
      focus: any
      status?: "suggested" | "saved" | "dismissed"
    }>
  >>
}
const { debug } = jest.requireMock("@/lib/debug") as {
  debug: { info: jest.Mock; error: jest.Mock }
}

describe("generateOpportunitiesForStep", () => {
  beforeEach(() => {
    resetCollections()
    generateOpportunityDraftsForStep.mockReset()
    debug.info.mockReset()
    debug.error.mockReset()
  })

  it("generates and replaces opportunities for a step", async () => {
    const { ObjectId } = jest.requireMock("mongodb") as { ObjectId: new () => { toHexString: () => string } }
    const { getCollection } = jest.requireMock("@/lib/dbHelpers") as { getCollection: jest.Mock }

    const stepObjectId = new ObjectId()
    const canonicalStepId = stepObjectId.toHexString()

    const stepsCol = await getCollection("steps")
    await stepsCol.insertMany([
      {
        _id: stepObjectId,
        user: "owner@example.com",
        intentionId: "int-123",
        title: "Prepare portfolio",
        bucket: "do-now"
      }
    ])

    const intentionsCol = await getCollection("intentions")
    await intentionsCol.insertMany([
      {
        user: "owner@example.com",
        intentions: [
          { id: "int-123", title: "Launch creative career" }
        ]
      }
    ])

    const { createOpportunitiesForStep, getOpportunitiesByStep } = await import("@/lib/userData")

    await createOpportunitiesForStep("owner@example.com", canonicalStepId, [
      {
        title: "Old opportunity",
        summary: "Legacy summary",
        source: "edge_simulated",
        form: "evergreen",
        focus: "capability",
        status: "suggested"
      }
    ])

    generateOpportunityDraftsForStep.mockResolvedValue([
      {
        title: "Attend industry breakfast",
        summary: "Meet alumni working in creative agencies.",
        source: "edge_simulated",
        form: "short_form",
        focus: "credibility",
        status: "suggested"
      },
      {
        title: "Shadow a portfolio review",
        summary: "Observe how mentors critique a professional portfolio.",
        source: "edge_simulated",
        form: "intensive",
        focus: ["capability", "credibility"],
        status: "suggested"
      },
      {
        title: "Join creative showcase",
        summary: "Apply to present work at the student showcase in March.",
        source: "independent",
        form: "sustained",
        focus: "capital",
        status: "saved"
      }
    ])

    const { generateOpportunitiesForStep } = await import("@/lib/opportunities/generation")

    const created = await generateOpportunitiesForStep({ stepId: canonicalStepId, origin: "shuffle" })

    expect(created).toHaveLength(3)
    expect(created.every((item) => item.stepId === canonicalStepId)).toBe(true)
    expect(generateOpportunityDraftsForStep).toHaveBeenCalledWith({
      stepTitle: "Prepare portfolio",
      intentionTitle: "Launch creative career",
      bucketId: "do-now"
    })

    const remaining = await getOpportunitiesByStep("owner@example.com", canonicalStepId)
    expect(remaining).toHaveLength(3)
    expect(remaining.map((item) => item.title)).toEqual([
      "Attend industry breakfast",
      "Shadow a portfolio review",
      "Join creative showcase"
    ])
  })

  it("throws StepNotFoundError when the step does not exist", async () => {
    const { generateOpportunitiesForStep, StepNotFoundError } = await import("@/lib/opportunities/generation")

    await expect(
      generateOpportunitiesForStep({ stepId: "nonexistent", origin: "manual" })
    ).rejects.toBeInstanceOf(StepNotFoundError)
  })

  it("propagates AI failures and logs an error", async () => {
    const { ObjectId } = jest.requireMock("mongodb") as { ObjectId: new () => { toHexString: () => string } }
    const { getCollection } = jest.requireMock("@/lib/dbHelpers") as { getCollection: jest.Mock }

    const stepObjectId = new ObjectId()
    const canonicalStepId = stepObjectId.toHexString()

    const stepsCol = await getCollection("steps")
    await stepsCol.insertMany([
      {
        _id: stepObjectId,
        user: "owner@example.com",
        intentionId: "int-789",
        title: "Draft presentation",
        bucket: "do-later"
      }
    ])

    const { createOpportunitiesForStep } = await import("@/lib/userData")

    await createOpportunitiesForStep("owner@example.com", canonicalStepId, [
      {
        title: "Keep existing",
        summary: "Old record should stay if AI fails.",
        source: "independent",
        form: "evergreen",
        focus: "capability",
        status: "suggested"
      }
    ])

    generateOpportunityDraftsForStep.mockRejectedValue(new Error("AI offline"))

    const { generateOpportunitiesForStep } = await import("@/lib/opportunities/generation")

    await expect(
      generateOpportunitiesForStep({ stepId: canonicalStepId, origin: "ai-accepted" })
    ).rejects.toThrow("AI offline")

    expect(debug.error).toHaveBeenCalledWith(
      "Opportunities: generateOpportunitiesForStep failure",
      expect.objectContaining({ stepId: canonicalStepId, origin: "ai-accepted", message: "AI offline" })
    )
  })
})
