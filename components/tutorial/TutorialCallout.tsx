"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useId,
  type KeyboardEvent as ReactKeyboardEvent,
  type CSSProperties,
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
  const [arrowSide, setArrowSide] = useState<"top" | "bottom" | "left" | "right">("top")
  const [arrowOffset, setArrowOffset] = useState(0)
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

    if (!calloutRect) {
      return
    }

    try {
      const targetCenterX = rect.left + rect.width / 2
      const targetCenterY = rect.top + rect.height / 2

      const panelLeft = left
      const panelTop = top
      const panelRight = panelLeft + calloutWidth
      const panelBottom = panelTop + calloutHeight
      const panelCenterX = (panelLeft + panelRight) / 2
      const panelCenterY = (panelTop + panelBottom) / 2

      const dx = targetCenterX - panelCenterX
      const dy = targetCenterY - panelCenterY

      let nextArrowSide: "top" | "bottom" | "left" | "right"

      if (Math.abs(dy) >= Math.abs(dx)) {
        nextArrowSide = dy < 0 ? "top" : "bottom"
      } else {
        nextArrowSide = dx < 0 ? "left" : "right"
      }

      if (nextArrowSide === "top" || nextArrowSide === "bottom") {
        const rawOffset = targetCenterX - panelLeft
        const clampedOffset = Math.max(12, Math.min(rawOffset, panelRight - panelLeft - 12))
        setArrowOffset(clampedOffset)
      } else {
        const rawOffset = targetCenterY - panelTop
        const clampedOffset = Math.max(12, Math.min(rawOffset, panelBottom - panelTop - 12))
        setArrowOffset(clampedOffset)
      }

      setArrowSide(nextArrowSide)
    } catch (error) {
      // Ignore arrow positioning errors so the callout can still render.
    }
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

  const arrowBaseClass = "pointer-events-none absolute w-3 h-3 bg-red-700 rotate-45 shadow"
  let arrowClassName = arrowBaseClass
  const arrowStyle: CSSProperties = {}

  if (arrowSide === "top") {
    arrowClassName += " -top-1.5"
    arrowStyle.left = `${arrowOffset}px`
  } else if (arrowSide === "bottom") {
    arrowClassName += " -bottom-1.5"
    arrowStyle.left = `${arrowOffset}px`
  } else if (arrowSide === "left") {
    arrowClassName += " -left-1.5"
    arrowStyle.top = `${arrowOffset}px`
  } else if (arrowSide === "right") {
    arrowClassName += " -right-1.5"
    arrowStyle.top = `${arrowOffset}px`
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
        className="pointer-events-auto absolute w-[320px] max-w-[calc(100vw-32px)] rounded-lg bg-red-700 text-white p-4 shadow-xl ring-1 ring-red-900/60"
        style={{ top: `${position.top}px`, left: `${position.left}px`, touchAction: "none" }}
        onKeyDown={handleKeyDown}
        onPointerDown={stopAllPointerLikeEvents}
        onPointerUp={stopAllPointerLikeEvents}
        onPointerMove={stopAllPointerLikeEvents}
        onMouseDown={stopAllPointerLikeEvents}
        onMouseUp={stopAllPointerLikeEvents}
        onClick={stopAllPointerLikeEvents}
        onTouchStart={stopAllPointerLikeEvents}
        onTouchEnd={stopAllPointerLikeEvents}
        onTouchMove={stopAllPointerLikeEvents}
      >
        <div className={arrowClassName} style={arrowStyle} />
        <div className="flex flex-col gap-3">
          <h2 id={headingId} className="text-base font-semibold text-white">
            {message.headline}
          </h2>
          <p id={bodyId} className="text-sm text-red-50">
            {message.body}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <button
              ref={nextButtonRef}
              type="button"
              className="inline-flex items-center justify-center rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-red-700 shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white focus:ring-offset-red-700"
              onPointerDown={stopAllPointerLikeEvents}
              onPointerUp={stopAllPointerLikeEvents}
              onMouseDown={stopAllPointerLikeEvents}
              onClick={(event) => {
                stopAllPointerLikeEvents(event)
                handleNext()
              }}
              onTouchStart={stopAllPointerLikeEvents}
              onTouchEnd={(event) => {
                stopAllPointerLikeEvents(event)
                handleNext()
              }}
            >
              Next
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md border border-white/70 px-3 py-1.5 text-sm font-semibold text-white/90 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white focus:ring-offset-red-700"
              onPointerDown={stopAllPointerLikeEvents}
              onPointerUp={stopAllPointerLikeEvents}
              onMouseDown={stopAllPointerLikeEvents}
              onClick={(event) => {
                stopAllPointerLikeEvents(event)
                handleRemindLater()
              }}
              onTouchStart={stopAllPointerLikeEvents}
              onTouchEnd={(event) => {
                stopAllPointerLikeEvents(event)
                handleRemindLater()
              }}
            >
              Remind me later
            </button>
            <button
              type="button"
              className="text-xs underline text-red-100 hover:text-white"
              onPointerDown={stopAllPointerLikeEvents}
              onPointerUp={stopAllPointerLikeEvents}
              onMouseDown={stopAllPointerLikeEvents}
              onClick={(event) => {
                stopAllPointerLikeEvents(event)
                handleSkipAll()
              }}
              onTouchStart={stopAllPointerLikeEvents}
              onTouchEnd={(event) => {
                stopAllPointerLikeEvents(event)
                handleSkipAll()
              }}
            >
              Skip all tips
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return mounted ? createPortal(calloutContent, document.body) : null
}

export default TutorialCallout
