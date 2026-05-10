import type { Document, InsertManyResult } from "mongodb"

import { debug } from "./debug"
import type { TutorialState } from "./tutorial/state"
import {
  createSuggestedStudentSteps,
  getStudentIntentions,
  getStudentOpportunitiesByStep,
  getStudentStepById,
  getStudentSteps,
  getStudentTutorialState,
  listRecentStudentStepHistory,
  replaceStudentOpportunitiesByStep,
  saveStudentIntentions,
  saveStudentTutorialState,
  updateStudentStepStatus,
  upsertStudentStep,
} from "./studentCanvas/repository"
import { canonicalOpportunityToUi, canonicalStepToUi } from "./studentCanvas/mappers"
import type { Opportunity } from "@/types/canvas"
import type {
  Intention as StudentCanvasIntention,
  Opportunity as StudentCanvasOpportunity,
} from "@/types/studentCanvasV1"

export type OpportunityDraft = Omit<
  Opportunity,
  "id" | "_id" | "stepId" | "createdAt" | "updatedAt"
>

/**
 * Fetch intentions for a given user.
 */
export async function getUserIntentions(email: string) {
  debug.trace("MongoDB: fetching intentions from student canvas", { user: email })
  const intentions = await getStudentIntentions(email)
  const tutorialState = await getStudentTutorialState(email)
  debug.info("MongoDB: fetch complete", { found: intentions.length > 0 })
  return { user: email, intentions, ...(tutorialState ? { tutorialState } : {}) }
}

/**
 * Save or update intentions for a given user.
 */
export async function saveUserIntentions(
  email: string,
  data: { intentions?: StudentCanvasIntention[] }
) {
  debug.trace("MongoDB: upserting intentions in student canvas", {
    user: email,
    keys: Object.keys(data || {}),
  })
  await saveStudentIntentions(email, data.intentions || [])
  debug.info("MongoDB: upsert result", { matched: 1, modified: 1, upserted: null })
}

export async function getUserTutorialState(email: string): Promise<TutorialState | undefined> {
  debug.trace("MongoDB: fetching tutorial state from student canvas", { user: email })
  const tutorialState = await getStudentTutorialState(email)
  debug.info("MongoDB: tutorial state fetch complete", { found: !!tutorialState })
  return tutorialState
}

export async function saveUserTutorialState(email: string, tutorialState: TutorialState) {
  debug.trace("MongoDB: updating tutorial state in student canvas", { user: email })
  await saveStudentTutorialState(email, tutorialState)
  debug.info("MongoDB: tutorial state update complete")
}

/**
 * Fetch steps for a given user.
 */
export async function getUserSteps(email: string) {
  debug.trace("MongoDB: fetching steps from student canvas", { user: email })
  const docs = await getStudentSteps(email)
  debug.info("MongoDB: fetch complete", { count: docs.length })
  return docs
}

/**
 * Save or update a step for a given user.
 */

export async function saveUserStep(email: string, step: any) {
  debug.trace("MongoDB: upserting step in student canvas", {
    user: email,
    stepId: step?.id ?? step?._id,
  })
  const result = await upsertStudentStep(email, step)
  debug.info("MongoDB: step upsert result", { matched: 1, modified: 1, upserted: null })
  return result
}

export async function createSuggestedSteps(
  user: string,
  intentionId: string,
  suggestions: any[]
): Promise<InsertManyResult<Document> | null> {
  if (!suggestions.length) {
    debug.warn("Mongo: createSuggestedSteps called with empty suggestions", { intentionId })
    return null
  }

  debug.trace("Mongo: inserting suggested steps in student canvas", {
    user,
    intentionId,
    count: suggestions.length,
  })
  const result = await createSuggestedStudentSteps(user, intentionId, suggestions)
  debug.info("Mongo: inserted suggested steps", { inserted: result.insertedIds.length })
  return {
    acknowledged: true,
    insertedCount: result.insertedIds.length,
    insertedIds: result.insertedIds as any,
  } as InsertManyResult<Document>
}

export async function updateStepStatus(user: string, stepId: any, status: string) {
  debug.trace("Mongo: updating step status in student canvas", { stepId, status })
  const updated = await updateStudentStepStatus(user, String(stepId), status)
  debug.info("Mongo: step status updated", { matched: updated ? 1 : 0 })
  return {
    acknowledged: true,
    matchedCount: updated ? 1 : 0,
    modifiedCount: updated ? 1 : 0,
    upsertedCount: 0,
    upsertedId: null,
  } as any
}

export async function getStepForUser(user: string, stepId: string) {
  debug.trace("Mongo: fetching step for user from student canvas", { user, stepId })
  const canonical = await getStudentStepById(user, stepId)
  if (!canonical) {
    debug.warn("Mongo: step not found for user", { user, stepId })
    return null
  }

  debug.info("Mongo: step found for user", { user, stepId })
  return { ...canonicalStepToUi(canonical, ""), _id: canonical.id, user }
}

function draftToCanonicalOpportunity(draft: OpportunityDraft): Partial<StudentCanvasOpportunity> {
  return {
    title: draft.title,
    description: draft.summary,
    decision_status: draft.status === "saved" ? "accepted" : "suggested",
    source: draft.source === "kings-edge-simulated" ? "catalogue" : "free_text",
    catalogue_ref:
      draft.source === "kings-edge-simulated"
        ? {
            system: "kings-edge-simulated",
            id: draft.title.toLowerCase().replace(/\s+/g, "-").slice(0, 64),
          }
        : undefined,
  }
}

export async function getOpportunitiesByStep(user: string, stepId: string): Promise<Opportunity[]> {
  const normalizedStepId = String(stepId)

  debug.trace("Mongo: fetching opportunities from student canvas", {
    user,
    stepId: normalizedStepId,
  })
  const opportunities = await getStudentOpportunitiesByStep(user, normalizedStepId)
  const mapped = opportunities.map((opportunity) =>
    canonicalOpportunityToUi(opportunity, normalizedStepId)
  )

  debug.info("Mongo: opportunities fetched", {
    user,
    stepId: normalizedStepId,
    count: mapped.length,
  })

  return mapped
}

export async function createOpportunitiesForStep(
  user: string,
  stepId: string,
  drafts: OpportunityDraft[]
): Promise<Opportunity[]> {
  if (!Array.isArray(drafts) || drafts.length === 0) {
    debug.warn("Mongo: createOpportunitiesForStep called with no drafts", { user, stepId })
    return []
  }

  const normalizedStepId = String(stepId)
  debug.trace("Mongo: replacing opportunities in student canvas", {
    user,
    stepId: normalizedStepId,
    count: drafts.length,
  })

  const createdCanonical = await replaceStudentOpportunitiesByStep(
    user,
    normalizedStepId,
    drafts.map(draftToCanonicalOpportunity)
  )
  const created = createdCanonical.map((opportunity) =>
    canonicalOpportunityToUi(opportunity, normalizedStepId)
  )

  debug.info("Mongo: opportunities inserted", {
    user,
    stepId: normalizedStepId,
    count: created.length,
  })

  return created
}

export async function deleteOpportunitiesForStep(user: string, stepId: string): Promise<void> {
  const normalizedStepId = String(stepId)

  debug.trace("Mongo: deleting opportunities from student canvas", {
    user,
    stepId: normalizedStepId,
  })
  await replaceStudentOpportunitiesByStep(user, normalizedStepId, [])
  debug.info("Mongo: opportunities deleted", { user, stepId: normalizedStepId })
}

export async function listRecentHistory(user: string, intentionId: string, limit = 25) {
  debug.trace("Mongo: fetching recent step history from student canvas", { user, intentionId })
  const history = await listRecentStudentStepHistory(user, intentionId, limit)
  debug.info("Mongo: step history loaded", {
    accepted: history.accepted.length,
    rejected: history.rejected.length,
  })
  return history
}
