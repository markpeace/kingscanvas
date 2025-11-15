import { render, screen } from "@testing-library/react"

import StepCard from "@/components/Canvas/StepCard"
import type { Step } from "@/types/canvas"

jest.mock("@/components/Canvas/EditModal", () => ({
  EditModal: () => null
}))

const stepOpportunitiesModalSpy = jest.fn(() => null)

jest.mock("@/components/Canvas/StepOpportunitiesModal", () => ({
  StepOpportunitiesModal: (props: any) => {
    stepOpportunitiesModalSpy(props)
    return null
  }
}))

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: jest.fn()
}))

jest.mock("@dnd-kit/core", () => ({
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null
  }),
  useDndContext: () => ({ active: null })
}))

jest.mock("@/hooks/useOpportunities", () => ({
  useOpportunities: jest.fn()
}))

const mockUseOpportunities = jest.requireMock("@/hooks/useOpportunities").useOpportunities as jest.Mock

const baseStep: Step = {
  id: "step-temp",
  intentionId: "int-1",
  title: "Test step",
  bucket: "do-now",
  order: 1
}

describe("StepCard opportunities integration", () => {
  const renderStep = (step: Step) =>
    render(
      <StepCard
        step={step}
        onDelete={jest.fn()}
        onMoveForward={jest.fn()}
        onMoveBackward={jest.fn()}
        onAccept={jest.fn()}
        onReject={jest.fn()}
      />
    )

  beforeEach(() => {
    mockUseOpportunities.mockReturnValue({
      opportunities: [],
      isLoading: false,
      error: null
    })
    stepOpportunitiesModalSpy.mockClear()
  })

  afterEach(() => {
    mockUseOpportunities.mockReset()
  })

  it("shows the Suggested label for ghost AI placeholders", () => {
    const step: Step = {
      ...baseStep,
      status: "ghost"
    }

    renderStep(step)

    expect(mockUseOpportunities).toHaveBeenCalledWith(null)
    expect(stepOpportunitiesModalSpy).not.toHaveBeenCalled()
    expect(screen.getByText("Suggested")).toBeInTheDocument()
  })

  it("skips opportunities for suggested steps even when a persisted id exists", () => {
    const step: Step = {
      ...baseStep,
      _id: "6653c14e7c2a4a0012345678",
      status: "suggested"
    }

    renderStep(step)

    expect(mockUseOpportunities).toHaveBeenCalledWith(null)
    expect(stepOpportunitiesModalSpy).not.toHaveBeenCalled()
    expect(screen.getByText("Suggested")).toBeInTheDocument()
  })

  it("uses the persisted id when rendering real steps", () => {
    const step: Step = {
      ...baseStep,
      _id: "6653c14e7c2a4a0012345678",
      status: "accepted"
    }

    renderStep(step)

    expect(mockUseOpportunities).toHaveBeenCalledWith("6653c14e7c2a4a0012345678")
    expect(stepOpportunitiesModalSpy).toHaveBeenCalledWith(
      expect.objectContaining({ stepId: "6653c14e7c2a4a0012345678" })
    )
  })

  it("does not call the hook when only a temporary id is available", () => {
    const step: Step = {
      ...baseStep,
      status: "accepted",
      id: "step-123"
    }

    renderStep(step)

    expect(mockUseOpportunities).toHaveBeenCalledWith(null)
    expect(stepOpportunitiesModalSpy).not.toHaveBeenCalled()
    expect(screen.queryByText("Suggested")).not.toBeInTheDocument()
  })
})
