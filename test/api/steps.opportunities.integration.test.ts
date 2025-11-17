import type { NextApiRequest, NextApiResponse } from "next"

import type { Opportunity } from "@/types/canvas"

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

const { ObjectId } = jest.requireMock("mongodb") as {
  ObjectId: new (id?: string) => { toHexString: () => string }
}

jest.mock("next-auth", () => ({
  getServerSession: jest.fn()
}))

jest.mock("@/lib/auth/config", () => {
  const sessionState = { email: "student@example.com" }
  return {
    authOptions: {},
    isProd: false,
    sessionState,
    createTestSession: jest.fn(() => ({ user: { email: sessionState.email } }))
  }
})

jest.mock("@/lib/dbHelpers", () => {
  const stores: Record<string, Array<Record<string, any>>> = {}

  const matches = (doc: Record<string, any>, filter: Record<string, any>): boolean => {
    return Object.entries(filter).every(([key, value]) => {
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
  }

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
        docs.forEach((doc) => {
          stores[name].push({ ...doc })
        })
        const insertedIds: Record<number, any> = {}
        docs.forEach((doc, index) => {
          insertedIds[index] = doc._id ?? new ObjectId()
        })
        return { acknowledged: true, insertedCount: docs.length, insertedIds }
      },
      async deleteMany(filter: Record<string, any>) {
        const before = stores[name].length
        stores[name] = stores[name].filter((doc) => !matches(doc, filter))
        return { acknowledged: true, deletedCount: before - stores[name].length }
      },
      async updateOne(filter: Record<string, any>, update: Record<string, any>) {
        const doc = stores[name].find((candidate) => matches(candidate, filter))
        if (!doc) {
          return { acknowledged: true, matchedCount: 0, modifiedCount: 0 }
        }
        if (update?.$set && typeof update.$set === "object") {
          Object.assign(doc, update.$set)
        }
        return { acknowledged: true, matchedCount: 1, modifiedCount: 1 }
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
    ensureOpportunityIndexes: jest.fn(),
    ensureStepIndexes: jest.fn(),
    resetCollections
  }
})

jest.mock("@/lib/debug", () => {
  const mockLogger = {
    trace: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
  return { debug: mockLogger, default: mockLogger }
})

const { resetCollections, getCollection } = jest.requireMock("@/lib/dbHelpers") as {
  resetCollections: () => void
  getCollection: jest.Mock
}
const { sessionState } = jest.requireMock("@/lib/auth/config") as {
  sessionState: { email: string }
}

type MockFactoryResult = {
  req: NextApiRequest
  res: NextApiResponse
  getStatus: () => number
  getJSON: <T>() => T
}

function createMockRequestResponse(
  query: Record<string, unknown>,
  method: "GET" | "POST" = "GET"
): MockFactoryResult {
  let statusCode = 200
  let jsonBody: unknown = null

  const req = {
    method,
    query,
    body: {},
    headers: {}
  } as unknown as NextApiRequest

  const res = {
    status(code: number) {
      statusCode = code
      return this
    },
    json(data: unknown) {
      jsonBody = data
      return this
    }
  } as unknown as NextApiResponse

  return {
    req,
    res,
    getStatus: () => statusCode,
    getJSON: <T>() => jsonBody as T
  }
}

async function seedStep({
  user = "student@example.com",
  status = "active",
  source = "manual"
}: {
  user?: string
  status?: string
  source?: string
}) {
  const stepsCol = await getCollection("steps")
  const objectId = new ObjectId()
  const canonicalId = objectId.toHexString()
  const now = new Date()

  await stepsCol.insertMany([
    {
      _id: objectId,
      id: canonicalId,
      user,
      intentionId: "int-123",
      title: "Get experience in a school",
      text: "Get experience in a school",
      bucket: "do-now",
      status,
      source,
      createdAt: now,
      updatedAt: now
    }
  ])

  return canonicalId
}

describe("opportunities API integration", () => {
  beforeEach(() => {
    resetCollections()
    sessionState.email = "student@example.com"
  })

  it("returns simulated opportunities for an eligible step and caches results", async () => {
    const stepId = await seedStep({ status: "active", source: "manual" })
    const handler = (await import("@/pages/api/steps/[stepId]/opportunities")).default

    const firstRequest = createMockRequestResponse({ stepId })
    await handler(firstRequest.req, firstRequest.res)

    expect(firstRequest.getStatus()).toBe(200)
    const firstPayload = firstRequest.getJSON<{ ok: boolean; opportunities: Opportunity[] }>()

    expect(firstPayload.ok).toBe(true)
    expect(firstPayload.opportunities).toHaveLength(4)

    const sources = firstPayload.opportunities.map((item) => item.source)
    expect(sources.filter((source) => source === "kings-edge-simulated")).toHaveLength(3)
    expect(sources.filter((source) => source === "independent")).toHaveLength(1)

    const secondRequest = createMockRequestResponse({ stepId })
    await handler(secondRequest.req, secondRequest.res)
    const secondPayload = secondRequest.getJSON<{ ok: boolean; opportunities: Opportunity[] }>()

    expect(secondRequest.getStatus()).toBe(200)
    expect(secondPayload.opportunities.map((opp) => opp.id)).toEqual(
      firstPayload.opportunities.map((opp) => opp.id)
    )
  })

  it("shuffles opportunities while preserving the source mix", async () => {
    const stepId = await seedStep({ status: "active", source: "manual" })
    const getHandler = (await import("@/pages/api/steps/[stepId]/opportunities")).default
    const shuffleHandler = (await import("@/pages/api/steps/[stepId]/opportunities/shuffle")).default

    const initialFetch = createMockRequestResponse({ stepId })
    await getHandler(initialFetch.req, initialFetch.res)
    const initialPayload = initialFetch.getJSON<{ ok: boolean; opportunities: Opportunity[] }>()

    const shuffleRequest = createMockRequestResponse({ stepId }, "POST")
    await shuffleHandler(shuffleRequest.req, shuffleRequest.res)
    const shufflePayload = shuffleRequest.getJSON<{ ok: boolean; opportunities: Opportunity[] }>()

    expect(shuffleRequest.getStatus()).toBe(200)
    expect(shufflePayload.opportunities).toHaveLength(4)
    expect(shufflePayload.opportunities.filter((opp) => opp.source === "kings-edge-simulated")).toHaveLength(3)
    expect(shufflePayload.opportunities.filter((opp) => opp.source === "independent")).toHaveLength(1)

    const refreshedFetch = createMockRequestResponse({ stepId })
    await getHandler(refreshedFetch.req, refreshedFetch.res)
    const refreshedPayload = refreshedFetch.getJSON<{ ok: boolean; opportunities: Opportunity[] }>()

    expect(refreshedPayload.opportunities).toHaveLength(4)
    expect(refreshedPayload.opportunities.map((opp) => opp.title)).toEqual(
      initialPayload.opportunities.map((opp) => opp.title)
    )
    expect(refreshedPayload.opportunities.map((opp) => opp.id)).not.toEqual(
      initialPayload.opportunities.map((opp) => opp.id)
    )
  })

  it("does not generate opportunities for ineligible suggested steps", async () => {
    const stepId = await seedStep({ status: "suggested", source: "ai" })
    const getHandler = (await import("@/pages/api/steps/[stepId]/opportunities")).default
    const shuffleHandler = (await import("@/pages/api/steps/[stepId]/opportunities/shuffle")).default

    const ghostRequest = createMockRequestResponse({ stepId })
    await getHandler(ghostRequest.req, ghostRequest.res)
    const ghostPayload = ghostRequest.getJSON<{ ok: boolean; opportunities: Opportunity[] }>()

    expect(ghostRequest.getStatus()).toBe(200)
    expect(ghostPayload.opportunities).toHaveLength(0)

    const shuffleRequest = createMockRequestResponse({ stepId }, "POST")
    await shuffleHandler(shuffleRequest.req, shuffleRequest.res)
    const shufflePayload = shuffleRequest.getJSON<{ ok: boolean; opportunities: Opportunity[] }>()

    expect(shuffleRequest.getStatus()).toBe(200)
    expect(shufflePayload.opportunities).toHaveLength(0)
  })
})
