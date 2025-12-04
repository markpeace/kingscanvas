"use client"

import useSWR from "swr"

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

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error("Failed to fetch core knowledge")
  return res.json()
})

export function useCoreKnowledge(luminaryId: string) {
  const { data, error, isLoading, mutate } = useSWR<CoreKnowledgeResponse>(
    luminaryId ? `/api/luminaries/${luminaryId}/core-knowledge` : null,
    fetcher
  )

  return {
    data,
    error,
    isLoading,
    refresh: mutate
  }
}
