"use client"

import { useEffect, useMemo } from "react"
import { useCoreKnowledge } from "./useCoreKnowledge"
import { logLuminaryRunWithCoreKnowledge } from "@/lib/graph/luminChatGraph"

export function CoreKnowledgeSummaryCard({ luminaryId }: { luminaryId: string }) {
  const { data, error, isLoading } = useCoreKnowledge(luminaryId)

  useEffect(() => {
    if (data) {
      logLuminaryRunWithCoreKnowledge({ userId: data.userId, luminaryId: data.luminaryId })
    }
  }, [data])

  const summary = useMemo(() => {
    if (!data?.coreKnowledge) return null
    const tone = data.coreKnowledge.domains?.preferences?.tone
    const notesCount = data.coreKnowledge.domains?.workspaceNotes?.notes?.length ?? 0
    const highlights = data.coreKnowledge.domains?.workspaceNotes?.highlights ?? []

    return {
      tone,
      notesCount,
      highlights
    }
  }, [data])

  return (
    <div className="rounded border p-3 bg-white/80 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm">Core Knowledge summary</h3>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">Read only</span>
      </div>

      {isLoading ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading Core Knowledge…</p>
      ) : error ? (
        <p className="text-sm text-red-700 dark:text-red-300">Core Knowledge unavailable right now.</p>
      ) : !data ? null : !data.coreKnowledgeConfigured ? (
        <p className="text-sm text-zinc-700 dark:text-zinc-300">Core Knowledge is not configured for this Luminary.</p>
      ) : !summary ? (
        <p className="text-sm text-zinc-700 dark:text-zinc-300">No Core Knowledge found for this user.</p>
      ) : (
        <div className="space-y-1 text-sm">
          {summary.tone ? (
            <p className="text-zinc-800 dark:text-zinc-100">Tone: <span className="font-medium">{summary.tone}</span></p>
          ) : null}
          <p className="text-zinc-800 dark:text-zinc-100">Notes saved: {summary.notesCount}</p>
          {summary.highlights?.length ? (
            <p className="text-zinc-700 dark:text-zinc-200 text-xs">Highlights: {summary.highlights.slice(0, 3).join(", ")}</p>
          ) : null}
        </div>
      )}
    </div>
  )
}
