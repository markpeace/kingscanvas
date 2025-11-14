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
}

export function StepOpportunitiesModal({
  stepId,
  stepTitle,
  isOpen,
  onClose,
  opportunities,
  isLoading,
  error
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

    return (
      <ul
        id={descriptionId}
        className="mt-4 space-y-4"
        role="list"
      >
        {opportunities.map((opportunity) => (
          <li
            key={opportunity.id}
            className="rounded-lg border border-kings-grey-light/70 bg-white p-4 shadow-sm"
          >
            <h3 className="text-sm font-semibold text-kings-black">{opportunity.title}</h3>
            {opportunity.summary ? (
              <p className="mt-2 text-sm leading-relaxed text-kings-grey-dark">{opportunity.summary}</p>
            ) : null}
          </li>
        ))}
      </ul>
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
        <div className="flex items-start justify-between gap-4">
          <h2
            id={headingId}
            ref={headingRef}
            tabIndex={-1}
            className="text-xl font-semibold text-kings-red focus:outline-none"
          >
            Opportunities for “{stepTitle}”
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="inline-flex items-center rounded-md border border-transparent px-3 py-1.5 text-sm font-medium text-kings-grey-dark transition hover:text-kings-red focus:outline-none focus-visible:ring-2 focus-visible:ring-kings-red/40 focus-visible:ring-offset-2 focus-visible:ring-offset-kings-white"
          >
            Close
          </button>
        </div>
        <div className="mt-4 text-left text-sm text-kings-black">{renderBody()}</div>
      </div>
    </div>,
    document.body
  )
}

export default StepOpportunitiesModal
