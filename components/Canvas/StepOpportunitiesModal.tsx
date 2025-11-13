'use client'

import { useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'

import type { Opportunity } from '@/hooks/useOpportunities'

function formatOpportunityLabel(value: string | undefined): string {
  if (!value) {
    return ''
  }

  return value
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')
}

type StepOpportunitiesModalProps = {
  isOpen: boolean
  onClose: () => void
  stepTitle: string
  opportunities: Opportunity[]
  isLoading: boolean
  error: Error | null
  onRetry?: () => void
}

export function StepOpportunitiesModal({
  isOpen,
  onClose,
  stepTitle,
  opportunities,
  isLoading,
  error,
  onRetry
}: StepOpportunitiesModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  const formattedOpportunities = useMemo(() => {
    return opportunities.map((opportunity) => ({
      ...opportunity,
      formLabel: formatOpportunityLabel(opportunity.form),
      focusLabels: Array.isArray(opportunity.focus)
        ? opportunity.focus.map((focusItem) => formatOpportunityLabel(focusItem))
        : [],
    }))
  }, [opportunities])

  useEffect(() => {
    if (!isOpen) return

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
    if (!isOpen) return

    closeButtonRef.current?.focus()
  }, [isOpen])

  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="step-opportunities-title"
        className="w-full max-w-[560px] rounded-2xl border border-kings-grey-light/70 bg-kings-white p-6 shadow-2xl focus:outline-none"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="step-opportunities-title" className="text-xl font-semibold text-kings-red">
            Opportunities for “{stepTitle}”
          </h2>
          <button
            type="button"
            onClick={onClose}
            ref={closeButtonRef}
            className="inline-flex items-center rounded-md border border-transparent px-3 py-1.5 text-sm font-medium text-kings-grey-dark transition hover:text-kings-red focus:outline-none focus-visible:ring-2 focus-visible:ring-kings-red/40 focus-visible:ring-offset-2 focus-visible:ring-offset-kings-white"
          >
            Close
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {isLoading ? (
            <div className="rounded-xl border border-kings-grey-light/70 bg-kings-grey-light/10 p-6 text-center text-sm leading-relaxed text-slate-600">
              Loading opportunities...
            </div>
          ) : error ? (
            <div className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm leading-relaxed text-red-700">
              <p>We could not load opportunities for this step. Please try again later.</p>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="inline-flex items-center justify-center rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-red-50"
                >
                  Try again
                </button>
              )}
            </div>
          ) : formattedOpportunities.length > 0 ? (
            <ul className="space-y-4">
              {formattedOpportunities.map((opportunity) => (
                <li
                  key={opportunity.id}
                  className="rounded-xl border border-kings-grey-light/70 bg-white p-4 shadow-sm"
                >
                  <h3 className="text-base font-semibold text-slate-900">
                    {opportunity.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {opportunity.summary}
                  </p>
                  {(opportunity.formLabel || opportunity.focusLabels.length > 0) && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
                      {opportunity.formLabel && (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                          {opportunity.formLabel}
                        </span>
                      )}
                      {opportunity.focusLabels.map((focusLabel) => (
                        <span
                          key={`${opportunity.id}-${focusLabel}`}
                          className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600"
                        >
                          {focusLabel}
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-xl border border-dashed border-kings-grey-light/70 bg-kings-grey-light/10 p-6 text-center text-sm leading-relaxed text-slate-600">
              There are no opportunities for this step yet.
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center rounded-md border border-kings-red px-4 py-2 text-sm font-medium text-kings-red transition hover:bg-kings-red hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-kings-red/40 focus-visible:ring-offset-2 focus-visible:ring-offset-kings-white"
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
