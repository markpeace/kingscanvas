"use client"

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"

import type { TutorialMessageId } from "@/lib/tutorial/messages"

export type TutorialContextValue = {
  activeStepId: TutorialMessageId | null
  skippedAll: boolean
  isStepCompleted: (id: TutorialMessageId) => boolean
  showStep: (id: TutorialMessageId) => void
  completeStep: (id: TutorialMessageId) => void
  skipAll: () => void
  dismissStep: (id: TutorialMessageId) => void
  resetTutorial: () => void
}

const TutorialContext = createContext<TutorialContextValue | undefined>(undefined)

export function TutorialProvider({ children }: { children: ReactNode }) {
  const [activeStepId, setActiveStepId] = useState<TutorialMessageId | null>('persona_intro')
  const [skippedAll, setSkippedAll] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<Set<TutorialMessageId>>(new Set())

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
  }, [])

  const dismissStep = useCallback((id: TutorialMessageId) => {
    setActiveStepId((current) => (current === id ? null : current))
  }, [])

  const skipAll = useCallback(() => {
    setSkippedAll(true)
    setActiveStepId(null)
  }, [])

  const resetTutorial = useCallback(() => {
    setCompletedSteps(new Set())
    setSkippedAll(false)
    setActiveStepId("persona_intro")
  }, [])

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
      isStepCompleted,
      showStep,
      completeStep,
      skipAll,
      dismissStep,
      resetTutorial
    }),
    [activeStepId, completeStep, dismissStep, isStepCompleted, resetTutorial, showStep, skipAll, skippedAll]
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
