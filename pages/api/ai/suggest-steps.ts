import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'

import { debug } from '@/lib/debug'
import { runWorkflow } from '@/lib/langgraph/workflow'
import { getStudentPersona, type StudentPersonaId } from '@/lib/context/studentPersonas'

import { authOptions } from '@/lib/auth/config'

type SuggestStepsRequestBody = {
  intentionId?: string
  intentionText?: string
  intentionBucket?: string
  historyAccepted?: string[]
  historyRejected?: string[]
  lastSuggestion?: string
  personaId?: StudentPersonaId
  fast?: boolean
}

type SuggestStepsResponse =
  | { ok: true; suggestions: Array<{ bucket: string; text: string }>; model: string }
  | { ok?: false; error: string }

function normaliseBooleanFlag(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const lower = value.trim().toLowerCase()
    if (['1', 'true', 'yes', 'on', 'fast'].includes(lower)) return true
    if (['0', 'false', 'no', 'off', 'slow'].includes(lower)) return false
  }

  return undefined
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

  const { intentionId, intentionText, intentionBucket, historyAccepted, historyRejected, lastSuggestion, personaId, fast } =
    req.body as SuggestStepsRequestBody
  const fastFlag = normaliseBooleanFlag(fast ?? (req.query?.fast as string | undefined))
  const envFast = process.env.LLM_FAST === 'true'
  const useFast = envFast ? true : fastFlag ?? true

  const persona = getStudentPersona(personaId)

  debug.trace('AI: suggest-steps request', {
    user: email,
    intentionId,
    intentionBucket,
    persona: persona.shortLabel,
    acceptedCount: historyAccepted?.length || 0,
    rejectedCount: historyRejected?.length || 0,
    fast: useFast
  })

  try {
    const aiResponse = await runWorkflow('suggest-step', {
      intentionText,
      intentionBucket,
      historyAccepted,
      historyRejected,
      lastSuggestion,
      persona,
      fast: useFast
    })

    const suggestions = Array.isArray(aiResponse?.suggestions) ? aiResponse.suggestions : []
    const model = aiResponse?.model ?? 'unknown'

    debug.info('AI: suggest-steps response', {
      model,
      count: suggestions.length,
      example: suggestions[0]?.text || '(none)',
      persona: persona.shortLabel
    })

    return res.status(200).json({
      ok: true,
      suggestions,
      model
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    const context = {
      user: email,
      intentionId,
      intentionBucket
    }

    if (message.includes('OPENAI_API_KEY is not set')) {
      debug.error('AI: suggest-steps misconfigured', { ...context, message })
      return res.status(503).json({ ok: false, error: 'AI is not configured' })
    }

    if (message.includes('LLM environment variable is not set')) {
      debug.error('AI: suggest-steps misconfigured', { ...context, message })
      return res.status(503).json({ ok: false, error: 'LLM environment variable is not set' })
    }

    debug.error('AI: suggest-steps failed', { ...context, message })
    return res.status(500).json({ ok: false, error: message })
  }
}
