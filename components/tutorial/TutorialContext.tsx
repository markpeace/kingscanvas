"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

import { tutorialMessageIdList, type TutorialMessageId } from "@/lib/tutorial/messages"
import type { TutorialState } from "@/lib/tutorial/state"

const introSequence: TutorialMessageId[] = [
  "canvas_intro_1",
  "canvas_intro_2",
  "canvas_intro_3",
  "persona_intro"
]
const canvasIntroIds: TutorialMessageId[] = ["canvas_intro_1", "canvas_intro_2", "canvas_intro_3"]
const DISMISS_COOLDOWN_MS = 24 * 60 * 60 * 1000

export function logTutorialDebug(message: string, payload?: unknown) {
  if (process.env.NODE_ENV !== "development") return
  // eslint-disable-next-line no-console
  console.debug("[tutorial]", message, payload)
}

export type TutorialContextValue = {
  activeStepId: TutorialMessageId | null
  skippedAll: boolean
  isHydrated: boolean
  isStepCompleted: (id: TutorialMessageId) => boolean
  showStep: (id: TutorialMessageId) => void
  completeStep: (id: TutorialMessageId) => void
  skipAll: () => void
  dismissStep: (id: TutorialMessageId) => void
  resetTutorial: () => void
}

const TutorialContext = createContext<TutorialContextValue | undefined>(undefined)

export function TutorialProvider({ children }: { children: ReactNode }) {
  const [activeStepId, setActiveStepId] = useState<TutorialMessageId | null>(null)
  const [skippedAll, setSkippedAll] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<Set<TutorialMessageId>>(new Set())
  const [dismissedSteps, setDismissedSteps] = useState<Map<TutorialMessageId, number>>(new Map())

  const hydrateFromServer = useCallback((state: TutorialState) => {
    const nextCompletedSteps = tutorialMessageIdList.reduce<Set<TutorialMessageId>>((acc, id) => {
      if (state[id]?.completedAt) {
        acc.add(id)
      }
      return acc
    }, new Set<TutorialMessageId>())

    const now = Date.now()
    const nextDismissedSteps = tutorialMessageIdList.reduce<Map<TutorialMessageId, number>>((acc, id) => {
      const dismissedAt = state[id]?.dismissedAt

      if (!dismissedAt) {
        return acc
      }

      const dismissedAtMs = Date.parse(dismissedAt)

      if (!Number.isNaN(dismissedAtMs) && now - dismissedAtMs < DISMISS_COOLDOWN_MS) {
        acc.set(id, dismissedAtMs)
      }

      return acc
    }, new Map<TutorialMessageId, number>())

    setCompletedSteps(nextCompletedSteps)
    setDismissedSteps(nextDismissedSteps)
    setSkippedAll(Boolean(state.skippedAll))

    if (state.skippedAll) {
      setActiveStepId(null)
      return
    }

    const hasCompletedAnyStep = nextCompletedSteps.size > 0
    const hasStartedCanvasIntro = canvasIntroIds.some(
      (id) => nextCompletedSteps.has(id) || nextDismissedSteps.has(id)
    )
    const nextIntroStep = introSequence.find(
      (id) => !nextCompletedSteps.has(id) && !nextDismissedSteps.has(id)
    ) ?? null

    if (!hasCompletedAnyStep) {
      setActiveStepId(nextIntroStep)
      return
    }

    if (hasStartedCanvasIntro) {
      setActiveStepId(nextIntroStep)
      return
    }

    setActiveStepId(null)
  }, [])

  useEffect(() => {
    let cancelled = false

    const fetchTutorialState = async () => {
      try {
        const response = await fetch("/api/tutorial/state")

        if (!response.ok) {
          throw new Error(`Failed to load tutorial state: ${response.status}`)
        }

        const data: TutorialState = await response.json()

        if (!cancelled && data) {
          hydrateFromServer(data)
        }
      } catch (error) {
        console.error("Tutorial: failed to hydrate from server", error)
      } finally {
        if (!cancelled) {
          setIsHydrated(true)
        }
      }
    }

    void fetchTutorialState()

    return () => {
      cancelled = true
    }
  }, [hydrateFromServer])

  const persistState = useCallback((payload: Record<string, unknown>) => {
    void fetch("/api/tutorial/state", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    }).catch((error) => console.error("Tutorial: failed to persist state", error))
  }, [])

  const isDismissedRecently = useCallback(
    (id: TutorialMessageId) => {
      const dismissedAt = dismissedSteps.get(id)

      if (!dismissedAt) {
        return false
      }

      if (Date.now() - dismissedAt >= DISMISS_COOLDOWN_MS) {
        setDismissedSteps((prev) => {
          if (!prev.has(id)) {
            return prev
          }

          const next = new Map(prev)
          next.delete(id)
          return next
        })
        return false
      }

      return true
    },
    [dismissedSteps]
  )

  const showStep = useCallback(
    (id: TutorialMessageId) => {
      logTutorialDebug("showStep called", { id, skippedAll, activeStepId })

      if (skippedAll || completedSteps.has(id) || isDismissedRecently(id)) {
        logTutorialDebug("showStep blocked", { id, reason: "skippedAll, completed, or dismissed" })
        return
      }

      logTutorialDebug("showStep activating", { id })
      setActiveStepId(id)
    },
    [activeStepId, completedSteps, isDismissedRecently, skippedAll]
  )

  const completeStep = useCallback(
    (id: TutorialMessageId) => {
      setCompletedSteps((prev) => {
        const updated = new Set(prev)
        updated.add(id)

        setDismissedSteps((prevDismissed) => {
          if (!prevDismissed.has(id)) {
            return prevDismissed
          }
          const next = new Map(prevDismissed)
          next.delete(id)
          return next
        })

        setActiveStepId((current) => {
          if (current !== id) {
            return current
          }

          if (skippedAll) {
            return null
          }

          const nextSequenceStep = introSequence.includes(id)
            ? introSequence.find((stepId) => !updated.has(stepId)) ?? null
            : null

          return nextSequenceStep ?? null
        })

        return updated
      })

      persistState({ action: "completeStep", stepId: id })
      logTutorialDebug("completeStep", { id })
    },
    [persistState, skippedAll]
  )

  const dismissStep = useCallback(
    (id: TutorialMessageId) => {
      setActiveStepId((current) => (current === id ? null : current))
      setDismissedSteps((prev) => {
        const next = new Map(prev)
        next.set(id, Date.now())
        return next
      })
      persistState({ action: "dismissStep", stepId: id })
    },
    [persistState]
  )

  const skipAll = useCallback(() => {
    setSkippedAll(true)
    setActiveStepId(null)
    persistState({ action: "skipAll" })
  }, [persistState])

  const resetTutorial = useCallback(() => {
    setCompletedSteps(new Set())
    setDismissedSteps(new Map())
    setSkippedAll(false)
    setActiveStepId("canvas_intro_1")
    persistState({ action: "resetAll" })
    logTutorialDebug("resetTutorial")
  }, [persistState])

  const isStepCompleted = useCallback(
    (id: TutorialMessageId) => {
      return completedSteps.has(id)
    },
    [completedSteps]
  )

  const value = useMemo<TutorialContextValue>(
    () => ({
      activeStepId,
      skippedAll,
      isHydrated,
      isStepCompleted,
      showStep,
      completeStep,
      skipAll,
      dismissStep,
      resetTutorial
    }),
    [activeStepId, completeStep, dismissStep, isHydrated, isStepCompleted, resetTutorial, showStep, skipAll, skippedAll]
  )

  return <TutorialContext.Provider value={value}>{children}</TutorialContext.Provider>
}

export function useTutorial(): TutorialContextValue {
  const context = useContext(TutorialContext)

  if (!context) {
    throw new Error("useTutorial must be used within a TutorialProvider")
  }

  return context
}
