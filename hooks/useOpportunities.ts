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

        if (response.status === 404) {
          if (!isActive) {
            return
          }

          debug.debug('Opportunities hook: no opportunities yet', { stepId })
          setError(null)
          setOpportunities([])
          return
        }

        if (!response.ok) {
          throw new Error(`Failed to load opportunities (${response.status})`)
        }

        const payload: { ok: boolean; opportunities?: Opportunity[]; error?: string } = await response.json()

        if (!payload.ok || !Array.isArray(payload.opportunities)) {
          throw new Error(payload.error || 'Unexpected response when loading opportunities')
        }

        if (!isActive) return

        setOpportunities(payload.opportunities)
        debug.debug('Opportunities hook: fetched', { stepId, count: payload.opportunities.length })
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
