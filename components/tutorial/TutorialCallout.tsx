"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useId,
  type KeyboardEvent as ReactKeyboardEvent,
  type SyntheticEvent
} from "react"
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
  const calloutRef = useRef<HTMLDivElement | null>(null)
  const nextButtonRef = useRef<HTMLButtonElement | null>(null)
  const headingId = useId()
  const bodyId = useId()
  const message = useMemo(() => getTutorialMessage(stepId), [stepId])

  useEffect(() => {
    setMounted(true)
  }, [])

  const returnFocusToAnchor = useCallback(() => {
    const anchor = targetRef.current

    if (anchor && typeof anchor.focus === "function") {
      requestAnimationFrame(() => {
        anchor.focus({ preventScroll: true })
      })
    }
  }, [targetRef])

  useEffect(() => {
    return () => {
      returnFocusToAnchor()
    }
  }, [returnFocusToAnchor])

  const updatePosition = useCallback(() => {
    const target = targetRef.current

    if (!target) {
      setPosition(null)
      return
    }

    const rect = target.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const calloutRect = calloutRef.current?.getBoundingClientRect()
    const desiredWidth = calloutRect?.width ?? 320
    const calloutWidth = Math.min(desiredWidth, viewportWidth - 24)
    const calloutHeight = calloutRect?.height ?? 0
    const horizontalPadding = 12

    let left = rect.left + rect.width / 2 - calloutWidth / 2
    left = Math.min(Math.max(left, horizontalPadding), viewportWidth - calloutWidth - horizontalPadding)

    const spaceBelow = viewportHeight - rect.bottom
    const defaultTop = rect.bottom + 12
    const shouldPlaceAbove = calloutHeight > 0 && spaceBelow < calloutHeight + 12
    let top = shouldPlaceAbove ? rect.top - calloutHeight - 12 : defaultTop

    if (viewportWidth < 640) {
      left = Math.max((viewportWidth - calloutWidth) / 2, horizontalPadding)
      top = Math.min(viewportHeight - calloutHeight - 24, defaultTop)
      if (top < horizontalPadding) {
        top = horizontalPadding
      }
    }

    setPosition({ top, left })
  }, [targetRef])

  useEffect(() => {
    if (!mounted) {
      return
    }

    updatePosition()
    window.addEventListener("resize", updatePosition)
    window.addEventListener("scroll", updatePosition, true)

    return () => {
      window.removeEventListener("resize", updatePosition)
      window.removeEventListener("scroll", updatePosition, true)
    }
  }, [mounted, updatePosition])

  useEffect(() => {
    if (mounted) {
      requestAnimationFrame(() => {
        updatePosition()
      })
    }
  }, [mounted, stepId, updatePosition])

  useEffect(() => {
    if (position && nextButtonRef.current) {
      nextButtonRef.current.focus({ preventScroll: true })
    }
  }, [position])

  const stopAllPointerLikeEvents = useCallback((event: SyntheticEvent) => {
    event.stopPropagation()

    if (typeof event.preventDefault === "function") {
      event.preventDefault()
    }
  }, [])

  const handleNext = () => {
    onNext()
    returnFocusToAnchor()
  }

  const handleSkipAll = () => {
    onSkipAll()
    returnFocusToAnchor()
  }

  const handleRemindLater = () => {
    onRemindLater()
    returnFocusToAnchor()
  }

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.stopPropagation()
      event.preventDefault()
      handleRemindLater()
    }
  }

  if (!mounted || !position) {
    return null
  }

  const calloutContent = (
    <div className="pointer-events-none fixed inset-0 z-[200]">
      {dimBackground ? (
        <div className="pointer-events-none absolute inset-0 bg-black/40" aria-hidden="true" />
      ) : null}
      <div
        ref={calloutRef}
        role="dialog"
        aria-modal="false"
        aria-labelledby={headingId}
        aria-describedby={bodyId}
        className="pointer-events-auto absolute w-[320px] max-w-[calc(100vw-32px)] rounded-lg bg-white p-4 shadow-xl ring-1 ring-black/5"
        style={{ top: `${position.top}px`, left: `${position.left}px`, touchAction: "none" }}
        onKeyDown={handleKeyDown}
        onPointerDown={stopAllPointerLikeEvents}
        onPointerUp={stopAllPointerLikeEvents}
        onPointerMove={stopAllPointerLikeEvents}
        onMouseDown={stopAllPointerLikeEvents}
        onMouseUp={stopAllPointerLikeEvents}
        onClick={stopAllPointerLikeEvents}
      >
        <div className="flex flex-col gap-3">
          <h2 id={headingId} className="text-base font-semibold text-kings-black">
            {message.headline}
          </h2>
          <p id={bodyId} className="text-sm text-kings-grey-dark">
            {message.body}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <button
              ref={nextButtonRef}
              type="button"
              className="rounded-md bg-kings-red px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-kings-red/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-kings-red/40 focus-visible:ring-offset-2"
              onPointerDown={stopAllPointerLikeEvents}
              onPointerUp={stopAllPointerLikeEvents}
              onMouseDown={stopAllPointerLikeEvents}
              onClick={(event) => {
                stopAllPointerLikeEvents(event)
                handleNext()
              }}
            >
              Next
            </button>
            <button
              type="button"
              className="rounded-md border border-kings-grey-light px-3 py-2 text-sm font-semibold text-kings-black hover:bg-kings-grey-light/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-kings-red/40 focus-visible:ring-offset-2"
              onPointerDown={stopAllPointerLikeEvents}
              onPointerUp={stopAllPointerLikeEvents}
              onMouseDown={stopAllPointerLikeEvents}
              onClick={(event) => {
                stopAllPointerLikeEvents(event)
                handleSkipAll()
              }}
            >
              Skip all tips
            </button>
            <button
              type="button"
              className="rounded-md border border-transparent px-3 py-2 text-sm font-semibold text-kings-black hover:bg-kings-grey-light/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-kings-red/40 focus-visible:ring-offset-2"
              onPointerDown={stopAllPointerLikeEvents}
              onPointerUp={stopAllPointerLikeEvents}
              onMouseDown={stopAllPointerLikeEvents}
              onClick={(event) => {
                stopAllPointerLikeEvents(event)
                handleRemindLater()
              }}
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
