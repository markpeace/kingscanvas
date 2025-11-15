import { renderHook, waitFor } from '@testing-library/react'

import { useOpportunities } from '@/hooks/useOpportunities'

jest.mock('@/lib/debug', () => ({
  debug: {
    trace: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  },
}))

describe('useOpportunities', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('treats 404 responses as empty results', async () => {
    const fetchMock = jest.spyOn(global, 'fetch' as typeof fetch).mockResolvedValue({
      ok: false,
      status: 404,
      json: jest.fn().mockResolvedValue({ ok: false, error: 'Not found' }),
    } as any)

    const { result } = renderHook(() => useOpportunities('step-404'))

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(fetchMock).toHaveBeenCalled()
    expect(result.current.error).toBeNull()
    expect(result.current.opportunities).toEqual([])
  })

  it('surfaces non-404 errors', async () => {
    const fetchMock = jest.spyOn(global, 'fetch' as typeof fetch).mockResolvedValue({
      ok: false,
      status: 500,
      json: jest.fn().mockResolvedValue({ ok: false, error: 'Server error' }),
    } as any)

    const { result } = renderHook(() => useOpportunities('step-500'))

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(fetchMock).toHaveBeenCalled()
    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.opportunities).toEqual([])
  })

  it('returns opportunities on success', async () => {
    const payload = { ok: true, opportunities: [{ id: 'opp-1' }] }
    const fetchMock = jest.spyOn(global, 'fetch' as typeof fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(payload),
    } as any)

    const { result } = renderHook(() => useOpportunities('step-200'))

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(fetchMock).toHaveBeenCalled()
    expect(result.current.error).toBeNull()
    expect(result.current.opportunities).toEqual(payload.opportunities)
  })
})
