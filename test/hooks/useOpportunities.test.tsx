import { act, renderHook, waitFor } from '@testing-library/react'

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
        description: 'Summary',
        decision_status: 'suggested',
        source: 'catalogue',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z'
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
    expect(result.current.opportunities).toEqual([
      expect.objectContaining({
        id: 'opp-1',
        stepId: 'step-123',
        title: 'Opportunity',
        summary: 'Summary',
        source: 'kings-edge-simulated',
        status: 'suggested'
      })
    ])
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

  it('supports refetching opportunities on demand', async () => {
    const initialOpportunity = {
      id: 'opp-initial',
      stepId: 'step-123',
      title: 'Initial Opportunity',
      description: 'Initial summary',
      decision_status: 'suggested',
      source: 'catalogue',
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z'
    }
    const refreshedOpportunity = {
      ...initialOpportunity,
      id: 'opp-refreshed',
      title: 'Refreshed Opportunity'
    }

    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ok: true, opportunities: [initialOpportunity] })
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ok: true, opportunities: [refreshedOpportunity] })
      })

    const { result } = renderHook(() => useOpportunities('step-123'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.opportunities[0]).toEqual(
      expect.objectContaining({
        id: 'opp-initial',
        title: 'Initial Opportunity',
        summary: 'Initial summary',
        source: 'kings-edge-simulated'
      })
    )

    await act(async () => {
      await result.current.refetch()
    })

    expect(global.fetch).toHaveBeenLastCalledWith('/api/steps/step-123/opportunities')
    expect(result.current.error).toBeNull()
    expect(result.current.opportunities[0]).toEqual(
      expect.objectContaining({
        id: 'opp-refreshed',
        title: 'Refreshed Opportunity',
        source: 'kings-edge-simulated'
      })
    )
  })

  it('invokes onFirstAutoGenerateStart once when fetching begins', async () => {
    const opportunities = [
      {
        id: 'opp-1',
        stepId: 'step-123',
        title: 'Opportunity',
        description: 'Summary',
        decision_status: 'suggested',
        source: 'catalogue',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z'
      }
    ]

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, opportunities })
    })

    const onFirstAutoGenerateStart = jest.fn()
    const { result } = renderHook(() =>
      useOpportunities('step-123', undefined, { onFirstAutoGenerateStart })
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(onFirstAutoGenerateStart).toHaveBeenCalledTimes(1)
  })

  it('invokes onFirstAutoGenerateComplete once when opportunities are returned', async () => {
    const opportunities = [
      {
        id: 'opp-1',
        stepId: 'step-123',
        title: 'Opportunity',
        description: 'Summary',
        decision_status: 'suggested',
        source: 'catalogue',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z'
      }
    ]

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, opportunities })
    })

    const onFirstAutoGenerateComplete = jest.fn()
    const { result } = renderHook(() =>
      useOpportunities('step-123', undefined, { onFirstAutoGenerateComplete })
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(onFirstAutoGenerateComplete).toHaveBeenCalledTimes(1)
  })

  it('does not invoke onFirstAutoGenerateComplete when no opportunities are returned', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, opportunities: [] })
    })

    const onFirstAutoGenerateComplete = jest.fn()
    const { result } = renderHook(() =>
      useOpportunities('step-123', undefined, { onFirstAutoGenerateComplete })
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(onFirstAutoGenerateComplete).not.toHaveBeenCalled()
  })
})
