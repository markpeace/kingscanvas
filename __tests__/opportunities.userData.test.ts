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
          const id = new ObjectId()
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
      },
      async createIndex() {
        return { name: `${name}_index` }
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

const { resetCollections } = jest.requireMock("@/lib/dbHelpers") as { resetCollections: () => void }

describe("userData opportunities helpers", () => {
  beforeEach(() => {
    resetCollections()
    jest.resetModules()
  })

  it("returns an empty array when no opportunities exist", async () => {
    const { getOpportunitiesByStep } = await import("@/lib/userData")
    const result = await getOpportunitiesByStep("tester@example.com", "step-1")
    expect(result).toEqual([])
  })

  it("creates and fetches opportunities for a step", async () => {
    const { createOpportunitiesForStep, getOpportunitiesByStep } = await import("@/lib/userData")

    const drafts = [
      {
        title: "Attend networking breakfast",
        summary: "Join the monthly careers club breakfast to meet alumni.",
        source: "edge_simulated" as const,
        form: "short_form" as const,
        focus: "credibility" as const,
        status: "suggested" as const
      },
      {
        title: "Schedule mentor call",
        summary: "Set up a 30 minute catch-up with your assigned mentor.",
        source: "independent" as const,
        form: "sustained" as const,
        focus: ["capability", "capital"] as const,
        status: "saved" as const
      }
    ]

    const created = await createOpportunitiesForStep("tester@example.com", "step-1", drafts)
    expect(created).toHaveLength(2)
    expect(created[0]).toMatchObject({ stepId: "step-1", title: drafts[0].title, source: drafts[0].source })
    expect(typeof created[0].id).toBe("string")

    const fetched = await getOpportunitiesByStep("tester@example.com", "step-1")
    expect(fetched).toHaveLength(2)
    expect(fetched.map((item) => item.title)).toEqual([drafts[0].title, drafts[1].title])
  })

  it("deletes opportunities for a step", async () => {
    const { createOpportunitiesForStep, deleteOpportunitiesForStep, getOpportunitiesByStep } = await import("@/lib/userData")

    await createOpportunitiesForStep("tester@example.com", "step-1", [
      {
        title: "Mock interview",
        summary: "Run a mock interview with a friend to prepare.",
        source: "edge_simulated",
        form: "intensive",
        focus: "capability",
        status: "suggested"
      }
    ])

    await createOpportunitiesForStep("tester@example.com", "step-2", [
      {
        title: "Portfolio review",
        summary: "Share your portfolio with the creative careers team.",
        source: "independent",
        form: "evergreen",
        focus: "credibility",
        status: "suggested"
      }
    ])

    await deleteOpportunitiesForStep("tester@example.com", "step-1")

    const remaining = await getOpportunitiesByStep("tester@example.com", "step-1")
    expect(remaining).toEqual([])

    const untouched = await getOpportunitiesByStep("tester@example.com", "step-2")
    expect(untouched).toHaveLength(1)
  })
})
