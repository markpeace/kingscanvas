import type { NextApiRequest, NextApiResponse } from "next"

jest.mock("@/lib/auth/config", () => ({
  authOptions: {},
  createTestSession: () => ({
    user: { email: "test@test.com" },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }),
  isProd: false,
}))

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}))

jest.mock("@/lib/opportunities/generation", () => ({
  generateSimulatedOpportunitiesForStep: jest.fn(),
  OpportunityGenerationError: class OpportunityGenerationError extends Error {
    statusCode: number
    constructor(message: string, statusCode = 500) {
      super(message)
      this.statusCode = statusCode
    }
  },
}))

import handler from "@/pages/api/steps/[stepId]/generate-opportunities"
import { generateSimulatedOpportunitiesForStep } from "@/lib/opportunities/generation"

const mockGenerate = generateSimulatedOpportunitiesForStep as jest.MockedFunction<
  typeof generateSimulatedOpportunitiesForStep
>

type JsonValue = unknown

type MockResult = {
  req: NextApiRequest
  res: NextApiResponse
  getStatus: () => number
  getJSON: () => JsonValue
}

function createMockRequestResponse(method: string): MockResult {
  let statusCode = 200
  let jsonBody: JsonValue = null

  const req = {
    method,
    query: { stepId: "step-1" },
  } as unknown as NextApiRequest

  const res = {
    status(code: number) {
      statusCode = code
      return this
    },
    json(data: JsonValue) {
      jsonBody = data
      return this
    },
  } as unknown as NextApiResponse

  return {
    req,
    res,
    getStatus: () => statusCode,
    getJSON: () => jsonBody,
  }
}

describe("/api/steps/[stepId]/generate-opportunities", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("returns generated opportunities", async () => {
    mockGenerate.mockResolvedValue([
      {
        id: "opp-1",
        stepId: "step-1",
        title: "Simulated workshop",
        summary: "Simulated example: Attend a workshop.",
        source: "edge_simulated",
        form: "short_form",
        focus: ["capability"],
        status: "suggested",
      } as any,
    ])

    const { req, res, getStatus, getJSON } = createMockRequestResponse("POST")

    await handler(req, res)

    expect(mockGenerate).toHaveBeenCalledWith("test@test.com", "step-1", {
      origin: "api-manual-trigger",
    })
    expect(getStatus()).toBe(200)
    expect(getJSON()).toEqual({
      opportunities: [
        expect.objectContaining({ id: "opp-1" }),
      ],
    })
  })

  it("surfaces generation errors with status code", async () => {
    const error = new (jest.requireMock("@/lib/opportunities/generation").OpportunityGenerationError)(
      "Failed",
      503,
    )
    mockGenerate.mockRejectedValue(error)

    const { req, res, getStatus, getJSON } = createMockRequestResponse("POST")

    await handler(req, res)

    expect(getStatus()).toBe(503)
    expect(getJSON()).toEqual({ error: "Failed" })
  })
})
