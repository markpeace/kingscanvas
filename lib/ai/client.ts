import { ChatOpenAI } from "@langchain/openai"
import { createHash } from "crypto"

const chatModelCache = new Map<string, ChatOpenAI>()

function getCacheKey(model: string, baseURL: string | undefined, apiKey: string) {
  const apiKeyHash = createHash("sha256").update(apiKey).digest("hex")
  return `${model}::${baseURL ?? "default"}::${apiKeyHash}`
}

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
  const baseURL = (process.env.OPENAI_BASE_URL ?? "").trim() || undefined
  const cacheKey = getCacheKey(model, baseURL, apiKey)

  const cached = chatModelCache.get(cacheKey)
  if (cached) {
    return cached
  }

  const client = new ChatOpenAI({
    model,
    apiKey,
    timeout: 30_000,
    maxRetries: 2,
    // IMPORTANT: the client expects `baseURL` directly (not inside `configuration`)
    ...(baseURL ? { baseURL } : {})
  })

  chatModelCache.set(cacheKey, client)

  return client
}
