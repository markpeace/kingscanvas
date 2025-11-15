import type { NextApiRequest, NextApiResponse } from "next"

type JsonValue = unknown

type MockedResponse = {
  req: NextApiRequest
  res: NextApiResponse
  getStatus: () => number
  getJSON: <T>() => T
}

function createMockRequestResponse(method: string, body: Record<string, unknown> = {}): MockedResponse {
  let statusCode = 200
  let jsonBody: JsonValue = null

  const req = {
    method,
    body,
    headers: {},
    query: {}
  } as unknown as NextApiRequest

  const res = {
    status(code: number) {
      statusCode = code
      return this
    },
    json(data: JsonValue) {
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

jest.mock("@/lib/auth/config", () => ({
  authOptions: {},
  createTestSession: jest.fn(() => ({ user: { email: "fallback@example.com" } })),
  isProd: true
}))

jest.mock("next-auth", () => ({
  getServerSession: jest.fn()
}))

jest.mock("@/lib/userData", () => ({
  createSuggestedSteps: jest.fn(),
  getUserSteps: jest.fn(),
  saveUserStep: jest.fn(),
  updateStepStatus: jest.fn()
}))

jest.mock("@/lib/opportunities/generation", () => ({
  stepHasOpportunities: jest.fn(),
  safelyGenerateOpportunitiesForStep: jest.fn()
}))

jest.mock("@/lib/debug", () => ({
  debug: {
    trace: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}))

const { getServerSession } = jest.requireMock("next-auth") as { getServerSession: jest.Mock }
const { saveUserStep, updateStepStatus } = jest.requireMock("@/lib/userData") as {
  saveUserStep: jest.Mock
  updateStepStatus: jest.Mock
}
const { stepHasOpportunities, safelyGenerateOpportunitiesForStep } = jest.requireMock("@/lib/opportunities/generation") as {
  stepHasOpportunities: jest.Mock
  safelyGenerateOpportunitiesForStep: jest.Mock
}
const { debug } = jest.requireMock("@/lib/debug") as {
  debug: { error: jest.Mock; info: jest.Mock; trace: jest.Mock; warn: jest.Mock }
}

let handler: typeof import("@/pages/api/steps").default

beforeAll(async () => {
  handler = (await import("@/pages/api/steps")).default
})

beforeEach(() => {
  jest.clearAllMocks()
  getServerSession.mockResolvedValue({ user: { email: "owner@example.com" } })
  updateStepStatus.mockResolvedValue({ matchedCount: 1 })
})

describe("Steps API auto opportunity generation", () => {
  it("triggers generation for a new manual step", async () => {
    saveUserStep.mockResolvedValue({ stepId: "step-123" })
    stepHasOpportunities.mockResolvedValue(false)
    safelyGenerateOpportunitiesForStep.mockResolvedValue(undefined)

    const { req, res, getStatus, getJSON } = createMockRequestResponse("POST", {
      _id: "step-123",
      title: "Research companies"
    })

    await handler(req, res)

    expect(saveUserStep).toHaveBeenCalledWith("owner@example.com", req.body)
    expect(stepHasOpportunities).toHaveBeenCalledWith("step-123")
    expect(safelyGenerateOpportunitiesForStep).toHaveBeenCalledWith("step-123", "manual")
    expect(getStatus()).toBe(200)
    expect(getJSON<{ ok: boolean }>()).toEqual({ ok: true })
  })

  it("skips generation when a manual step already has opportunities", async () => {
    saveUserStep.mockResolvedValue({ stepId: "step-456" })
    stepHasOpportunities.mockResolvedValue(true)

    const { req, res, getStatus } = createMockRequestResponse("POST", {
      _id: "step-456",
      title: "Attend careers fair"
    })

    await handler(req, res)

    expect(stepHasOpportunities).toHaveBeenCalledWith("step-456")
    expect(safelyGenerateOpportunitiesForStep).not.toHaveBeenCalled()
    expect(getStatus()).toBe(200)
  })

  it("triggers generation when accepting an AI suggestion", async () => {
    stepHasOpportunities.mockResolvedValue(false)
    safelyGenerateOpportunitiesForStep.mockResolvedValue(undefined)

    const { req, res, getStatus, getJSON } = createMockRequestResponse("PUT", {
      stepId: "step-ai",
      status: "accepted"
    })

    await handler(req, res)

    expect(updateStepStatus).toHaveBeenCalledWith("owner@example.com", "step-ai", "accepted")
    expect(stepHasOpportunities).toHaveBeenCalledWith("step-ai")
    expect(safelyGenerateOpportunitiesForStep).toHaveBeenCalledWith("step-ai", "ai-accepted")
    expect(getStatus()).toBe(200)
    expect(getJSON<{ ok: boolean }>()).toEqual({ ok: true })
  })

  it("skips generation when the accepted step already has opportunities", async () => {
    stepHasOpportunities.mockResolvedValue(true)

    const { req, res, getStatus } = createMockRequestResponse("PUT", {
      stepId: "step-existing",
      status: "accepted"
    })

    await handler(req, res)

    expect(safelyGenerateOpportunitiesForStep).not.toHaveBeenCalled()
    expect(getStatus()).toBe(200)
  })

  it("logs and continues when generation fails", async () => {
    saveUserStep.mockResolvedValue({ stepId: "step-fail" })
    stepHasOpportunities.mockResolvedValue(false)
    safelyGenerateOpportunitiesForStep.mockRejectedValue(new Error("AI offline"))

    const { req, res, getStatus, getJSON } = createMockRequestResponse("POST", {
      _id: "step-fail",
      title: "Draft application"
    })

    await handler(req, res)

    expect(getStatus()).toBe(200)
    expect(getJSON<{ ok: boolean }>()).toEqual({ ok: true })
    expect(debug.error).toHaveBeenCalledWith(
      "Opportunities: auto generation failed to complete",
      expect.objectContaining({
        stepId: "step-fail",
        origin: "manual",
        message: "AI offline"
      })
    )
  })
})
