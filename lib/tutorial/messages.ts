import rawMessages from "@/config/tutorialMessages.v1.json"

export type TutorialMessageId =
  | "canvas_intro_1"
  | "canvas_intro_2"
  | "canvas_intro_3"
  | "persona_intro"
  | "first_intention"
  | "steps_and_suggestions"
  | "manual_add_step"
  | "opportunities_intro"
  | "opportunities_shuffle"
  | "opportunities_autogenerating"
  | "opportunities_ready"
  | "delete_steps_and_intentions"

export type TutorialMessage = {
  id: TutorialMessageId
  headline: string
  body: string
}

type RawMessage = { headline: string; body: string }
type RawMessageMap = Record<string, RawMessage>

const tutorialMessageIds = [
  "canvas_intro_1",
  "canvas_intro_2",
  "canvas_intro_3",
  "persona_intro",
  "first_intention",
  "steps_and_suggestions",
  "manual_add_step",
  "opportunities_intro",
  "opportunities_shuffle",
  "opportunities_autogenerating",
  "opportunities_ready",
  "delete_steps_and_intentions"
] as const satisfies TutorialMessageId[]

const isProduction = process.env.NODE_ENV === "production"

function validateMessages(raw: RawMessageMap): asserts raw is Record<TutorialMessageId, RawMessage> {
  if (isProduction) {
    return
  }

  const missingIds = tutorialMessageIds.filter((id) => !raw[id])

  if (missingIds.length > 0) {
    throw new Error(`Missing tutorial messages for ids: ${missingIds.join(", ")}`)
  }

  const extraKeys = Object.keys(raw).filter(
    (key): key is string => !tutorialMessageIds.includes(key as TutorialMessageId)
  )

  if (extraKeys.length > 0) {
    // eslint-disable-next-line no-console
    console.warn(`Found extra tutorial message keys not in TutorialMessageId union: ${extraKeys.join(", ")}`)
  }
}

function mapMessages(raw: RawMessageMap): Record<TutorialMessageId, TutorialMessage> {
  validateMessages(raw)

  return tutorialMessageIds.reduce<Record<TutorialMessageId, TutorialMessage>>((acc, id) => {
    const entry = raw[id]

    if (!entry) {
      if (!isProduction) {
        throw new Error(`Missing tutorial message for id "${id}".`)
      }

      return acc
    }

    acc[id] = { id, headline: entry.headline, body: entry.body }
    return acc
  }, {} as Record<TutorialMessageId, TutorialMessage>)
}

const tutorialMessages = mapMessages(rawMessages as RawMessageMap)

export function getTutorialMessage(id: TutorialMessageId): TutorialMessage {
  const message = tutorialMessages[id]

  if (!message) {
    throw new Error(`Missing tutorial message for id "${id}".`)
  }

  return message
}

export function getAllTutorialMessages(): TutorialMessage[] {
  return tutorialMessageIds.map((id) => tutorialMessages[id]).filter(Boolean)
}

export const tutorialMessageIdList: TutorialMessageId[] = [...tutorialMessageIds]
