'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { debug } from '@/lib/debug'
import type { Opportunity } from '@/types/canvas'

type UseOpportunitiesResult = {
  opportunities: Opportunity[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<Opportunity[]>
}

export function useOpportunities(stepId?: string | null): UseOpportunitiesResult {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const fetchIdRef = useRef(0)

  useEffect(() => {
    debug.trace('Opportunities hook: init', { stepId })
  }, [stepId])

  const fetchOpportunities = useCallback(async (): Promise<Opportunity[]> => {
    if (!stepId) {
      debug.debug('Opportunities hook: skipping fetch (missing step id)')
      setOpportunities([])
      setError(null)
      setIsLoading(false)
      return []
    }

    const currentFetchId = ++fetchIdRef.current
    setIsLoading(true)
    setError(null)

    try {
      debug.trace('Opportunities hook: fetching', { stepId })

      const response = await fetch(`/api/steps/${encodeURIComponent(stepId)}/opportunities`)

      let payload: { ok?: boolean; opportunities?: Opportunity[]; error?: string } | null = null

      try {
        payload = await response.json()
      } catch (parseError) {
        debug.warn('Opportunities hook: response parse failed', {
          stepId,
          message: parseError instanceof Error ? parseError.message : String(parseError)
        })
      }

      if (response.status === 404) {
        if (currentFetchId !== fetchIdRef.current) {
          return []
        }
        setOpportunities([])
        setError(null)
        debug.info('Opportunities hook: fetched', { stepId, count: 0 })
        return []
      }

      if (!response.ok) {
        const message = payload?.error || `Failed to load opportunities (${response.status})`
        throw new Error(message)
      }

      const items = Array.isArray(payload?.opportunities) ? payload?.opportunities : []

      if (currentFetchId !== fetchIdRef.current) {
        return items
      }

      setOpportunities(items)
      setError(null)
      debug.info('Opportunities hook: fetched', { stepId, count: items.length })
      return items
    } catch (err) {
      if (currentFetchId !== fetchIdRef.current) {
        return []
      }

      const normalizedError = err instanceof Error ? err : new Error(String(err))
      debug.error('Opportunities hook: fetch failed', { stepId, message: normalizedError.message })
      setError(normalizedError)
      setOpportunities([])
      throw normalizedError
    } finally {
      if (currentFetchId === fetchIdRef.current) {
        setIsLoading(false)
      }
    }
  }, [stepId])

  useEffect(() => {
    fetchOpportunities().catch(() => {
      // Errors are already logged and pushed into state; suppress unhandled rejections.
    })
  }, [fetchOpportunities])

  return { opportunities, isLoading, error, refetch: fetchOpportunities }
}

export default useOpportunities
