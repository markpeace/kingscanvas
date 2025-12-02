import type { TutorialMessageId } from "./messages"

export type TutorialStepState = {
  completedAt?: string
  dismissedAt?: string
  skipped?: boolean
}

export type TutorialState = {
  skippedAll?: boolean
} & Partial<Record<TutorialMessageId, TutorialStepState>>

export const defaultTutorialState: TutorialState = { skippedAll: false }
