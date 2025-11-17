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
        summary: 'Summary',
        source: 'kings-edge-simulated',
        form: 'workshop',
        focus: 'skills',
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

  it('allows shuffling opportunities and updates the list', async () => {
    const initialOpportunity = {
      id: 'opp-initial',
      stepId: 'step-123',
      title: 'Opportunity A',
      summary: 'Initial summary',
      source: 'kings-edge-simulated',
      form: 'workshop',
      focus: 'skills',
      status: 'suggested'
    }
    const shuffledOpportunity = {
      ...initialOpportunity,
      id: 'opp-shuffled',
      title: 'Shuffled Opportunity'
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
        json: async () => ({ ok: true, opportunities: [shuffledOpportunity] })
      })

    const { result } = renderHook(() => useOpportunities('step-123'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.shuffle()
    })

    expect(global.fetch).toHaveBeenLastCalledWith('/api/steps/step-123/shuffle-opportunities', { method: 'POST' })
    expect(result.current.error).toBeNull()
    expect(result.current.opportunities).toEqual([shuffledOpportunity])
  })

  it('surfaces shuffle errors without clearing the previous data', async () => {
    const stableOpportunity = {
      id: 'opp-stable',
      stepId: 'step-123',
      title: 'Keep me',
      summary: 'Still here',
      source: 'kings-edge-simulated',
      form: 'workshop',
      focus: 'skills',
      status: 'suggested'
    }

    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ok: true, opportunities: [stableOpportunity] })
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ ok: false, error: 'Shuffle failed' })
      })

    const { result } = renderHook(() => useOpportunities('step-123'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await expect(result.current.shuffle()).rejects.toThrow('Shuffle failed')
    })

    expect(result.current.opportunities).toEqual([stableOpportunity])
    expect(result.current.error).toBeInstanceOf(Error)
  })
})
