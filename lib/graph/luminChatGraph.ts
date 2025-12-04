"use client"

import { getCoreKnowledge } from "@/lib/coreKnowledge/store"
import { debugLog } from "@/lib/debug/log"

export type CoreKnowledgeSnapshot = {
  exists: boolean
  seededThisRun: boolean
  createdAt?: string
  updatedAt?: string
  domainKeys?: string[]
}

export async function loadCoreKnowledgeSnapshot({
  userId,
  luminaryId
}: {
  userId: string
  luminaryId: string
}): Promise<CoreKnowledgeSnapshot> {
  const result = await getCoreKnowledge({ userId, luminaryId })
  const doc = result.coreKnowledge
  return {
    exists: result.coreKnowledgeConfigured && Boolean(doc),
    seededThisRun: false,
    createdAt: doc?.createdAt,
    updatedAt: doc?.updatedAt,
    domainKeys: doc ? Object.keys(doc.domains ?? {}) : []
  }
}

export async function logLuminaryRunWithCoreKnowledge({
  userId,
  luminaryId
}: {
  userId: string
  luminaryId: string
}) {
  const snapshot = await loadCoreKnowledgeSnapshot({ userId, luminaryId })
  debugLog(
    "LuminaryRun",
    {
      luminaryId,
      coreKnowledge: snapshot
    },
    { channel: "luminary", level: "info" }
  )
  return snapshot
}
