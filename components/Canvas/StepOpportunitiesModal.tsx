'use client'

import { useEffect, useId, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { createPortal } from 'react-dom'

import type { Opportunity } from '@/types/canvas'
import { debug } from '@/lib/debug'

type OpportunityVariant = 'edge' | 'independent'

function getVariantFromOpportunity(opportunity: Opportunity): OpportunityVariant {
  return opportunity.source === 'independent' ? 'independent' : 'edge'
}

type OpportunityListItemProps = {
  opportunity: Opportunity
  variant: OpportunityVariant
}

function OpportunityListItem({ opportunity, variant }: OpportunityListItemProps) {
  const isIndependent = variant === 'independent'

  return (
    <li
      className={`rounded-xl border p-4 shadow-sm ${
        isIndependent ? 'border-kings-grey-light bg-kings-grey-light/20' : 'border-kings-grey-light/70 bg-white'
      }`}
    >
      <h3 className="text-sm font-semibold text-kings-black">{opportunity.title}</h3>
      {opportunity.summary ? (
        <p className="mt-2 text-sm leading-relaxed text-kings-grey-dark">{opportunity.summary}</p>
      ) : null}
    </li>
  )
}

type OpportunityListProps = {
  opportunities: Opportunity[]
  variant: OpportunityVariant
}

function OpportunityList({ opportunities, variant }: OpportunityListProps) {
  if (!opportunities.length) {
    return null
  }

  return (
    <ul className="space-y-4" role="list">
      {opportunities.map((opportunity) => (
        <OpportunityListItem key={opportunity.id} opportunity={opportunity} variant={variant} />
      ))}
    </ul>
  )
}

type StepOpportunitiesModalProps = {
  stepId: string
  stepTitle: string
  isOpen: boolean
  onClose: () => void
  opportunities: Opportunity[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<Opportunity[]>
}

export function StepOpportunitiesModal({
  stepId,
  stepTitle,
  isOpen,
  onClose,
  opportunities,
  isLoading,
  error,
  refetch
}: StepOpportunitiesModalProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const headingId = useId()
  const descriptionId = useId()
  const [isShuffling, setIsShuffling] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const focusTarget = headingRef.current ?? closeButtonRef.current
    focusTarget?.focus()
  }, [isOpen])

  if (!isOpen) {
    return null
  }

  const isBusy = isLoading || isShuffling

  const handleCloseClick = () => {
    debug.info('Opportunities UI: close clicked', { stepId })
    onClose()
  }

  const handleOverlayPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.stopPropagation()

    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  const handleDialogPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.stopPropagation()
  }

  const handleShuffleClick = async () => {
    if (isShuffling) {
      return
    }

    debug.info('Opportunities UI: shuffle clicked', { stepId })
    setIsShuffling(true)

    try {
      const response = await fetch(`/api/steps/${encodeURIComponent(stepId)}/opportunities/shuffle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        debug.error('Opportunities UI: shuffle failed', { stepId, status: response.status })
        return
      }

      try {
        await refetch()
        debug.info('Opportunities UI: shuffle complete', { stepId })
      } catch (err) {
        debug.error('Opportunities UI: shuffle refetch failed', {
          stepId,
          error: err instanceof Error ? err.message : String(err)
        })
      }
    } catch (error) {
      debug.error('Opportunities UI: shuffle error', {
        stepId,
        error: error instanceof Error ? error.message : String(error)
      })
    } finally {
      setIsShuffling(false)
    }
  }

  const renderBody = () => {
    if (isBusy) {
      return <p className="text-sm text-kings-grey-dark">Loading opportunities…</p>
    }

    if (error) {
      return (
        <p className="text-sm text-red-600">
          We could not load opportunities for this step. Please try again later.
        </p>
      )
    }

    if (!opportunities.length) {
      return (
        <p className="text-sm text-kings-grey-dark">
          There are no opportunities for this step yet. When recommendations are available, they’ll appear here.
        </p>
      )
    }

    const edgeOpportunities = opportunities.filter(
      (opportunity) => getVariantFromOpportunity(opportunity) === 'edge'
    )
    const independentOpportunities = opportunities.filter(
      (opportunity) => getVariantFromOpportunity(opportunity) === 'independent'
    )

    return (
      <div className="space-y-8">
        {edgeOpportunities.length ? (
          <section aria-label="Things you can do in Edge" className="space-y-4">
            <h3 className="text-sm font-semibold text-kings-black">Things you can do in Edge</h3>
            <OpportunityList opportunities={edgeOpportunities} variant="edge" />
          </section>
        ) : null}
        {independentOpportunities.length ? (
          <section aria-label="Things you can do independently" className="space-y-4">
            <h3 className="text-sm font-semibold text-kings-black">Things you can do independently</h3>
            <OpportunityList opportunities={independentOpportunities} variant="independent" />
          </section>
        ) : null}
      </div>
    )
  }

  const bodyContent = renderBody()

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-black/40 px-4 py-6 backdrop-blur-sm"
      role="presentation"
      onPointerDown={handleOverlayPointerDown}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        aria-describedby={descriptionId}
        data-step-id={stepId}
        className="pointer-events-auto flex w-full max-h-[80vh] max-w-[560px] flex-col rounded-2xl border border-kings-grey-light/70 bg-kings-white shadow-2xl focus:outline-none"
        onPointerDown={handleDialogPointerDown}
      >
        <div className="flex flex-1 flex-col gap-6 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h2
              id={headingId}
              ref={headingRef}
              tabIndex={-1}
              className="text-xl font-semibold text-kings-red focus:outline-none"
            >
              Opportunities for “{stepTitle}”
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleShuffleClick}
                disabled={isBusy}
                className="inline-flex items-center rounded-md border border-kings-grey-light/80 bg-white px-3 py-1.5 text-sm font-medium text-kings-grey-dark transition hover:border-kings-grey disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isShuffling ? 'Shuffling…' : 'Shuffle suggestions'}
              </button>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={handleCloseClick}
                className="inline-flex items-center rounded-md border border-transparent px-3 py-1.5 text-sm font-medium text-kings-grey-dark transition hover:text-kings-red focus:outline-none focus-visible:ring-2 focus-visible:ring-kings-red/40 focus-visible:ring-offset-2 focus-visible:ring-offset-kings-white"
              >
                Close
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <div
              id={descriptionId}
              className="h-full overflow-y-auto pr-1 text-left text-sm text-kings-black"
            >
              {bodyContent}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default StepOpportunitiesModal
