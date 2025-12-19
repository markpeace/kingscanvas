import { ChatOpenAI } from "@langchain/openai"

export type ModelMode = "fast" | "quality"

/**
 * Returns a configured ChatOpenAI model.
 * Env:
 * - OPENAI_API_KEY (required)
 * - LLM (fast model; defaults to `gpt-4o-mini` when unset)
 * - LLM_HEAVY (quality model; falls back to LLM/default when unset)
 * - OPENAI_BASE_URL (optional override for Azure/gateways)
 */
export function getChatModel(mode: ModelMode = "fast") {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set")
  }

  const fastModel = (process.env.LLM ?? "").trim() || "gpt-4o-mini"
  const qualityModel = (process.env.LLM_HEAVY ?? "").trim() || fastModel
  const model = mode === "quality" ? qualityModel : fastModel
  const baseURL = process.env.OPENAI_BASE_URL // optional

  return new ChatOpenAI({
    model,
    apiKey,
    // IMPORTANT: the client expects `baseURL` directly (not inside `configuration`)
    ...(baseURL ? { baseURL } : {})
  })
}
