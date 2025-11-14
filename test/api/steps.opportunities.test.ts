import type { NextApiRequest, NextApiResponse } from "next"

jest.mock("@/lib/auth/config", () => ({
  authOptions: {},
  createTestSession: jest.fn(),
  isProd: true
}))

jest.mock("next-auth", () => ({
  getServerSession: jest.fn()
}))

jest.mock("@/lib/userData", () => ({
  getOpportunitiesByStep: jest.fn(),
  getStepById: jest.fn()
}))

const { getServerSession } = jest.requireMock("next-auth") as { getServerSession: jest.Mock }
const { getOpportunitiesByStep, getStepById } = jest.requireMock("@/lib/userData") as {
  getOpportunitiesByStep: jest.Mock,
  getStepById: jest.Mock
}

const makeObjectId = (() => {
  let counter = 0
  return () => {
    counter += 1
    const value = (Date.now() + counter).toString(16).padStart(24, "0").slice(-24)
    return {
      toHexString: () => value,
      toString: () => value
    }
  }
})()

function createMockRequestResponse(query: Record<string, unknown>, method = "GET") {
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

describe("GET /api/steps/[stepId]/opportunities", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getServerSession.mockReset()
    getOpportunitiesByStep.mockReset()
    getStepById.mockReset()
  })

  it("returns 401 when unauthenticated", async () => {
    getServerSession.mockResolvedValue(null)

    const { req, res, getStatus, getJSON } = createMockRequestResponse({ stepId: "step-1" })
    const handler = (await import("@/pages/api/steps/[stepId]/opportunities")).default

    await handler(req, res)

    expect(getServerSession).toHaveBeenCalled()
    expect(getStatus()).toBe(401)
    expect(getJSON<{ ok: boolean; error: string }>()).toEqual({ ok: false, error: "Not authenticated" })
  })

  it("returns 404 when the step does not exist", async () => {
    getServerSession.mockResolvedValue({ user: { email: "owner@example.com" } })
    getStepById.mockResolvedValue(null)

    const { req, res, getStatus, getJSON } = createMockRequestResponse({ stepId: "step-1" })
    const handler = (await import("@/pages/api/steps/[stepId]/opportunities")).default

    await handler(req, res)

    expect(getStepById).toHaveBeenCalledWith("step-1")
    expect(getStatus()).toBe(404)
    expect(getJSON<{ ok: boolean; error: string }>()).toEqual({ ok: false, error: "Step not found" })
  })

  it("returns 403 when the step belongs to a different user", async () => {
    getServerSession.mockResolvedValue({ user: { email: "owner@example.com" } })
    getStepById.mockResolvedValue({ _id: "step-1", user: "another@example.com" })

    const { req, res, getStatus, getJSON } = createMockRequestResponse({ stepId: "step-1" })
    const handler = (await import("@/pages/api/steps/[stepId]/opportunities")).default

    await handler(req, res)

    expect(getStatus()).toBe(403)
    expect(getJSON<{ ok: boolean; error: string }>()).toEqual({ ok: false, error: "Forbidden" })
  })

  it("returns an empty array when no opportunities are stored", async () => {
    const objectId = makeObjectId()
    getServerSession.mockResolvedValue({ user: { email: "owner@example.com" } })
    getStepById.mockResolvedValue({ _id: objectId, user: "owner@example.com" })
    getOpportunitiesByStep.mockResolvedValue([])

    const { req, res, getStatus, getJSON } = createMockRequestResponse({ stepId: objectId.toHexString() })
    const handler = (await import("@/pages/api/steps/[stepId]/opportunities")).default

    await handler(req, res)

    expect(getOpportunitiesByStep).toHaveBeenCalledWith("owner@example.com", objectId.toHexString())
    expect(getStatus()).toBe(200)
    expect(getJSON<{ ok: boolean; opportunities: unknown[]; stepId: string }>()).toEqual({
      ok: true,
      stepId: objectId.toHexString(),
      opportunities: []
    })
  })

  it("returns stored opportunities for the step", async () => {
    const objectId = makeObjectId()
    getServerSession.mockResolvedValue({ user: { email: "owner@example.com" } })
    getStepById.mockResolvedValue({ _id: objectId, user: "owner@example.com" })
    getOpportunitiesByStep.mockResolvedValue([
      {
        id: "opp-1",
        stepId: objectId.toHexString(),
        title: "Industry visit",
        summary: "Spend a day shadowing a product team.",
        source: "edge_simulated",
        form: "intensive",
        focus: "capability",
        status: "suggested"
      }
    ])

    const { req, res, getStatus, getJSON } = createMockRequestResponse({ stepId: objectId.toHexString() })
    const handler = (await import("@/pages/api/steps/[stepId]/opportunities")).default

    await handler(req, res)

    expect(getStatus()).toBe(200)
    const payload = getJSON<{ ok: boolean; opportunities: Array<{ id: string }>; stepId: string }>()
    expect(payload.ok).toBe(true)
    expect(payload.opportunities).toHaveLength(1)
    expect(payload.opportunities[0].id).toBe("opp-1")
  })

  it("returns 500 when fetching fails", async () => {
    const objectId = makeObjectId()
    getServerSession.mockResolvedValue({ user: { email: "owner@example.com" } })
    getStepById.mockResolvedValue({ _id: objectId, user: "owner@example.com" })
    getOpportunitiesByStep.mockRejectedValue(new Error("database offline"))

    const { req, res, getStatus, getJSON } = createMockRequestResponse({ stepId: objectId.toHexString() })
    const handler = (await import("@/pages/api/steps/[stepId]/opportunities")).default

    await handler(req, res)

    expect(getStatus()).toBe(500)
    expect(getJSON<{ ok: boolean; error: string }>()).toEqual({ ok: false, error: "Server error" })
  })

  it("rejects unsupported methods", async () => {
    getServerSession.mockResolvedValue({ user: { email: "owner@example.com" } })

    const { req, res, getStatus, getJSON } = createMockRequestResponse({ stepId: "step-1" }, "POST")
    const handler = (await import("@/pages/api/steps/[stepId]/opportunities")).default

    await handler(req, res)

    expect(getStatus()).toBe(405)
    expect(getJSON<{ ok: boolean; error: string }>()).toEqual({ ok: false, error: "Method not allowed" })
  })
})
