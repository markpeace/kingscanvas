'use client'

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

import type { FakeOpportunity } from '@/hooks/useFakeOpportunities'

type StepOpportunitiesModalProps = {
  isOpen: boolean
  onClose: () => void
  stepTitle: string
  opportunities: FakeOpportunity[]
}

export function StepOpportunitiesModal({
  isOpen,
  onClose,
  stepTitle,
  opportunities
}: StepOpportunitiesModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)

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
          {opportunities.length > 0 ? (
            <ul className="space-y-4">
              {opportunities.map((opportunity) => (
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
                  {(opportunity.form || opportunity.focus) && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
                      {opportunity.form && (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                          {opportunity.form}
                        </span>
                      )}
                      {opportunity.focus && (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                          {opportunity.focus}
                        </span>
                      )}
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
