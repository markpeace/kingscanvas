import { ChatOpenAI } from "@langchain/openai"

import { debugSink } from "@/components/debug/sink"
import { defaultModel, clientVisibleModel } from "./env"

debugSink.push({
  label: "AI client model selection",
  payload: defaultModel,
  channel: "ai",
  level: "info"
})

/**
 * Returns a configured ChatOpenAI model.
 * Env:
 * - OPENAI_API_KEY (required)
 * - LLM (optional, default "gpt-4.2-mini")
 * - NEXT_PUBLIC_LLM (optional client-visible override, default "gpt-4.2-mini")
 * - OPENAI_BASE_URL (optional override for Azure/gateways)
 */
export function getChatModel() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set")
  }
  const baseURL = process.env.OPENAI_BASE_URL // optional

  return new ChatOpenAI({
    model: defaultModel,
    apiKey,
    // IMPORTANT: the client expects `baseURL` directly (not inside `configuration`)
    ...(baseURL ? { baseURL } : {})
  })
}

export { defaultModel, clientVisibleModel }
