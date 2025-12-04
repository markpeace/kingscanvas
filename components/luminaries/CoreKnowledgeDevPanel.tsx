"use client"

import { ObjectInspector } from "react-inspector"
import { useCoreKnowledge } from "./useCoreKnowledge"

export function CoreKnowledgeDevPanel({ luminaryId }: { luminaryId: string }) {
  const { data, error, isLoading } = useCoreKnowledge(luminaryId)

  if (isLoading) {
    return (
      <div className="rounded border p-3 bg-white/80 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading Core Knowledge…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded border p-3 bg-white/80 dark:bg-zinc-900/80 border-red-200 dark:border-red-800">
        <p className="text-sm text-red-700 dark:text-red-300">Unable to load Core Knowledge right now.</p>
      </div>
    )
  }

  if (!data) return null

  if (!data.coreKnowledgeConfigured) {
    return (
      <div className="rounded border p-3 bg-white/80 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800">
        <p className="text-sm text-zinc-700 dark:text-zinc-300">Core Knowledge is not configured for this Luminary.</p>
      </div>
    )
  }

  return (
    <div className="rounded border p-3 bg-white/80 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm">Developer Core Knowledge (JSON)</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Read only</p>
      </div>
      <div className="rounded border p-2 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
        <ObjectInspector data={data.coreKnowledge ?? {}} expandLevel={2} />
      </div>
    </div>
  )
}
