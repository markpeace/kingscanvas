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
  getStepForUser: jest.fn()
}))

jest.mock("@/lib/opportunities/generation", () => ({
  generateOpportunitiesForStep: jest.fn()
}))

const { getServerSession } = jest.requireMock("next-auth") as { getServerSession: jest.Mock }
const { getStepForUser } = jest.requireMock("@/lib/userData") as { getStepForUser: jest.Mock }
const { generateOpportunitiesForStep } = jest.requireMock("@/lib/opportunities/generation") as {
  generateOpportunitiesForStep: jest.Mock
}

function createMockRequestResponse(method: string, query: Record<string, unknown>) {
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

describe("POST /api/steps/[stepId]/shuffle-opportunities", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("returns 401 when unauthenticated", async () => {
    getServerSession.mockResolvedValue(null)

    const { req, res, getStatus, getJSON } = createMockRequestResponse("POST", { stepId: "step-1" })
    const handler = (await import("@/pages/api/steps/[stepId]/shuffle-opportunities")).default

    await handler(req, res)

    expect(getStatus()).toBe(401)
    expect(getJSON<{ ok: boolean; error: string }>()).toEqual({ ok: false, error: "Not authenticated" })
  })

  it("returns 405 for unsupported methods", async () => {
    getServerSession.mockResolvedValue({ user: { email: "owner@example.com" } })

    const { req, res, getStatus, getJSON } = createMockRequestResponse("GET", { stepId: "step-1" })
    const handler = (await import("@/pages/api/steps/[stepId]/shuffle-opportunities")).default

    await handler(req, res)

    expect(getStatus()).toBe(405)
    expect(getJSON<{ ok: boolean; error: string }>()).toEqual({ ok: false, error: "Method not allowed" })
  })

  it("returns 403 when the step is not owned by the user", async () => {
    getServerSession.mockResolvedValue({ user: { email: "owner@example.com" } })
    getStepForUser.mockResolvedValue(null)

    const { req, res, getStatus, getJSON } = createMockRequestResponse("POST", { stepId: "step-1" })
    const handler = (await import("@/pages/api/steps/[stepId]/shuffle-opportunities")).default

    await handler(req, res)

    expect(getStepForUser).toHaveBeenCalledWith("owner@example.com", "step-1")
    expect(getStatus()).toBe(403)
    expect(getJSON<{ ok: boolean; error: string }>()).toEqual({ ok: false, error: "Forbidden" })
  })

  it("returns regenerated opportunities when the shuffle succeeds", async () => {
    const mockObjectId = {
      toHexString: () => "507f1f77bcf86cd799439011"
    }

    getServerSession.mockResolvedValue({ user: { email: "owner@example.com" } })
    getStepForUser.mockResolvedValue({ _id: mockObjectId })
    generateOpportunitiesForStep.mockResolvedValue([
      {
        id: "opp-1",
        stepId: mockObjectId.toHexString(),
        title: "Shadow day",
        summary: "Spend a day shadowing a product manager.",
        source: "edge_simulated",
        form: "intensive",
        focus: "capability",
        status: "suggested"
      }
    ])

    const { req, res, getStatus, getJSON } = createMockRequestResponse("POST", { stepId: mockObjectId.toHexString() })
    const handler = (await import("@/pages/api/steps/[stepId]/shuffle-opportunities")).default

    await handler(req, res)

    expect(generateOpportunitiesForStep).toHaveBeenCalledWith({
      stepId: mockObjectId.toHexString(),
      origin: "shuffle"
    })
    expect(getStatus()).toBe(200)
    const payload = getJSON<{ ok: boolean; opportunities: Array<{ id: string }>; stepId: string }>()
    expect(payload.ok).toBe(true)
    expect(payload.stepId).toBe(mockObjectId.toHexString())
    expect(payload.opportunities).toHaveLength(1)
    expect(payload.opportunities[0].id).toBe("opp-1")
  })

  it("returns 500 when generation fails", async () => {
    getServerSession.mockResolvedValue({ user: { email: "owner@example.com" } })
    getStepForUser.mockResolvedValue({ _id: { toHexString: () => "507f1f77bcf86cd799439011" } })
    generateOpportunitiesForStep.mockRejectedValue(new Error("workflow timeout"))

    const { req, res, getStatus, getJSON } = createMockRequestResponse("POST", { stepId: "507f1f77bcf86cd799439011" })
    const handler = (await import("@/pages/api/steps/[stepId]/shuffle-opportunities")).default

    await handler(req, res)

    expect(getStatus()).toBe(500)
    expect(getJSON<{ ok: boolean; error: string }>()).toEqual({
      ok: false,
      error: "Could not generate opportunities"
    })
  })
})
