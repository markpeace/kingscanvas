"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"

import { getTutorialMessage, type TutorialMessageId } from "@/lib/tutorial/messages"

type TutorialCalloutProps = {
  targetRef: React.RefObject<HTMLElement>
  stepId: TutorialMessageId
  onNext: () => void
  onSkipAll: () => void
  onRemindLater: () => void
  dimBackground?: boolean
}

type Position = {
  top: number
  left: number
}

export function TutorialCallout({
  targetRef,
  stepId,
  onNext,
  onSkipAll,
  onRemindLater,
  dimBackground = true
}: TutorialCalloutProps) {
  const [position, setPosition] = useState<Position | null>(null)
  const [mounted, setMounted] = useState(false)
  const nextButtonRef = useRef<HTMLButtonElement | null>(null)
  const message = useMemo(() => getTutorialMessage(stepId), [stepId])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) {
      return
    }

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onRemindLater()
      }
    }

    window.addEventListener("keydown", handleKeydown)

    return () => {
      window.removeEventListener("keydown", handleKeydown)
    }
  }, [mounted, onRemindLater])

  useEffect(() => {
    if (!mounted) {
      return
    }

    const updatePosition = () => {
      const target = targetRef.current

      if (!target) {
        setPosition(null)
        return
      }

      const rect = target.getBoundingClientRect()
      const calloutWidth = 320
      const horizontalPadding = 12
      const viewportWidth = window.innerWidth
      const left = Math.min(Math.max(rect.left, horizontalPadding), viewportWidth - calloutWidth - horizontalPadding)
      const top = rect.bottom + 12

      setPosition({ top, left })
    }

    updatePosition()
    window.addEventListener("resize", updatePosition)
    window.addEventListener("scroll", updatePosition, true)

    return () => {
      window.removeEventListener("resize", updatePosition)
      window.removeEventListener("scroll", updatePosition, true)
    }
  }, [mounted, targetRef])

  useEffect(() => {
    if (mounted && nextButtonRef.current) {
      nextButtonRef.current.focus({ preventScroll: true })
    }
  }, [mounted])

  if (!mounted || !position) {
    return null
  }

  const calloutContent = (
    <div className="fixed inset-0 z-[60]">
      {dimBackground ? (
        <div className="absolute inset-0 bg-black/30" aria-hidden="true" />
      ) : null}
      <div
        role="dialog"
        aria-labelledby="tutorial-callout-heading"
        className="absolute w-[320px] rounded-lg bg-white p-4 shadow-xl ring-1 ring-black/5"
        style={{ top: `${position.top}px`, left: `${position.left}px`, pointerEvents: "auto" }}
      >
        <div className="flex flex-col gap-3">
          <h2 id="tutorial-callout-heading" className="text-base font-semibold text-kings-black">
            {message.headline}
          </h2>
          <p className="text-sm text-kings-grey-dark">{message.body}</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <button
              ref={nextButtonRef}
              type="button"
              className="rounded-md bg-kings-red px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-kings-red/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-kings-red/40 focus-visible:ring-offset-2"
              onClick={onNext}
            >
              Next
            </button>
            <button
              type="button"
              className="rounded-md border border-kings-grey-light px-3 py-2 text-sm font-semibold text-kings-black hover:bg-kings-grey-light/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-kings-red/40 focus-visible:ring-offset-2"
              onClick={onSkipAll}
            >
              Skip all tips
            </button>
            <button
              type="button"
              className="rounded-md border border-transparent px-3 py-2 text-sm font-semibold text-kings-black hover:bg-kings-grey-light/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-kings-red/40 focus-visible:ring-offset-2"
              onClick={onRemindLater}
            >
              Remind me later
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return mounted ? createPortal(calloutContent, document.body) : null
}

export default TutorialCallout
