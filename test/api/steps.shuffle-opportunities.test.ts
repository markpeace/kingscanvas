import type { NextApiRequest, NextApiResponse } from "next"

import handler from "@/pages/api/steps/[stepId]/opportunities/shuffle"
import { getServerSession } from "next-auth"

jest.mock("next-auth", () => ({
  getServerSession: jest.fn()
}))

jest.mock("@/lib/auth/config", () => ({
  authOptions: {},
  createTestSession: jest.fn(() => ({ user: { email: "fallback@example.com" } })),
  isProd: true
}))

jest.mock("@/lib/opportunities/generation", () => {
  const generateOpportunitiesForStep = jest.fn()
  const findStepById = jest.fn()
  class StepNotFoundError extends Error {}
  return { generateOpportunitiesForStep, findStepById, StepNotFoundError }
})

jest.mock("@/lib/debug", () => ({
  debug: {
    trace: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}))

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const { generateOpportunitiesForStep, findStepById } = jest.requireMock("@/lib/opportunities/generation") as {
  generateOpportunitiesForStep: jest.MockedFunction<(
    params: { stepId: string; origin: "shuffle" }
  ) => Promise<
    Array<{
      id: string
      stepId: string
      title: string
      summary: string
      source: string
      form: string
      focus: string | string[]
      status: string
    }>
  >>
  findStepById: jest.MockedFunction<(stepId: string) => Promise<Record<string, any> | null>>
}
const { debug } = jest.requireMock("@/lib/debug") as {
  debug: { warn: jest.Mock; error: jest.Mock; info: jest.Mock }
}

type JsonValue = unknown

type MockResult = {
  req: NextApiRequest
  res: NextApiResponse
  getStatus: () => number
  getJSON: () => JsonValue
}

function createMockRequestResponse(method: string, stepId: string, body?: Record<string, unknown>): MockResult {
  let statusCode = 200
  let jsonBody: JsonValue = null

  const req = {
    method,
    body: body ?? {},
    headers: {},
    query: { stepId }
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
    getJSON: () => jsonBody
  }
}

describe("POST /api/steps/[stepId]/shuffle-opportunities", () => {
  beforeEach(() => {
    mockGetServerSession.mockReset()
    generateOpportunitiesForStep.mockReset()
    findStepById.mockReset()
    debug.warn.mockReset()
    debug.error.mockReset()
    debug.info.mockReset()
  })

  it("returns generated opportunities for the owner", async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: "owner@example.com" } } as any)
    findStepById.mockResolvedValue({ _id: "step-123", user: "owner@example.com", status: "active" })
    generateOpportunitiesForStep.mockResolvedValue([
      {
        id: "opp-1",
        stepId: "step-123",
        title: "First",
        summary: "One",
        source: "kings-edge-simulated",
        form: "short-course",
        focus: "reflection",
        status: "suggested"
      },
      {
        id: "opp-2",
        stepId: "step-123",
        title: "Second",
        summary: "Two",
        source: "kings-edge-simulated",
        form: "workshop",
        focus: "skills",
        status: "suggested"
      },
      {
        id: "opp-3",
        stepId: "step-123",
        title: "Third",
        summary: "Three",
        source: "kings-edge-simulated",
        form: "project",
        focus: "experience",
        status: "suggested"
      },
      {
        id: "opp-4",
        stepId: "step-123",
        title: "Fourth",
        summary: "Four",
        source: "independent",
        form: "independent-action",
        focus: "planning",
        status: "saved"
      }
    ])

    const { req, res, getStatus, getJSON } = createMockRequestResponse("POST", "step-123")

    await handler(req, res)

    expect(findStepById).toHaveBeenCalledWith("step-123")
    expect(generateOpportunitiesForStep).toHaveBeenCalledWith({ stepId: "step-123", origin: "shuffle" })
    expect(getStatus()).toBe(200)
    const json = getJSON() as { ok: boolean; opportunities: Array<{ id: string }> }
    expect(json.ok).toBe(true)
    expect(json.opportunities).toHaveLength(4)
    const edgeCount = json.opportunities.filter((item) => item.source === "kings-edge-simulated").length
    expect(edgeCount).toBe(3)
    const independentCount = json.opportunities.filter((item) => item.source === "independent").length
    expect(independentCount).toBe(1)
  })

  it("returns 401 when unauthenticated", async () => {
    mockGetServerSession.mockResolvedValue(null)

    const { req, res, getStatus, getJSON } = createMockRequestResponse("POST", "step-123")

    await handler(req, res)

    expect(getStatus()).toBe(401)
    const json = getJSON() as { ok: boolean; error: string }
    expect(json.ok).toBe(false)
    expect(json.error).toBe("Not authenticated")
    expect(findStepById).not.toHaveBeenCalled()
  })

  it("returns 403 when the user does not own the step", async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: "owner@example.com" } } as any)
    findStepById.mockResolvedValue({ _id: "step-123", user: "different@example.com", status: "active" })

    const { req, res, getStatus, getJSON } = createMockRequestResponse("POST", "step-123")

    await handler(req, res)

    expect(getStatus()).toBe(403)
    const json = getJSON() as { ok: boolean; error: string }
    expect(json.ok).toBe(false)
    expect(json.error).toBe("Forbidden")
    expect(generateOpportunitiesForStep).not.toHaveBeenCalled()
  })

  it("returns 404 when the step is missing", async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: "owner@example.com" } } as any)
    findStepById.mockResolvedValue(null)

    const { req, res, getStatus, getJSON } = createMockRequestResponse("POST", "step-404")

    await handler(req, res)

    expect(getStatus()).toBe(404)
    const json = getJSON() as { ok: boolean; error: string }
    expect(json.ok).toBe(false)
    expect(json.error).toBe("Step not found")
    expect(generateOpportunitiesForStep).not.toHaveBeenCalled()
  })

  it("returns 500 when generation fails", async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: "owner@example.com" } } as any)
    findStepById.mockResolvedValue({ _id: "step-123", user: "owner@example.com", status: "active" })
    generateOpportunitiesForStep.mockRejectedValue(new Error("boom"))

    const { req, res, getStatus, getJSON } = createMockRequestResponse("POST", "step-123")

    await handler(req, res)

    expect(getStatus()).toBe(500)
    const json = getJSON() as { ok: boolean; error: string }
    expect(json.ok).toBe(false)
    expect(json.error).toBe("Could not generate opportunities for this step")
  })

  it("returns 400 when the step status is not eligible", async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: "owner@example.com" } } as any)
    findStepById.mockResolvedValue({ _id: "step-123", user: "owner@example.com", status: "suggested" })

    const { req, res, getStatus, getJSON } = createMockRequestResponse("POST", "step-123")

    await handler(req, res)

    expect(getStatus()).toBe(400)
    const json = getJSON() as { ok: boolean; error: string }
    expect(json.ok).toBe(false)
    expect(json.error).toBe("Step is not eligible for opportunities")
    expect(generateOpportunitiesForStep).not.toHaveBeenCalled()
  })
})
