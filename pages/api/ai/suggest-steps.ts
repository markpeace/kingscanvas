import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'

import { debug } from '@/lib/debug'
import { runWorkflow } from '@/lib/langgraph/workflow'

import { authOptions } from '@/lib/auth/config'

type SuggestStepsRequestBody = {
  intentionId?: string
  intentionText?: string
  intentionBucket?: string
  historyAccepted?: string[]
  historyRejected?: string[]
}

type SuggestStepsResponse =
  | { ok: true; suggestions: Array<AiSuggestion> }
  | { ok?: false; error: string }

type AiSuggestion = {
  bucket: string
  text: string
  model?: string | null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<SuggestStepsResponse>) {
  const session = await getServerSession(req, res, authOptions)
  const email = process.env.VERCEL_ENV === 'production' ? session?.user?.email : 'test@test.com'

  if (!email) {
    debug.error('AI: unauthenticated request')
    return res.status(401).json({ ok: false, error: 'Not authenticated' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  const { intentionId, intentionText, intentionBucket, historyAccepted, historyRejected } = req.body as SuggestStepsRequestBody

  debug.trace('AI: suggest-steps request', {
    user: email,
    intentionId,
    intentionBucket,
    acceptedCount: historyAccepted?.length || 0,
    rejectedCount: historyRejected?.length || 0
  })

  try {
    const aiResponse = await runWorkflow('suggest-step', {
      intentionText,
      intentionBucket,
      historyAccepted,
      historyRejected
    })

    const suggestions = Array.isArray(aiResponse?.suggestions) ? aiResponse.suggestions : []

    const model = process.env.LLM || null

    const suggestionsWithModel: AiSuggestion[] = suggestions.map((suggestion: any) => ({
      bucket: suggestion.bucket,
      text: suggestion.text,
      model
    }))

    debug.info('AI: suggest-steps response', {
      count: suggestionsWithModel.length,
      example: suggestionsWithModel[0]?.text || '(none)',
      model
    })

    return res.status(200).json({ ok: true, suggestions: suggestionsWithModel })
  } catch (error: any) {
    const message =
      typeof error?.message === "string"
        ? error.message
        : "Unknown error during AI suggest-steps call."

    debug.error("AI: suggest-steps failed", { error: message })

    return res.status(500).json({
      ok: false,
      error: message
    })
  }
}
