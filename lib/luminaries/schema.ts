export type CoreKnowledgeConfig = {
  schemaVersion: string
}

export type LuminaryDefinition = {
  id: string
  name: string
  coreKnowledge?: CoreKnowledgeConfig
}

export const luminaryDefinitions: Record<string, LuminaryDefinition> = {
  temp: {
    id: "temp",
    name: "Temp Luminary",
    coreKnowledge: {
      schemaVersion: "1.0"
    }
  }
}
