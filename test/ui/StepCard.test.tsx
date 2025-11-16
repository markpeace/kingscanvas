import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import StepCard from '@/components/Canvas/StepCard'
import type { Opportunity, Step } from '@/types/canvas'
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
  const persistedStep: Step = {
    id: 'abc123',
    clientId: 'step-temp',
    intentionId: 'int-1',
    bucket: 'do-now',
    order: 1,
    title: 'Backend persisted step'
  }
  const defaultOpportunities: Opportunity[] = [
    {
      id: 'opp-1',
      stepId: persistedStep.id,
      title: 'Simulated networking session',
      summary: 'Connect with peers to swap career tactics.',
      source: 'kings-edge-simulated',
      form: 'networking',
      focus: 'community',
      status: 'suggested'
    },
    {
      id: 'opp-2',
      stepId: persistedStep.id,
      title: 'Edge reflection lab',
      summary: 'Guided journaling with mentors.',
      source: 'kings-edge-simulated',
      form: 'workshop',
      focus: 'reflection',
      status: 'suggested'
    },
    {
      id: 'opp-3',
      stepId: persistedStep.id,
      title: 'Edge micro coaching',
      summary: 'Short-form coaching to unblock the next action.',
      source: 'kings-edge-simulated',
      form: 'coaching',
      focus: 'skills',
      status: 'suggested'
    },
    {
      id: 'opp-4',
      stepId: persistedStep.id,
      title: 'Independent deep dive',
      summary: 'Solo research sprint to explore adjacent themes.',
      source: 'independent',
      form: 'project',
      focus: 'experience',
      status: 'suggested'
    }
  ]
  const originalFetch = global.fetch

  beforeEach(() => {
    useOpportunitiesMock.mockReturnValue({
      opportunities: [],
      isLoading: false,
      error: null,
      refresh: jest.fn(),
      replace: jest.fn()
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
    global.fetch = originalFetch
  })

  it('calls useOpportunities with the backend id when available', () => {
    render(
      <StepCard
        step={persistedStep}
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

  it('closes the opportunities modal when the Close button is pressed', async () => {
    useOpportunitiesMock.mockReturnValue({
      opportunities: defaultOpportunities,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
      replace: jest.fn()
    })

    render(
      <StepCard
        step={persistedStep}
        onDelete={noop}
        onMoveForward={noop}
        onMoveBackward={noop}
      />
    )

    const badgeButton = screen.getByRole('button', { name: /opportunit/i })
    fireEvent.click(badgeButton)

    const dialog = await screen.findByRole('dialog', { name: /Opportunities for/ })
    expect(dialog).toBeInTheDocument()

    const closeButton = screen.getByRole('button', { name: 'Close' })
    fireEvent.click(closeButton)

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /Opportunities for/ })).not.toBeInTheDocument()
    })
  })

  it('shuffles opportunities via the modal control', async () => {
    const replace = jest.fn()
    const refresh = jest.fn()
    useOpportunitiesMock.mockReturnValue({
      opportunities: defaultOpportunities,
      isLoading: false,
      error: null,
      refresh,
      replace
    })

    const shuffledOpportunities: Opportunity[] = [
      {
        id: 'opp-new-1',
        stepId: persistedStep.id,
        title: 'Edge strategy sprint',
        summary: 'Rapid ideation clinic to rethink your tactic.',
        source: 'kings-edge-simulated',
        form: 'workshop',
        focus: 'planning',
        status: 'suggested'
      },
      {
        id: 'opp-new-2',
        stepId: persistedStep.id,
        title: 'Independent insight share',
        summary: 'Host a short session to unpack your latest findings.',
        source: 'independent',
        form: 'project',
        focus: 'experience',
        status: 'suggested'
      }
    ]

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, opportunities: shuffledOpportunities })
    })
    global.fetch = fetchMock as typeof fetch

    render(
      <StepCard
        step={persistedStep}
        onDelete={noop}
        onMoveForward={noop}
        onMoveBackward={noop}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /opportunit/i }))

    const shuffleButton = await screen.findByRole('button', { name: /Shuffle suggestions/i })
    fireEvent.click(shuffleButton)

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith(shuffledOpportunities)
    })

    expect(fetchMock).toHaveBeenCalledWith(
      `/api/steps/${encodeURIComponent(persistedStep.id)}/opportunities/shuffle`,
      { method: 'POST' }
    )
    expect(refresh).not.toHaveBeenCalled()
  })
})
