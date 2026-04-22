import type { NextApiRequest, NextApiResponse } from "next"
import { getServerSession } from "next-auth"

import { authOptions, createTestSession, isProd } from "@/lib/auth/config"
import { debug } from "@/lib/debug"
import { tutorialMessageIdList, type TutorialMessageId } from "@/lib/tutorial/messages"
import { defaultTutorialState, type TutorialState, type TutorialStepState } from "@/lib/tutorial/state"
import { getStudentTutorialState, saveStudentTutorialState } from "@/lib/studentCanvas/repository"

type TutorialActionPayload =
  | { action: "completeStep"; stepId: TutorialMessageId }
  | { action: "dismissStep"; stepId: TutorialMessageId }
  | { action: "skipAll" }
  | { action: "resetAll" }

function isValidStepId(stepId: unknown): stepId is TutorialMessageId {
  return typeof stepId === "string" && tutorialMessageIdList.includes(stepId as TutorialMessageId)
}

function mergeWithDefault(state: TutorialState | undefined): TutorialState {
  return { ...defaultTutorialState, ...(state ?? {}) }
}

function upsertStepState(state: TutorialState, stepId: TutorialMessageId): TutorialStepState {
  const existing = state[stepId] ?? {}
  state[stepId] = { ...existing }
  return state[stepId] as TutorialStepState
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = isProd ? await getServerSession(req, res, authOptions) : createTestSession()
  const email = session?.user?.email ?? null

  if (!email) {
    debug.error("Tutorial API: unauthenticated request")
    return res.status(401).json({ error: "Not authenticated" })
  }

  try {
    if (req.method === "GET") {
      debug.trace("Tutorial API: GET", { user: email })
      const tutorialState = mergeWithDefault(await getStudentTutorialState(email))
      debug.info("Tutorial API: GET complete", { hasState: !!tutorialState })
      return res.status(200).json(tutorialState)
    }

    if (req.method === "POST") {
      const payload = req.body as TutorialActionPayload | undefined
      const action = payload?.action

      if (!action) {
        debug.error("Tutorial API: missing action", { user: email })
        return res.status(400).json({ error: "Missing action" })
      }

      let tutorialState = mergeWithDefault(await getStudentTutorialState(email))
      const now = new Date().toISOString()

      if (action === "completeStep") {
        if (!isValidStepId(payload.stepId)) {
          debug.error("Tutorial API: invalid step id for completion", { user: email, stepId: payload.stepId })
          return res.status(400).json({ error: "Invalid step id" })
        }

        const stepState = upsertStepState(tutorialState, payload.stepId)
        stepState.completedAt = now
        if ("skipped" in stepState) {
          delete stepState.skipped
        }
      } else if (action === "dismissStep") {
        if (!isValidStepId(payload.stepId)) {
          debug.error("Tutorial API: invalid step id for dismiss", { user: email, stepId: payload.stepId })
          return res.status(400).json({ error: "Invalid step id" })
        }

        const stepState = upsertStepState(tutorialState, payload.stepId)
        stepState.dismissedAt = now
      } else if (action === "skipAll") {
        tutorialState.skippedAll = true
      } else if (action === "resetAll") {
        tutorialState = { ...defaultTutorialState }
      } else {
        debug.error("Tutorial API: unknown action", { user: email, action })
        return res.status(400).json({ error: "Invalid action" })
      }

      await saveStudentTutorialState(email, tutorialState)
      debug.info("Tutorial API: state updated", { user: email, action })
      return res.status(200).json(tutorialState)
    }

    return res.status(405).json({ error: "Method not allowed" })
  } catch (error) {
    debug.error("Tutorial API: server error", {
      message: error instanceof Error ? error.message : String(error)
    })
    return res.status(500).json({ error: "Server error" })
  }
}
