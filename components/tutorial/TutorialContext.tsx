"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

import { tutorialMessageIdList, type TutorialMessageId } from "@/lib/tutorial/messages"
import type { TutorialState } from "@/lib/tutorial/state"

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

  const hydrateFromServer = useCallback((state: TutorialState) => {
    const nextCompletedSteps = tutorialMessageIdList.reduce<Set<TutorialMessageId>>((acc, id) => {
      if (state[id]?.completedAt) {
        acc.add(id)
      }
      return acc
    }, new Set<TutorialMessageId>())

    setCompletedSteps(nextCompletedSteps)
    setSkippedAll(Boolean(state.skippedAll))

    if (state.skippedAll) {
      setActiveStepId(null)
      return
    }

    const firstIncompleteStep = tutorialMessageIdList.find((id) => !nextCompletedSteps.has(id)) ?? null
    setActiveStepId(firstIncompleteStep)
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

  const showStep = useCallback(
    (id: TutorialMessageId) => {
      if (skippedAll) {
        return
      }

      setActiveStepId(id)
    },
    [skippedAll]
  )

  const completeStep = useCallback((id: TutorialMessageId) => {
    setCompletedSteps((prev) => {
      const updated = new Set(prev)
      updated.add(id)
      return updated
    })

    setActiveStepId((current) => (current === id ? null : current))
    persistState({ action: "completeStep", stepId: id })
  }, [persistState])

  const dismissStep = useCallback(
    (id: TutorialMessageId) => {
      setActiveStepId((current) => (current === id ? null : current))
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
    setSkippedAll(false)
    setActiveStepId("persona_intro")
    persistState({ action: "resetAll" })
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
