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
  const { ObjectId } = jest.requireMock("mongodb") as {
    ObjectId: new () => { toHexString: () => string; toString: () => string }
  }
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
          },
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
      async replaceOne(
        filter: Record<string, any>,
        replacement: Record<string, any>,
        options?: { upsert?: boolean }
      ) {
        const index = stores[name].findIndex((doc) => matches(doc, filter))
        if (index >= 0) {
          const existingId = stores[name][index]._id
          stores[name][index] = { ...replacement, ...(existingId ? { _id: existingId } : {}) }
          return {
            acknowledged: true,
            matchedCount: 1,
            modifiedCount: 1,
            upsertedCount: 0,
            upsertedId: null,
          }
        }
        if (options?.upsert) {
          const id = new ObjectId()
          stores[name].push({ ...replacement, _id: id })
          return {
            acknowledged: true,
            matchedCount: 0,
            modifiedCount: 0,
            upsertedCount: 1,
            upsertedId: id,
          }
        }
        return {
          acknowledged: true,
          matchedCount: 0,
          modifiedCount: 0,
          upsertedCount: 0,
          upsertedId: null,
        }
      },
      async updateOne(
        filter: Record<string, any>,
        update: Record<string, any>,
        options?: { upsert?: boolean }
      ) {
        const index = stores[name].findIndex((doc) => matches(doc, filter))
        const set = update.$set ?? {}
        if (index >= 0) {
          stores[name][index] = { ...stores[name][index], ...set }
          return {
            acknowledged: true,
            matchedCount: 1,
            modifiedCount: 1,
            upsertedCount: 0,
            upsertedId: null,
          }
        }
        if (options?.upsert) {
          const id = new ObjectId()
          stores[name].push({ ...filter, ...set, _id: id })
          return {
            acknowledged: true,
            matchedCount: 0,
            modifiedCount: 0,
            upsertedCount: 1,
            upsertedId: id,
          }
        }
        return {
          acknowledged: true,
          matchedCount: 0,
          modifiedCount: 0,
          upsertedCount: 0,
          upsertedId: null,
        }
      },
      async createIndex() {
        return { name: `${name}_index` }
      },
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
    resetCollections,
  }
})

jest.mock("@/lib/debug", () => ({
  debug: {
    trace: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

const { resetCollections } = jest.requireMock("@/lib/dbHelpers") as { resetCollections: () => void }

async function seedCanvasStep(user: string, stepId = "11111111-1111-4111-8111-111111111111") {
  const { saveStudentIntentions } = await import("@/lib/studentCanvas/repository")
  await saveStudentIntentions(user, [
    {
      id: "22222222-2222-4222-8222-222222222222",
      title: "Build experience",
      bucket: "do_now",
      progress_status: "in_progress",
      created_at: "2024-01-01T00:00:00.000Z",
      updated_at: "2024-01-01T00:00:00.000Z",
      steps: [
        {
          id: stepId,
          title: "Find opportunities",
          bucket: "do_now",
          order: 0,
          progress_status: "in_progress",
          created_at: "2024-01-01T00:00:00.000Z",
          updated_at: "2024-01-01T00:00:00.000Z",
          opportunities: [],
        },
      ],
    },
  ])
}

describe("userData opportunities helpers", () => {
  beforeEach(() => {
    resetCollections()
    jest.resetModules()
  })

  it("returns an empty array when no opportunities exist", async () => {
    const { getOpportunitiesByStep } = await import("@/lib/userData")
    const result = await getOpportunitiesByStep(
      "tester@example.com",
      "11111111-1111-4111-8111-111111111111"
    )
    expect(result).toEqual([])
  })

  it("creates and fetches opportunities for a step", async () => {
    const { createOpportunitiesForStep, getOpportunitiesByStep } = await import("@/lib/userData")
    await seedCanvasStep("tester@example.com")

    const drafts = [
      {
        title: "Attend networking breakfast",
        summary: "Join the monthly careers club breakfast to meet alumni.",
        source: "kings-edge-simulated" as const,
        form: "short-course" as const,
        focus: "community" as const,
        status: "suggested" as const,
      },
      {
        title: "Schedule mentor call",
        summary: "Set up a 30 minute catch-up with your assigned mentor.",
        source: "independent" as const,
        form: "independent-action" as const,
        focus: "experience" as const,
        status: "saved" as const,
      },
    ]

    const created = await createOpportunitiesForStep(
      "tester@example.com",
      "11111111-1111-4111-8111-111111111111",
      drafts
    )
    expect(created).toHaveLength(2)
    expect(created[0]).toMatchObject({
      stepId: "11111111-1111-4111-8111-111111111111",
      title: drafts[0].title,
      source: drafts[0].source,
    })
    expect(typeof created[0].id).toBe("string")

    const fetched = await getOpportunitiesByStep(
      "tester@example.com",
      "11111111-1111-4111-8111-111111111111"
    )
    expect(fetched).toHaveLength(2)
    expect(fetched.map((item) => item.title)).toEqual([drafts[0].title, drafts[1].title])
  })

  it("deletes opportunities for a step", async () => {
    const { createOpportunitiesForStep, deleteOpportunitiesForStep, getOpportunitiesByStep } =
      await import("@/lib/userData")
    const { saveStudentIntentions } = await import("@/lib/studentCanvas/repository")
    await saveStudentIntentions("tester@example.com", [
      {
        id: "22222222-2222-4222-8222-222222222222",
        title: "Build experience",
        bucket: "do_now",
        progress_status: "in_progress",
        created_at: "2024-01-01T00:00:00.000Z",
        updated_at: "2024-01-01T00:00:00.000Z",
        steps: [
          {
            id: "11111111-1111-4111-8111-111111111111",
            title: "Find opportunities",
            bucket: "do_now",
            order: 0,
            progress_status: "in_progress",
            created_at: "2024-01-01T00:00:00.000Z",
            updated_at: "2024-01-01T00:00:00.000Z",
            opportunities: [],
          },
          {
            id: "33333333-3333-4333-8333-333333333333",
            title: "Review portfolio",
            bucket: "do_later",
            order: 1,
            progress_status: "in_progress",
            created_at: "2024-01-01T00:00:00.000Z",
            updated_at: "2024-01-01T00:00:00.000Z",
            opportunities: [],
          },
        ],
      },
    ])

    await createOpportunitiesForStep("tester@example.com", "11111111-1111-4111-8111-111111111111", [
      {
        title: "Mock interview",
        summary: "Run a mock interview with a friend to prepare.",
        source: "kings-edge-simulated",
        form: "workshop",
        focus: "skills",
        status: "suggested",
      },
    ])

    await createOpportunitiesForStep("tester@example.com", "33333333-3333-4333-8333-333333333333", [
      {
        title: "Portfolio review",
        summary: "Share your portfolio with the creative careers team.",
        source: "independent",
        form: "independent-action",
        focus: "reflection",
        status: "suggested",
      },
    ])

    await deleteOpportunitiesForStep("tester@example.com", "11111111-1111-4111-8111-111111111111")

    const remaining = await getOpportunitiesByStep(
      "tester@example.com",
      "11111111-1111-4111-8111-111111111111"
    )
    expect(remaining).toEqual([])

    const untouched = await getOpportunitiesByStep(
      "tester@example.com",
      "33333333-3333-4333-8333-333333333333"
    )
    expect(untouched).toHaveLength(1)
  })
})
