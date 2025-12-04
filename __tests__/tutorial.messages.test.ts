import rawMessages from "@/config/tutorialMessages.v1.json"
import {
  getAllTutorialMessages,
  getTutorialMessage,
  tutorialMessageIdList
} from "@/lib/tutorial/messages"

describe("tutorial messages loader", () => {
  it("includes every tutorial message id from the JSON file", () => {
    const allMessages = getAllTutorialMessages()
    const ids = allMessages.map((message) => message.id).sort()

    expect(ids).toEqual([...tutorialMessageIdList].sort())
  })

  it("returns the expected persona intro copy", () => {
    const message = getTutorialMessage("persona_intro")
    const raw = rawMessages["persona_intro"]

    expect(message.headline).toBe(raw.headline)
    expect(message.body).toBe(raw.body)
  })
})
