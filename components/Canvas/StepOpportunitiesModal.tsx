'use client'

import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'

import type { Opportunity } from '@/types/canvas'

type StepOpportunitiesModalProps = {
  stepId: string
  stepTitle: string
  isOpen: boolean
  onClose: () => void
  opportunities: Opportunity[]
  isLoading: boolean
  error: Error | null
  onShuffle?: () => Promise<void> | void
  isShuffling?: boolean
  shuffleError?: string | null
}

export function StepOpportunitiesModal({
  stepId,
  stepTitle,
  isOpen,
  onClose,
  opportunities,
  isLoading,
  error,
  onShuffle,
  isShuffling = false,
  shuffleError = null
}: StepOpportunitiesModalProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const headingId = useId()
  const descriptionId = useId()

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

  const renderOpportunityPill = (source: Opportunity['source']) => {
    const isIndependent = source === 'independent'
    const label = isIndependent ? 'Independent' : 'Edge-style'
    const baseClasses =
      'inline-flex items-center rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide'
    const variantClasses = isIndependent
      ? 'border-slate-200 bg-slate-50 text-slate-600'
      : 'border-kings-red/30 bg-kings-red/5 text-kings-red'

    return <span className={`${baseClasses} ${variantClasses}`}>{label}</span>
  }

  const renderOpportunityList = (items: Opportunity[]) => (
    <ul className="mt-3 space-y-3" role="list">
      {items.map((opportunity) => (
        <li key={opportunity.id} className="rounded-lg border border-kings-grey-light/70 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-kings-black">{opportunity.title}</h3>
            {renderOpportunityPill(opportunity.source)}
          </div>
          {opportunity.summary ? (
            <p className="mt-2 text-sm leading-relaxed text-kings-grey-dark">{opportunity.summary}</p>
          ) : null}
        </li>
      ))}
    </ul>
  )

  const renderBody = () => {
    if (isLoading) {
      return (
        <p id={descriptionId} className="text-sm text-kings-grey-dark">
          Loading opportunities…
        </p>
      )
    }

    if (error) {
      return (
        <p id={descriptionId} className="text-sm text-red-600">
          We could not load opportunities for this step. Please try again later.
        </p>
      )
    }

    if (!opportunities.length) {
      return (
        <p id={descriptionId} className="text-sm text-kings-grey-dark">
          There are no opportunities for this step yet. When recommendations are available, they’ll appear here.
        </p>
      )
    }

    const edgeOpportunities = opportunities.filter((item) => item.source !== 'independent')
    const independentOpportunities = opportunities.filter((item) => item.source === 'independent')

    return (
      <div id={descriptionId} className="mt-4 space-y-6">
        {edgeOpportunities.length ? (
          <section>
            <p className="text-xs font-semibold uppercase tracking-wide text-kings-grey-dark">
              King's Edge style suggestions
            </p>
            {renderOpportunityList(edgeOpportunities)}
          </section>
        ) : null}

        {independentOpportunities.length ? (
          <section>
            <p className="text-xs font-semibold uppercase tracking-wide text-kings-grey-dark">Independent idea</p>
            {renderOpportunityList(independentOpportunities)}
          </section>
        ) : null}
      </div>
    )
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        aria-describedby={descriptionId}
        data-step-id={stepId}
        className="w-full max-w-[560px] rounded-2xl border border-kings-grey-light/70 bg-kings-white p-6 shadow-2xl focus:outline-none"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <h2
                id={headingId}
                ref={headingRef}
                tabIndex={-1}
                className="text-xl font-semibold text-kings-red focus:outline-none"
              >
                Opportunities for “{stepTitle}”
              </h2>
              {shuffleError ? (
                <p className="text-sm text-red-600">{shuffleError}</p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {onShuffle ? (
                <button
                  type="button"
                  onClick={() => {
                    void onShuffle()
                  }}
                  disabled={isShuffling || isLoading}
                  className="inline-flex items-center rounded-md border border-kings-grey-light bg-white px-3 py-1.5 text-sm font-medium text-kings-grey-dark shadow-sm transition hover:border-kings-grey hover:text-kings-red disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isShuffling ? 'Shuffling…' : 'Shuffle suggestions'}
                </button>
              ) : null}
              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                className="inline-flex items-center rounded-md border border-transparent px-3 py-1.5 text-sm font-medium text-kings-grey-dark transition hover:text-kings-red focus:outline-none focus-visible:ring-2 focus-visible:ring-kings-red/40 focus-visible:ring-offset-2 focus-visible:ring-offset-kings-white"
              >
                Close
              </button>
            </div>
          </div>
          <div className="text-left text-sm text-kings-black">{renderBody()}</div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default StepOpportunitiesModal
