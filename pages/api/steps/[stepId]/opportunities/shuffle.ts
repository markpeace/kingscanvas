import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'

import { authOptions, createTestSession, isProd } from '@/lib/auth/config'
import { debug } from '@/lib/debug'
import { getStudentPersona } from '@/lib/context/studentPersonas'
import { isStepEligibleForOpportunities } from '@/lib/opportunities/eligibility'
import { findStepById, generateOpportunitiesForStep, StepNotFoundError } from '@/lib/opportunities/generation'
import { uiOpportunityToCanonical } from '@/lib/studentCanvas/mappers'
import type { OpportunityApiItem } from '@/types/canvas'

type ShuffleOpportunitiesResponse =
  | { ok: true; stepId: string; opportunities: OpportunityApiItem[] }
  | { ok: false; error: string }

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ShuffleOpportunitiesResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  const session = isProd ? await getServerSession(req, res, authOptions) : createTestSession()
  const email = session?.user?.email ?? null

  if (!email) {
    debug.error('Opportunities API: shuffle unauthenticated')
    return res.status(401).json({ ok: false, error: 'Not authenticated' })
  }

  const stepIdParam = req.query.stepId
  const requestedStepId = typeof stepIdParam === 'string' ? stepIdParam : ''

  if (!requestedStepId) {
    debug.error('Opportunities API: shuffle missing step id', { user: email, hasParam: Boolean(stepIdParam) })
    return res.status(400).json({ ok: false, error: 'Missing step id' })
  }

  const persona = getStudentPersona(
    typeof req.body?.personaId === 'string'
      ? req.body.personaId
      : Array.isArray(req.query.personaId)
      ? req.query.personaId[0]
      : typeof req.query.personaId === 'string'
      ? req.query.personaId
      : undefined
  )

  debug.info('Opportunities API: shuffle requested', { stepId: requestedStepId, persona: persona.shortLabel })

  try {
    const step = await findStepById(requestedStepId, email)

    if (!step) {
      debug.warn('Opportunities API: shuffle step not found', { user: email, stepId: requestedStepId })
      return res.status(404).json({ ok: false, error: 'Step not found' })
    }

    if (typeof step.user !== 'string' || step.user !== email) {
      debug.warn('Opportunities API: shuffle forbidden', { user: email, stepId: requestedStepId })
      return res.status(403).json({ ok: false, error: 'Forbidden' })
    }

    if (!isStepEligibleForOpportunities(step as { id?: string; status?: string; _id?: unknown })) {
      debug.info('Opportunities API: shuffle ineligible', {
        user: email,
        stepId: requestedStepId,
        status: step?.status ?? null
      })
      return res.status(400).json({ ok: false, error: 'Step is not eligible for opportunities' })
    }

    const uiOpportunities = await generateOpportunitiesForStep({ stepId: requestedStepId, origin: 'shuffle', studentId: email, persona })
    const opportunities = uiOpportunities.map((opportunity) => uiOpportunityToCanonical(opportunity))

    const responseStepId =
      (step._id && typeof step._id === 'object' && 'toHexString' in step._id && typeof step._id.toHexString === 'function'
        ? step._id.toHexString()
        : typeof step._id === 'string' && step._id.trim().length > 0
        ? step._id
        : typeof step.id === 'string' && step.id.trim().length > 0
        ? step.id
        : requestedStepId)

    debug.info('Opportunities API: shuffle success', {
      stepId: responseStepId,
      count: opportunities.length,
      persona: persona.shortLabel
    })

    return res.status(200).json({ ok: true, stepId: responseStepId, opportunities })
  } catch (error) {
    if (error instanceof StepNotFoundError) {
      debug.warn('Opportunities API: shuffle helper missing step', {
        user: email,
        stepId: requestedStepId
      })
      return res.status(404).json({ ok: false, error: 'Step not found' })
    }

    debug.error('Opportunities API: shuffle failed', {
      stepId: requestedStepId,
      error
    })

    return res.status(500).json({ ok: false, error: 'Could not generate opportunities for this step' })
  }
}
