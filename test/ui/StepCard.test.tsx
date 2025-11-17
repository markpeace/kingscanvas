import { render } from '@testing-library/react'

import StepCard from '@/components/Canvas/StepCard'
import type { Step } from '@/types/canvas'
import { useOpportunities } from '@/hooks/useOpportunities'

jest.mock('@dnd-kit/core', () => ({
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null
  }),
  useDndContext: () => ({ active: null })
}))

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: jest.fn()
}))

jest.mock('@/hooks/useOpportunities', () => ({
  useOpportunities: jest.fn()
}))

describe('StepCard opportunities integration', () => {
  const useOpportunitiesMock = useOpportunities as unknown as jest.Mock
  const noop = () => {}

  beforeEach(() => {
    useOpportunitiesMock.mockReturnValue({
      opportunities: [],
      isLoading: false,
      error: null,
      refetch: jest.fn()
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('calls useOpportunities with the backend id when available', () => {
    const step: Step = {
      id: 'abc123',
      clientId: 'step-temp',
      intentionId: 'int-1',
      bucket: 'do-now',
      order: 1,
      title: 'Backend persisted step'
    }

    render(
      <StepCard
        step={step}
        onDelete={noop}
        onMoveForward={noop}
        onMoveBackward={noop}
      />
    )

    expect(useOpportunitiesMock).toHaveBeenCalled()
    expect(useOpportunitiesMock.mock.calls[0][0]).toBe('abc123')
  })

  it('does not call useOpportunities when no backend id exists', () => {
    const step: Step = {
      id: '',
      clientId: 'step-local',
      intentionId: 'int-1',
      bucket: 'do-now',
      order: 1,
      title: 'Local only'
    }

    render(
      <StepCard
        step={step}
        onDelete={noop}
        onMoveForward={noop}
        onMoveBackward={noop}
      />
    )

    expect(useOpportunitiesMock).not.toHaveBeenCalled()
  })

  it('does not call useOpportunities for suggested steps even with an id', () => {
    const step: Step = {
      id: 'persisted-1',
      clientId: 'step-suggested',
      intentionId: 'int-1',
      bucket: 'do-now',
      order: 1,
      title: 'AI suggestion',
      status: 'suggested'
    }

    render(
      <StepCard
        step={step}
        onDelete={noop}
        onMoveForward={noop}
        onMoveBackward={noop}
      />
    )

    expect(useOpportunitiesMock).not.toHaveBeenCalled()
  })
})
