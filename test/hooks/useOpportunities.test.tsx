import { renderHook, waitFor } from '@testing-library/react'

import { useOpportunities } from '@/hooks/useOpportunities'

describe('useOpportunities', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = jest.fn() as unknown as typeof global.fetch
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  afterAll(() => {
    global.fetch = originalFetch
  })

  it('returns opportunities on success', async () => {
    const opportunities = [
      {
        id: 'opp-1',
        stepId: 'step-123',
        title: 'Opportunity',
        summary: 'Summary',
        source: 'edge_simulated',
        form: 'intensive',
        focus: 'capability',
        status: 'suggested'
      }
    ]

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, opportunities })
    })

    const { result } = renderHook(() => useOpportunities('step-123'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBeNull()
    expect(result.current.opportunities).toEqual(opportunities)
  })

  it('treats 404 as an empty state', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ ok: false, error: 'Step not found' })
    })

    const { result } = renderHook(() => useOpportunities('step-404'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBeNull()
    expect(result.current.opportunities).toEqual([])
  })

  it('surfaces errors for server failures', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ ok: false, error: 'Server error' })
    })

    const { result } = renderHook(() => useOpportunities('step-500'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.opportunities).toEqual([])
  })
})
