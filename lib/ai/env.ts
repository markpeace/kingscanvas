if (!process.env.LLM) {
  throw new Error("LLM environment variable must be set.")
}

if (!process.env.LLM && !process.env.NEXT_PUBLIC_LLM) {
  throw new Error("LLM environment variable must be set.")
}

export const defaultModel = process.env.LLM
export const clientVisibleModel = process.env.NEXT_PUBLIC_LLM || defaultModel

