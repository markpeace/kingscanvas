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
  createSuggestedSteps: jest.fn(),
  getUserSteps: jest.fn(),
  saveUserStep: jest.fn(),
  updateStepStatus: jest.fn()
}))

jest.mock("@/lib/opportunities/generation", () => ({
  stepHasOpportunities: jest.fn(),
  safelyGenerateOpportunitiesForStep: jest.fn()
}))

const { getServerSession } = jest.requireMock("next-auth") as { getServerSession: jest.Mock }
const { saveUserStep, updateStepStatus } = jest.requireMock("@/lib/userData") as {
  saveUserStep: jest.Mock
  updateStepStatus: jest.Mock
}
const { stepHasOpportunities, safelyGenerateOpportunitiesForStep } = jest.requireMock(
  "@/lib/opportunities/generation"
) as {
  stepHasOpportunities: jest.Mock
  safelyGenerateOpportunitiesForStep: jest.Mock
}

function createMockRequestResponse(method: string, body: Record<string, unknown>) {
  let statusCode = 0
  let jsonBody: unknown = null

  const req = {
    method,
    body,
    query: {},
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

describe("/api/steps", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getServerSession.mockResolvedValue({ user: { email: "owner@example.com" } })
  })

  it("generates opportunities automatically after manual step creation", async () => {
    saveUserStep.mockResolvedValue("507f1f77bcf86cd799439011")
    stepHasOpportunities.mockResolvedValue(false)
    safelyGenerateOpportunitiesForStep.mockResolvedValue(undefined)

    const { req, res, getStatus, getJSON } = createMockRequestResponse("POST", {
      _id: "507f1f77bcf86cd799439011",
      id: "507f1f77bcf86cd799439011",
      title: "Write reflection"
    })

    const handler = (await import("@/pages/api/steps/index")).default

    await handler(req, res)

    expect(saveUserStep).toHaveBeenCalledWith(
      "owner@example.com",
      expect.objectContaining({ _id: "507f1f77bcf86cd799439011" })
    )
    expect(stepHasOpportunities).toHaveBeenCalledWith("507f1f77bcf86cd799439011")
    expect(safelyGenerateOpportunitiesForStep).toHaveBeenCalledWith(
      "507f1f77bcf86cd799439011",
      "manual"
    )
    expect(getStatus()).toBe(200)
    expect(getJSON<{ ok: boolean; stepId: string }>().stepId).toBe("507f1f77bcf86cd799439011")
  })

  it("skips automatic generation when manual step already has opportunities", async () => {
    saveUserStep.mockResolvedValue("507f1f77bcf86cd799439011")
    stepHasOpportunities.mockResolvedValue(true)

    const { req, res } = createMockRequestResponse("POST", {
      _id: "507f1f77bcf86cd799439011",
      title: "Write reflection"
    })

    const handler = (await import("@/pages/api/steps/index")).default

    await handler(req, res)

    expect(stepHasOpportunities).toHaveBeenCalledWith("507f1f77bcf86cd799439011")
    expect(safelyGenerateOpportunitiesForStep).not.toHaveBeenCalled()
  })

  it("triggers generation when an AI suggestion is accepted", async () => {
    updateStepStatus.mockResolvedValue({ matchedCount: 1, modifiedCount: 1 })
    stepHasOpportunities.mockResolvedValue(false)

    const { req, res } = createMockRequestResponse("PUT", {
      stepId: "507f1f77bcf86cd799439011",
      status: "accepted"
    })

    const handler = (await import("@/pages/api/steps/index")).default

    await handler(req, res)

    expect(updateStepStatus).toHaveBeenCalledWith(
      "owner@example.com",
      "507f1f77bcf86cd799439011",
      "accepted"
    )
    expect(stepHasOpportunities).toHaveBeenCalledWith("507f1f77bcf86cd799439011")
    expect(safelyGenerateOpportunitiesForStep).toHaveBeenCalledWith(
      "507f1f77bcf86cd799439011",
      "ai-accepted"
    )
  })

  it("does not regenerate opportunities when acceptance already has them", async () => {
    updateStepStatus.mockResolvedValue({ matchedCount: 1, modifiedCount: 1 })
    stepHasOpportunities.mockResolvedValue(true)

    const { req, res } = createMockRequestResponse("PUT", {
      stepId: "507f1f77bcf86cd799439011",
      status: "accepted"
    })

    const handler = (await import("@/pages/api/steps/index")).default

    await handler(req, res)

    expect(safelyGenerateOpportunitiesForStep).not.toHaveBeenCalled()
  })

  it("does not trigger generation for non-accepted status updates", async () => {
    updateStepStatus.mockResolvedValue({ matchedCount: 1, modifiedCount: 1 })

    const { req, res } = createMockRequestResponse("PUT", {
      stepId: "507f1f77bcf86cd799439011",
      status: "in-progress"
    })

    const handler = (await import("@/pages/api/steps/index")).default

    await handler(req, res)

    expect(stepHasOpportunities).not.toHaveBeenCalled()
    expect(safelyGenerateOpportunitiesForStep).not.toHaveBeenCalled()
  })
})
