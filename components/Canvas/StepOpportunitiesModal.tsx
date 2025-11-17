'use client'

import { useEffect, useId, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { createPortal } from 'react-dom'

import type { Opportunity } from '@/types/canvas'
import { debug } from '@/lib/debug'

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
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-sm"
      role="presentation"
      onPointerDown={handleOverlayPointerDown}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        aria-describedby={descriptionId}
        data-step-id={stepId}
        className="pointer-events-auto w-full max-w-[560px] rounded-2xl border border-kings-grey-light/70 bg-kings-white p-6 shadow-2xl focus:outline-none"
        onPointerDown={handleDialogPointerDown}
      >
        <div className="flex flex-col gap-4">
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
          <div className="text-left text-sm text-kings-black">{renderBody()}</div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default StepOpportunitiesModal
