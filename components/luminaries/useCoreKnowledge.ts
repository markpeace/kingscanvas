"use client"

import { useCallback, useEffect, useState } from "react"

export type CoreKnowledgeResponse = {
  userId: string
  luminaryId: string
  coreKnowledgeConfigured: boolean
  coreKnowledge?: {
    createdAt: string
    updatedAt: string
    domains: Record<string, any>
  }
  error?: string
}

export function useCoreKnowledge(luminaryId: string) {
  const [data, setData] = useState<CoreKnowledgeResponse | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const load = useCallback(
    async (signal?: AbortSignal) => {
      if (!luminaryId || signal?.aborted) return
      setIsLoading(true)
      setError(null)

      try {
        const res = await fetch(`/api/luminaries/${luminaryId}/core-knowledge`, { signal })
        if (!res.ok) {
          throw new Error("Failed to fetch core knowledge")
        }
        const json = (await res.json()) as CoreKnowledgeResponse
        if (!signal?.aborted) setData(json)
      } catch (err) {
        if (signal?.aborted) return
        setError(err as Error)
        setData(null)
      } finally {
        if (!signal?.aborted) setIsLoading(false)
      }
    },
    [luminaryId]
  )

  useEffect(() => {
    const controller = new AbortController()

    load(controller.signal)

    return () => {
      controller.abort()
    }
  }, [load])

  const refresh = useCallback(() => load(), [load])

  return { data, error, isLoading, refresh }
}
