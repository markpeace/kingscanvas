import type {
  OpportunityFocus,
  OpportunityForm,
  OpportunitySource,
  OpportunityStatus,
} from "@/types/canvas"

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
        if (
          doc[key] &&
          typeof doc[key] === "object" &&
          "toHexString" in doc[key] &&
          typeof (doc[key] as { toHexString: () => string }).toHexString === "function" &&
          "toHexString" in value &&
          typeof (value as { toHexString?: () => string }).toHexString === "function"
        ) {
          return (
            (doc[key] as { toHexString: () => string }).toHexString() ===
            (value as { toHexString: () => string }).toHexString()
          )
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
          },
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

jest.mock("@/lib/langgraph/workflow", () => ({
  runOpportunityWorkflow: jest.fn(),
}))

const { resetCollections } = jest.requireMock("@/lib/dbHelpers") as { resetCollections: () => void }
const { runOpportunityWorkflow } = jest.requireMock("@/lib/langgraph/workflow") as {
  runOpportunityWorkflow: jest.MockedFunction<
    (input: {
      stepTitle: string
      stepBucket?: string
      intentionTitle?: string
      existingOpportunityTitles?: string[]
    }) => Promise<{
      opportunities: Array<{
        title: string
        summary: string
        source?: OpportunitySource
        form?: OpportunityForm
        focus?: OpportunityFocus
        status?: OpportunityStatus
      }>
    }>
  >
}
const { debug } = jest.requireMock("@/lib/debug") as {
  debug: { debug: jest.Mock; info: jest.Mock; error: jest.Mock; warn: jest.Mock; trace: jest.Mock }
}

async function seedCanvasStep(
  user: string,
  stepId: string,
  options?: {
    intentionTitle?: string
    stepTitle?: string
    bucket?: "do_now" | "do_later" | "before_graduation" | "after_graduation"
  }
) {
  const { saveStudentIntentions } = await import("@/lib/studentCanvas/repository")
  await saveStudentIntentions(user, [
    {
      id: "22222222-2222-4222-8222-222222222222",
      title: options?.intentionTitle ?? "Launch creative career",
      bucket: "do_now",
      progress_status: "in_progress",
      created_at: "2024-01-01T00:00:00.000Z",
      updated_at: "2024-01-01T00:00:00.000Z",
      steps: [
        {
          id: stepId,
          title: options?.stepTitle ?? "Prepare portfolio",
          bucket: options?.bucket ?? "do_now",
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

describe("generateOpportunitiesForStep", () => {
  beforeEach(() => {
    resetCollections()
    runOpportunityWorkflow.mockReset()
    debug.debug.mockReset()
    debug.info.mockReset()
    debug.error.mockReset()
    debug.warn.mockReset()
    debug.trace.mockReset()
  })

  it("generates and replaces opportunities for a step", async () => {
    const canonicalStepId = "11111111-1111-4111-8111-111111111111"
    await seedCanvasStep("owner@example.com", canonicalStepId, {
      intentionTitle: "Launch creative career",
      stepTitle: "Prepare portfolio",
      bucket: "do_now",
    })

    const { createOpportunitiesForStep, getOpportunitiesByStep } = await import("@/lib/userData")

    await createOpportunitiesForStep("owner@example.com", canonicalStepId, [
      {
        title: "Old opportunity",
        summary: "Legacy summary",
        source: "kings-edge-simulated",
        form: "workshop",
        focus: "experience",
        status: "suggested",
      },
    ])

    runOpportunityWorkflow.mockResolvedValue({
      opportunities: [
        {
          title: "Attend industry breakfast",
          summary: "Meet alumni working in creative agencies.",
          source: "kings-edge-simulated",
          form: "workshop",
          focus: "community",
        },
        {
          title: "Shadow a portfolio review",
          summary: "Observe how mentors critique a professional portfolio.",
          source: "kings-edge-simulated",
          form: "mentoring",
          focus: "skills",
        },
        {
          title: "Join creative showcase",
          summary: "Apply to present work at the student showcase in March.",
          source: "independent",
          form: "independent-action",
          focus: "experience",
        },
      ],
    })

    const { generateOpportunitiesForStep } = await import("@/lib/opportunities/generation")

    const created = await generateOpportunitiesForStep({
      stepId: canonicalStepId,
      origin: "shuffle",
      studentId: "owner@example.com",
    })

    expect(created).toHaveLength(3)
    expect(created.every((item) => item.stepId === canonicalStepId)).toBe(true)
    expect(runOpportunityWorkflow).toHaveBeenCalledWith({
      stepTitle: "Prepare portfolio",
      stepBucket: "do-now",
      intentionTitle: "Launch creative career",
      existingOpportunityTitles: [],
      persona: undefined,
    })

    const remaining = await getOpportunitiesByStep("owner@example.com", canonicalStepId)
    expect(remaining).toHaveLength(3)
    expect(remaining.map((item) => item.title)).toEqual([
      "Attend industry breakfast",
      "Shadow a portfolio review",
      "Join creative showcase",
    ])
  })

  it("throws StepNotFoundError when the step does not exist", async () => {
    const { generateOpportunitiesForStep, StepNotFoundError } =
      await import("@/lib/opportunities/generation")

    await expect(
      generateOpportunitiesForStep({
        stepId: "nonexistent",
        origin: "manual",
        studentId: "owner@example.com",
      })
    ).rejects.toBeInstanceOf(StepNotFoundError)

    expect(debug.warn).toHaveBeenCalledWith(
      "Opportunities: step not found in generateOpportunitiesForStep",
      expect.objectContaining({ stepId: "nonexistent", origin: "manual" })
    )
  })

  it("propagates AI failures and logs an error", async () => {
    const canonicalStepId = "33333333-3333-4333-8333-333333333333"
    await seedCanvasStep("owner@example.com", canonicalStepId, {
      stepTitle: "Draft presentation",
      bucket: "do_later",
    })

    runOpportunityWorkflow.mockRejectedValue(new Error("AI offline"))

    const { generateOpportunitiesForStep } = await import("@/lib/opportunities/generation")

    await expect(
      generateOpportunitiesForStep({
        stepId: canonicalStepId,
        origin: "ai-accepted",
        studentId: "owner@example.com",
      })
    ).rejects.toThrow("AI offline")
  })

  it("skips regeneration when manual steps already have opportunities", async () => {
    const canonicalStepId = "44444444-4444-4444-8444-444444444444"
    await seedCanvasStep("owner@example.com", canonicalStepId, {
      stepTitle: "Draft presentation",
      bucket: "do_later",
    })

    const { createOpportunitiesForStep, getOpportunitiesByStep } = await import("@/lib/userData")

    await createOpportunitiesForStep("owner@example.com", canonicalStepId, [
      {
        title: "Keep existing",
        summary: "Old record should stay if skip happens.",
        source: "kings-edge-simulated",
        form: "workshop",
        focus: "skills",
        status: "suggested",
      },
    ])

    runOpportunityWorkflow.mockResolvedValue({
      opportunities: [
        {
          title: "New item",
          summary: "Should not be created.",
          source: "kings-edge-simulated",
          form: "short-course",
          focus: "reflection",
          status: "suggested",
        },
      ],
    })

    const { generateOpportunitiesForStep } = await import("@/lib/opportunities/generation")

    const created = await generateOpportunitiesForStep({
      stepId: canonicalStepId,
      origin: "manual",
      studentId: "owner@example.com",
    })

    expect(created).toEqual([])
    expect(runOpportunityWorkflow).not.toHaveBeenCalled()
    expect(debug.debug).toHaveBeenCalledWith(
      "Opportunities: already has opportunities; skipping auto generation",
      expect.objectContaining({ stepId: canonicalStepId, origin: "manual" })
    )

    const existing = await getOpportunitiesByStep("owner@example.com", canonicalStepId)
    expect(existing).toHaveLength(1)
    expect(existing[0].title).toBe("Keep existing")
  })

  it("logs failures inside safelyGenerateOpportunitiesForStep", async () => {
    const canonicalStepId = "55555555-5555-4555-8555-555555555555"
    await seedCanvasStep("owner@example.com", canonicalStepId, {
      stepTitle: "Draft presentation",
      bucket: "do_later",
    })

    runOpportunityWorkflow.mockRejectedValue(new Error("AI offline"))

    const { safelyGenerateOpportunitiesForStep } = await import("@/lib/opportunities/generation")

    const result = await safelyGenerateOpportunitiesForStep({
      stepId: canonicalStepId,
      origin: "ai-accepted",
      studentId: "owner@example.com",
    })

    expect(result).toBeUndefined()
    expect(debug.warn).toHaveBeenCalledWith(
      "Opportunities: safelyGenerateOpportunitiesForStep failed",
      expect.objectContaining({
        stepId: canonicalStepId,
        origin: "ai-accepted",
        errorName: "Error",
        errorMessage: "AI offline",
      })
    )
  })
})
