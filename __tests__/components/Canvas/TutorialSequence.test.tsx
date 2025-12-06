import {
  handleDeleteStepsAndIntentionsNext,
  handleStepsAndSuggestionsNext
} from "@/components/Canvas/Canvas"
import type { TutorialMessageId } from "@/lib/tutorial/messages"

describe("Canvas tutorial sequencing helpers", () => {
  const buildDeps = (completed: TutorialMessageId[] = [], skippedAll = false) => {
    const completeStep = jest.fn()
    const showStep = jest.fn()
    const isStepCompleted = (id: TutorialMessageId) => completed.includes(id)

    return { completeStep, showStep, isStepCompleted, skippedAll }
  }

  it("advances from steps and suggestions to delete when needed", () => {
    const deps = buildDeps()

    handleStepsAndSuggestionsNext(deps)

    expect(deps.completeStep).toHaveBeenCalledWith("steps_and_suggestions")
    expect(deps.showStep).toHaveBeenCalledWith("delete_steps_and_intentions")
    expect(deps.showStep).not.toHaveBeenCalledWith("manual_add_step")
  })

  it("skips delete and shows manual add when the delete tip is done", () => {
    const deps = buildDeps(["delete_steps_and_intentions"])

    handleStepsAndSuggestionsNext(deps)

    expect(deps.completeStep).toHaveBeenCalledWith("steps_and_suggestions")
    expect(deps.showStep).toHaveBeenCalledWith("manual_add_step")
    expect(deps.showStep).not.toHaveBeenCalledWith("delete_steps_and_intentions")
  })

  it("does not advance past steps when follow-up tips are complete", () => {
    const deps = buildDeps(["delete_steps_and_intentions", "manual_add_step"])

    handleStepsAndSuggestionsNext(deps)

    expect(deps.completeStep).toHaveBeenCalledWith("steps_and_suggestions")
    expect(deps.showStep).not.toHaveBeenCalled()
  })

  it("chains delete into manual add when applicable", () => {
    const deps = buildDeps()

    handleDeleteStepsAndIntentionsNext(deps)

    expect(deps.completeStep).toHaveBeenCalledWith("delete_steps_and_intentions")
    expect(deps.showStep).toHaveBeenCalledWith("manual_add_step")
  })
})
