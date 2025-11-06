import { ChatOpenAI } from "@langchain/openai"

/**
 * Returns a configured ChatOpenAI model.
 * Env:
 * - OPENAI_API_KEY (required)
 * - OPENAI_MODEL (optional, default "gpt-4o-mini")
 * - OPENAI_BASE_URL (optional override for Azure/gateways)
 */
export function getChatModel() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set")
  }
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini"
  const baseURL = process.env.OPENAI_BASE_URL // optional

  return new ChatOpenAI({
    model,
    apiKey,
    // IMPORTANT: the client expects `baseURL` directly (not inside `configuration`)
    ...(baseURL ? { baseURL } : {})
  })
}
