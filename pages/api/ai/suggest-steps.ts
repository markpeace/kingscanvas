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
  | { ok: true; suggestions: Array<{ bucket: string; text: string }> }
  | { ok?: false; error: string }

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
    const aiResponse = await runWorkflow('suggest-steps', {
      intentionText,
      intentionBucket,
      historyAccepted,
      historyRejected
    })

    const suggestions = Array.isArray(aiResponse?.suggestions) ? aiResponse.suggestions : []

    debug.info('AI: suggest-steps response', {
      count: suggestions.length,
      example: suggestions[0]?.text || '(none)'
    })

    return res.status(200).json({ ok: true, suggestions })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    debug.error('AI: suggest-steps failed', { message })
    return res.status(500).json({ ok: false, error: 'AI generation failed' })
  }
}
