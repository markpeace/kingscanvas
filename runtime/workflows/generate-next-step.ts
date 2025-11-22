import type { ChatCompletionMessageParam } from "openai/resources/chat/completions"
import { debug } from "@/lib/debug"
import { createChatCompletion } from "../core/llm"

type GenerateNextStepInput = {
  intention: string
  bucket?: string
  history?: string[]
}

type GenerateNextStepResult = {
  step: string
}

export async function generateNextStepWorkflow(payload: GenerateNextStepInput): Promise<GenerateNextStepResult> {
  debug.info("Active LLM model (workflow: generate-next-step)", {
    model: process.env.LLM
  })

  const { intention, bucket, history } = payload
  const prompt = [
    "You are generating the next concise step for a learner.",
    bucket ? `Bucket: ${bucket}.` : null,
    `Intention: ${intention || "(unspecified)"}.`,
    history?.length ? `Recent history: ${history.join(" | ")}.` : null,
    "Return a single-sentence step."
  ]
    .filter(Boolean)
    .join("\n")

  debug.trace("Step generation prompt (workflow: generate-next-step)", {
    prompt
  })

  if (!process.env.LLM) {
    const message = "LLM environment variable must be set."
    debug.error(message)
    throw new Error(message)
  }

  const messages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: "You propose the next concise action for the learner without adding extra commentary."
    },
    { role: "user", content: prompt }
  ]

  const completion = await createChatCompletion(messages)
  const step = completion.choices?.[0]?.message?.content?.trim() ?? ""

  return { step }
}
