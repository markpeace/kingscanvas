import { ChatOpenAI } from "@langchain/openai"

export type ModelMode = "fast" | "quality"

export function resolveModelMode(value?: unknown): ModelMode {
  if (typeof value === "string" && value.trim().toLowerCase() === "quality") {
    return "quality"
  }
  return "fast"
}

type GetChatModelOptions = {
  mode?: ModelMode
}

/**
 * Returns a configured ChatOpenAI model.
 * Env:
 * - OPENAI_API_KEY (required)
 * - LLM (optional; defaults to gpt-4o-mini for fast requests)
 * - LLM_HEAVY (optional; used for quality requests, falls back to LLM)
 * - OPENAI_BASE_URL (optional override for Azure/gateways)
 */
export function getChatModel(options: GetChatModelOptions = {}) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set")
  }

  const mode = resolveModelMode(options.mode)
  const fastModel = (process.env.LLM ?? "").trim() || "gpt-4o-mini"
  const heavyModel = (process.env.LLM_HEAVY ?? "").trim() || fastModel
  const selectedModel = mode === "quality" ? heavyModel : fastModel

  const baseURL = process.env.OPENAI_BASE_URL // optional

  return new ChatOpenAI({
    model: selectedModel,
    apiKey,
    // IMPORTANT: the client expects `baseURL` directly (not inside `configuration`)
    ...(baseURL ? { baseURL } : {})
  })
}
