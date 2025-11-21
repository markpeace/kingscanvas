const model = process.env.LLM
if (!model) {
  console.warn("[ai-client] No LLM environment variable set. Falling back to gpt-4.2-mini.")
}

export const defaultModel = model || "gpt-4.2-mini"
export const clientVisibleModel = process.env.NEXT_PUBLIC_LLM || defaultModel

