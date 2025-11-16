import type { NextApiRequest, NextApiResponse } from "next"

import type { Opportunity } from "@/types/canvas"

jest.mock("@/lib/auth/config", () => ({
  authOptions: {},
  createTestSession: jest.fn(),
  isProd: true
}))

jest.mock("next-auth", () => ({
  getServerSession: jest.fn()
}))

jest.mock("@/lib/opportunities/generation", () => ({
  findStepById: jest.fn(),
  generateOpportunitiesForStep: jest.fn()
}))

jest.mock("@/lib/userData", () => ({
  getOpportunitiesByStep: jest.fn()
}))

const { getServerSession } = jest.requireMock("next-auth") as { getServerSession: jest.Mock }
const { findStepById, generateOpportunitiesForStep } = jest.requireMock("@/lib/opportunities/generation") as {
  findStepById: jest.Mock
  generateOpportunitiesForStep: jest.Mock
}
const { getOpportunitiesByStep } = jest.requireMock("@/lib/userData") as {
  getOpportunitiesByStep: jest.Mock
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
    findStepById.mockReset()
    generateOpportunitiesForStep.mockReset()
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
    findStepById.mockResolvedValue(null)

    const { req, res, getStatus, getJSON } = createMockRequestResponse({ stepId: "step-1" })
    const handler = (await import("@/pages/api/steps/[stepId]/opportunities")).default

    await handler(req, res)

    expect(findStepById).toHaveBeenCalledWith("step-1")
    expect(getStatus()).toBe(404)
    expect(getJSON<{ ok: boolean; error: string }>()).toEqual({ ok: false, error: "Step not found" })
  })

  it("returns 403 when the step belongs to another user", async () => {
    getServerSession.mockResolvedValue({ user: { email: "owner@example.com" } })
    findStepById.mockResolvedValue({ user: "someone-else@example.com" })

    const { req, res, getStatus, getJSON } = createMockRequestResponse({ stepId: "step-1" })
    const handler = (await import("@/pages/api/steps/[stepId]/opportunities")).default

    await handler(req, res)

    expect(findStepById).toHaveBeenCalledWith("step-1")
    expect(getStatus()).toBe(403)
    expect(getJSON<{ ok: boolean; error: string }>()).toEqual({ ok: false, error: "Forbidden" })
  })

  it("returns stored opportunities for the step", async () => {
    const objectId = makeObjectId()
    getServerSession.mockResolvedValue({ user: { email: "owner@example.com" } })
    findStepById.mockResolvedValue({ _id: objectId, user: "owner@example.com" })
    getOpportunitiesByStep.mockResolvedValue([
      {
        id: "opp-1",
        stepId: objectId.toHexString(),
        title: "Industry visit",
        summary: "Spend a day shadowing a product team.",
        source: "kings-edge-simulated",
        form: "workshop",
        focus: "experience",
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
    expect(generateOpportunitiesForStep).not.toHaveBeenCalled()
  })

  it("lazy-generates opportunities when none exist", async () => {
    const objectId = makeObjectId()
    const generated: Opportunity[] = [
      {
        id: "generated-1",
        stepId: objectId.toHexString(),
        title: "Opportunity 1",
        summary: "Summary 1",
        source: "kings-edge-simulated",
        form: "workshop",
        focus: "skills",
        status: "suggested"
      },
      {
        id: "generated-2",
        stepId: objectId.toHexString(),
        title: "Opportunity 2",
        summary: "Summary 2",
        source: "kings-edge-simulated",
        form: "short-course",
        focus: "community",
        status: "suggested"
      },
      {
        id: "generated-3",
        stepId: objectId.toHexString(),
        title: "Opportunity 3",
        summary: "Summary 3",
        source: "independent",
        form: "independent-action",
        focus: "experience",
        status: "suggested"
      }
    ]

    getServerSession.mockResolvedValue({ user: { email: "owner@example.com" } })
    findStepById.mockResolvedValue({ _id: objectId, user: "owner@example.com" })
    getOpportunitiesByStep.mockResolvedValue([])
    generateOpportunitiesForStep.mockResolvedValue(generated)

    const { req, res, getStatus, getJSON } = createMockRequestResponse({ stepId: objectId.toHexString() })
    const handler = (await import("@/pages/api/steps/[stepId]/opportunities")).default

    await handler(req, res)

    expect(generateOpportunitiesForStep).toHaveBeenCalledWith({
      stepId: objectId.toHexString(),
      origin: "lazy-fetch"
    })
    expect(getStatus()).toBe(200)
    const payload = getJSON<{ ok: boolean; opportunities: Array<{ id: string }>; stepId: string }>()
    expect(payload.ok).toBe(true)
    expect(payload.opportunities).toHaveLength(3)
    expect(payload.opportunities[0].id).toBe("generated-1")
  })

  it("returns an empty array when lazy generation fails", async () => {
    const objectId = makeObjectId()
    getServerSession.mockResolvedValue({ user: { email: "owner@example.com" } })
    findStepById.mockResolvedValue({ _id: objectId, user: "owner@example.com" })
    getOpportunitiesByStep.mockResolvedValue([])
    generateOpportunitiesForStep.mockRejectedValue(new Error("generation failed"))

    const { req, res, getStatus, getJSON } = createMockRequestResponse({ stepId: objectId.toHexString() })
    const handler = (await import("@/pages/api/steps/[stepId]/opportunities")).default

    await handler(req, res)

    expect(generateOpportunitiesForStep).toHaveBeenCalledTimes(1)
    expect(getStatus()).toBe(200)
    const payload = getJSON<{ ok: boolean; opportunities: Array<{ id: string }>; stepId: string }>()
    expect(payload.ok).toBe(true)
    expect(payload.opportunities).toHaveLength(0)
  })

  it("returns 500 when fetching fails", async () => {
    const objectId = makeObjectId()
    getServerSession.mockResolvedValue({ user: { email: "owner@example.com" } })
    findStepById.mockResolvedValue({ _id: objectId, user: "owner@example.com" })
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
