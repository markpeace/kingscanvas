export type TutorialStepState = {
  completedAt?: string
  dismissedAt?: string
  skipped?: boolean
}

export type TutorialState = {
  persona_intro?: TutorialStepState
  first_intention?: TutorialStepState
  steps_and_suggestions?: TutorialStepState
  opportunities_intro?: TutorialStepState
  opportunities_shuffle?: TutorialStepState
  skippedAll?: boolean
}

export const defaultTutorialState: TutorialState = { skippedAll: false }
