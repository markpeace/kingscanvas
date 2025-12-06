'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { debug } from '@/lib/debug'
import type { StudentPersonaId } from '@/lib/context/studentPersonas'
import type { Opportunity } from '@/types/canvas'

type UseOpportunitiesResult = {
  opportunities: Opportunity[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<Opportunity[]>
}

type UseOpportunitiesOptions = {
  onFirstAutoGenerateStart?: () => void
  onFirstAutoGenerateComplete?: () => void
}

export function useOpportunities(
  stepId?: string | null,
  personaId?: StudentPersonaId,
  options?: UseOpportunitiesOptions
): UseOpportunitiesResult {
  const { onFirstAutoGenerateStart, onFirstAutoGenerateComplete } = options ?? {}
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const fetchIdRef = useRef(0)
  const hasStartedRef = useRef(false)
  const hasCompletedRef = useRef(false)

  const fetchOpportunities = useCallback(async (): Promise<Opportunity[]> => {
    if (!stepId || !personaId) {
      debug.debug('Opportunities hook: skipping fetch (missing step id or persona)')
      setOpportunities([])
      setError(null)
      setIsLoading(false)
      return []
    }

    const currentFetchId = ++fetchIdRef.current

    try {
      if (!hasStartedRef.current) {
        hasStartedRef.current = true
        if (onFirstAutoGenerateStart) {
          onFirstAutoGenerateStart()
        }
      }

      setIsLoading(true)
      setError(null)

      debug.trace('Opportunities hook: fetching', { stepId, personaId: personaId ?? 'default' })

      const personaQuery = personaId ? `?personaId=${encodeURIComponent(personaId)}` : ''
      const response = await fetch(`/api/steps/${encodeURIComponent(stepId)}/opportunities${personaQuery}`)

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

      const newOpportunities = Array.isArray(payload?.opportunities) ? payload?.opportunities : []

      if (currentFetchId !== fetchIdRef.current) {
        return newOpportunities
      }

      setOpportunities(newOpportunities)
      setError(null)
      debug.info('Opportunities hook: fetched', { stepId, count: newOpportunities.length })

      if (!hasCompletedRef.current && newOpportunities.length > 0) {
        hasCompletedRef.current = true
        if (onFirstAutoGenerateComplete) {
          onFirstAutoGenerateComplete()
        }
      }

      return newOpportunities
    } catch (err) {
      if (currentFetchId !== fetchIdRef.current) {
        return []
      }

      const normalizedError = err instanceof Error ? err : new Error(String(err))
      debug.error('Opportunities hook: fetch failed', { stepId, error: normalizedError })
      setError(normalizedError)
      throw normalizedError
    } finally {
      if (currentFetchId === fetchIdRef.current) {
        setIsLoading(false)
      }
    }
  }, [onFirstAutoGenerateComplete, onFirstAutoGenerateStart, personaId, stepId])

  useEffect(() => {
    fetchOpportunities().catch(() => {
      // Errors are already logged and pushed into state; suppress unhandled rejections.
    })
  }, [fetchOpportunities])

  return { opportunities, isLoading, error, refetch: fetchOpportunities }
}

export default useOpportunities
