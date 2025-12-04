import { coreKnowledgeDocuments, type CoreKnowledgeDocument } from "@/data/coreKnowledge"
import { luminaryDefinitions } from "@/lib/luminaries/schema"

export type CoreKnowledgeLookupResult = {
  coreKnowledgeConfigured: boolean
  coreKnowledge?: CoreKnowledgeDocument
}

export async function getCoreKnowledge({ userId, luminaryId }: { userId: string; luminaryId: string }): Promise<CoreKnowledgeLookupResult> {
  const definition = luminaryDefinitions[luminaryId]
  if (!definition?.coreKnowledge) {
    return { coreKnowledgeConfigured: false }
  }

  const doc = coreKnowledgeDocuments.find(
    (entry) => entry.userId === userId && entry.luminaryId === luminaryId
  )

  return {
    coreKnowledgeConfigured: true,
    coreKnowledge: doc
  }
}

export async function createCoreKnowledgeFromDefinition({
  userId,
  luminaryId
}: {
  userId: string
  luminaryId: string
}): Promise<CoreKnowledgeDocument | undefined> {
  const definition = luminaryDefinitions[luminaryId]
  if (!definition?.coreKnowledge) return undefined
  const existing = coreKnowledgeDocuments.find(
    (entry) => entry.userId === userId && entry.luminaryId === luminaryId
  )
  return existing
}
