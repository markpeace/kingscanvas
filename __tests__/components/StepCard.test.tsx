import { render } from '@testing-library/react'
import React from 'react'

import { StepCard } from '@/components/Canvas/StepCard'
import type { Step } from '@/types/canvas'

const mockUseOpportunities = jest.fn()

jest.mock('@dnd-kit/core', () => ({
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
  }),
  useDndContext: () => ({ active: null }),
}))

jest.mock('react-hot-toast', () => {
  const toastFn = Object.assign(jest.fn(), {
    success: jest.fn(),
    error: jest.fn(),
  })

  return {
    __esModule: true,
    default: toastFn,
  }
})

jest.mock('@/components/Canvas/EditModal', () => ({
  EditModal: () => null,
}))

jest.mock('@/components/Canvas/StepOpportunitiesModal', () => ({
  StepOpportunitiesModal: () => null,
}))

jest.mock('@/hooks/useOpportunities', () => ({
  useOpportunities: (...args: unknown[]) => mockUseOpportunities(...args),
}))

describe('StepCard opportunities wiring', () => {
  const baseStep: Step = {
    id: 'step-temp',
    intentionId: 'int-1',
    title: 'Draft step',
    bucket: 'do-now',
    order: 1,
  }

  beforeEach(() => {
    mockUseOpportunities.mockReset()
    mockUseOpportunities.mockReturnValue({
      opportunities: [],
      isLoading: false,
      error: null,
    })
  })

  const renderComponent = (step: Step) =>
    render(
      <StepCard
        step={step}
        onDelete={jest.fn()}
        onMoveForward={jest.fn()}
        onMoveBackward={jest.fn()}
      />
    )

  it('uses the persisted step _id when present', () => {
    const stepWithPersistedId: Step = {
      ...baseStep,
      _id: '507f1f77bcf86cd799439011',
    }

    renderComponent(stepWithPersistedId)

    expect(mockUseOpportunities).toHaveBeenCalledWith('507f1f77bcf86cd799439011')
  })

  it('suppresses opportunities loading when only a client id exists', () => {
    const ephemeralStep: Step = {
      ...baseStep,
      id: 'step-123456789',
    }

    renderComponent(ephemeralStep)

    expect(mockUseOpportunities).toHaveBeenCalledWith(null)
  })
})
