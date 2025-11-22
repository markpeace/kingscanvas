import OpenAI from "openai"
import type { ChatCompletionMessageParam, ChatCompletion } from "openai/resources/chat/completions"
import { debug } from "@/lib/debug"

const apiKey = process.env.OPENAI_API_KEY

if (!apiKey) {
  throw new Error("OPENAI_API_KEY is not set")
}

const client = new OpenAI({
  apiKey,
  ...(process.env.OPENAI_BASE_URL ? { baseURL: process.env.OPENAI_BASE_URL } : {})
})

export async function createChatCompletion(messages: ChatCompletionMessageParam[]): Promise<ChatCompletion> {
  if (!process.env.LLM) {
    const message = "LLM environment variable must be set."
    // Emit error to debug panel
    debug.error(message)
    throw new Error(message)
  }

  const model = process.env.LLM

  debug.info("LLM request (runtime core)", {
    model: process.env.LLM,
    type: "chat-completion"
  })

  return client.chat.completions.create({
    model,
    messages
  })
}
