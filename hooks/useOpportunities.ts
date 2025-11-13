import { useCallback, useEffect, useRef, useState } from 'react'

import { debug } from '@/lib/debug'
import type { Opportunity } from '@/types/canvas'

type UseOpportunitiesOptions = {
  enabled?: boolean
}

type UseOpportunitiesResult = {
  opportunities: Opportunity[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

function formatFetchError(status: number, statusText: string): Error {
  return new Error(`Failed to load opportunities (${status} ${statusText})`)
}

export function useOpportunities(stepId: string | null | undefined, options?: UseOpportunitiesOptions): UseOpportunitiesResult {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
      abortControllerRef.current?.abort()
    }
  }, [])

  const enabled = Boolean(stepId) && options?.enabled !== false
  const endpoint = stepId ? `/api/steps/${encodeURIComponent(stepId)}/opportunities` : null

  const refetch = useCallback(async () => {
    if (!enabled || !endpoint) {
      if (isMountedRef.current) {
        setOpportunities([])
        setIsLoading(false)
        setError(null)
      }
      return
    }

    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    if (isMountedRef.current) {
      setIsLoading(true)
      setError(null)
    }

    try {
      debug.trace('Opportunities hook: fetching', { stepId })
      const response = await fetch(endpoint, { signal: controller.signal })

      if (!response.ok) {
        throw formatFetchError(response.status, response.statusText)
      }

      const payload = (await response.json()) as Opportunity[]

      if (!isMountedRef.current || controller.signal.aborted) {
        return
      }

      debug.info('Opportunities hook: fetch succeeded', { stepId, count: payload.length })
      setOpportunities(payload)
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') {
        debug.debug('Opportunities hook: fetch aborted', { stepId })
        return
      }

      const normalisedError = err instanceof Error ? err : new Error('Failed to load opportunities')

      if (!isMountedRef.current || controller.signal.aborted) {
        return
      }

      debug.error('Opportunities hook: fetch failed', { stepId, message: normalisedError.message })
      setOpportunities([])
      setError(normalisedError)
    } finally {
      if (!isMountedRef.current || controller.signal.aborted) {
        return
      }

      setIsLoading(false)
    }
  }, [enabled, endpoint, stepId])

  useEffect(() => {
    void refetch()

    return () => {
      abortControllerRef.current?.abort()
    }
  }, [refetch])

  return {
    opportunities,
    isLoading,
    error,
    refetch
  }
}

export type { Opportunity }
