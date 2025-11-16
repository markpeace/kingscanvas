'use client'

import { useEffect, useState } from 'react'

import { debug } from '@/lib/debug'
import type { Opportunity } from '@/types/canvas'

type UseOpportunitiesResult = {
  opportunities: Opportunity[]
  isLoading: boolean
  error: Error | null
}

export function useOpportunities(stepId?: string | null): UseOpportunitiesResult {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    debug.trace('Opportunities hook: init', { stepId })
  }, [stepId])

  useEffect(() => {
    let isActive = true
    const controller = new AbortController()

    if (!stepId) {
      setOpportunities([])
      setIsLoading(false)
      setError(null)

      return () => {
        controller.abort()
      }
    }

    setIsLoading(true)
    setError(null)
    setOpportunities([])

    const fetchOpportunities = async () => {
      try {
        debug.trace('Opportunities hook: fetching', { stepId })

        const response = await fetch(`/api/steps/${encodeURIComponent(stepId)}/opportunities`, {
          signal: controller.signal
        })

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
          if (!isActive) return
          setOpportunities([])
          setError(null)
          debug.debug('Opportunities hook: no opportunities yet (404)', { stepId })
          return
        }

        if (!response.ok) {
          const message = payload?.error || `Failed to load opportunities (${response.status})`
          throw new Error(message)
        }

        const items = Array.isArray(payload?.opportunities) ? payload?.opportunities : []

        if (!isActive) return

        setOpportunities(items ?? [])
        setError(null)
        debug.debug('Opportunities hook: fetched', { stepId, count: items?.length ?? 0 })
      } catch (err) {
        if (!isActive || controller.signal.aborted) {
          return
        }

        const normalizedError = err instanceof Error ? err : new Error(String(err))
        debug.error('Opportunities hook: fetch failed', { stepId, message: normalizedError.message })
        setError(normalizedError)
        setOpportunities([])
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void fetchOpportunities()

    return () => {
      isActive = false
      controller.abort()
    }
  }, [stepId])

  return { opportunities, isLoading, error }
}

export default useOpportunities
