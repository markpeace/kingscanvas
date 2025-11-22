import { ChatOpenAI } from "@langchain/openai"
import { debug } from "@/lib/debug"

if (!process.env.LLM) {
  const message = "LLM environment variable must be set."
  debug.error(message)
  throw new Error(message)
}

const model = process.env.LLM

/**
 * Returns a configured ChatOpenAI model.
 * Env:
 * - OPENAI_API_KEY (required)
 * - LLM (required)
 * - OPENAI_BASE_URL (optional override for Azure/gateways)
 */
export function getChatModel() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set")
  }
  const baseURL = process.env.OPENAI_BASE_URL // optional

  return new ChatOpenAI({
    model,
    apiKey,
    // IMPORTANT: the client expects `baseURL` directly (not inside `configuration`)
    ...(baseURL ? { baseURL } : {})
  })
}
