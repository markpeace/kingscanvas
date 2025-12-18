import type { NextApiRequest, NextApiResponse } from 'next'
import handler from '@/pages/api/ai/suggest-steps'
import { runWorkflow } from '@/lib/langgraph/workflow'
import { getServerSession } from 'next-auth'

jest.mock('@/lib/langgraph/workflow', () => ({
  runWorkflow: jest.fn()
}))

jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}))

const mockRunWorkflow = runWorkflow as jest.MockedFunction<typeof runWorkflow>
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>

type JsonValue = unknown

type MockResult = {
  req: NextApiRequest
  res: NextApiResponse
  getStatus: () => number
  getJSON: () => JsonValue
}

function createMockRequestResponse(body: Record<string, unknown>, method = 'POST'): MockResult {
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
    getJSON: () => jsonBody
  }
}

describe('/api/ai/suggest-steps POST', () => {
  beforeEach(() => {
    mockRunWorkflow.mockReset()
    mockGetServerSession.mockReset()
    mockGetServerSession.mockResolvedValue({
      user: { email: 'tester@example.com' }
    } as any)
  })

  it('returns AI suggestions when the workflow resolves', async () => {
    mockRunWorkflow.mockResolvedValue({
      suggestions: [{ bucket: 'do-now', text: 'Write your CV' }],
      model: 'gpt-4o-mini'
    })

    const { req, res, getStatus, getJSON } = createMockRequestResponse({
      intentionId: 'int-123',
      intentionText: 'Apply for internships',
      intentionBucket: 'do-now',
      historyAccepted: ['Draft CV'],
      historyRejected: []
    })

    await handler(req, res)

    expect(mockRunWorkflow).toHaveBeenCalledWith('suggest-step', expect.objectContaining({
      intentionText: 'Apply for internships',
      intentionBucket: 'do-now'
    }))
    expect(getStatus()).toBe(200)
    const json = getJSON() as { ok: boolean; suggestions: Array<{ bucket: string; text: string }>; model: string }
    expect(json.ok).toBe(true)
    expect(json.suggestions).toEqual([{ bucket: 'do-now', text: 'Write your CV' }])
    expect(typeof json.model).toBe('string')
    expect(json.model.length).toBeGreaterThan(0)
  })

  it('returns 503 when the AI client is misconfigured', async () => {
    mockRunWorkflow.mockRejectedValue(new Error('OPENAI_API_KEY is not set'))

    const { req, res, getStatus, getJSON } = createMockRequestResponse({
      intentionId: 'int-456',
      intentionText: 'Learn TypeScript',
      intentionBucket: 'do-later'
    })

    await handler(req, res)

    expect(getStatus()).toBe(503)
    const json = getJSON() as { ok: boolean; error: string }
    expect(json.ok).toBe(false)
    expect(json.error).toBe('AI is not configured')
  })

  it('returns 503 when LLM is not configured', async () => {
    mockRunWorkflow.mockRejectedValue(new Error('LLM environment variable is not set'))

    const { req, res, getStatus, getJSON } = createMockRequestResponse({
      intentionText: 'Learn React'
    })

    await handler(req, res)

    expect(getStatus()).toBe(503)
    const json = getJSON() as { ok: boolean; error: string }
    expect(json.ok).toBe(false)
    expect(json.error).toBe('LLM environment variable is not set')
  })

  it('forwards the fast flag, defaulting to lite mode', async () => {
    mockRunWorkflow.mockResolvedValue({
      suggestions: [{ bucket: 'do-now', text: 'Start a portfolio' }],
      model: 'gpt-4o-mini'
    })

    const originalEnv = process.env.LLM_FAST
    process.env.LLM_FAST = 'true'

    const { req, res } = createMockRequestResponse({
      intentionText: 'Build projects',
      intentionBucket: 'before-graduation',
      fast: false
    })

    try {
      await handler(req, res)

      expect(mockRunWorkflow).toHaveBeenCalledWith(
        'suggest-step',
        expect.objectContaining({
          intentionText: 'Build projects',
          intentionBucket: 'before-graduation',
          fast: true
        })
      )
    } finally {
      process.env.LLM_FAST = originalEnv
    }
  })
})
