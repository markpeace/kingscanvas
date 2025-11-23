import { ChatOpenAI } from "@langchain/openai"

/**
 * Returns a configured ChatOpenAI model.
 * Env:
 * - OPENAI_API_KEY (required)
 * - LLM (required model name)
 * - OPENAI_BASE_URL (optional override for Azure/gateways)
 */
export function getChatModel() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set")
  }
  const model = (process.env.LLM ?? "").trim()
  if (!model) {
    throw new Error("LLM environment variable is not set")
  }
  const baseURL = process.env.OPENAI_BASE_URL // optional

  return new ChatOpenAI({
    model,
    apiKey,
    // IMPORTANT: the client expects `baseURL` directly (not inside `configuration`)
    ...(baseURL ? { baseURL } : {})
  })
}
