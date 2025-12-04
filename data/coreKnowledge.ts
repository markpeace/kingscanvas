export type CoreKnowledgeDomain = Record<string, any>

export type CoreKnowledgeDocument = {
  userId: string
  luminaryId: string
  createdAt: string
  updatedAt: string
  domains: Record<string, CoreKnowledgeDomain>
}

const now = "2025-12-03T12:00:00Z"

export const coreKnowledgeDocuments: CoreKnowledgeDocument[] = [
  {
    userId: "demo-user",
    luminaryId: "temp",
    createdAt: now,
    updatedAt: now,
    domains: {
      preferences: {
        tone: "concise",
        focus: "Clear step-by-step outputs"
      },
      workspaceNotes: {
        notes: [],
        highlights: ["Prefers succinct answers", "Values quick iteration"]
      }
    }
  }
]
