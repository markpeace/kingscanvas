"use client"

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"

import type { TutorialMessageId } from "@/lib/tutorial/messages"

export type TutorialContextValue = {
  activeStepId: TutorialMessageId | null
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

  const showStep = useCallback(
    (id: TutorialMessageId) => {
      if (skippedAll) {
        return
      }

      setActiveStepId(id)
    },
    [skippedAll]
  )

  const completeStep = useCallback((_id: TutorialMessageId) => {
    setActiveStepId(null)
  }, [])

  const dismissStep = useCallback((_id: TutorialMessageId) => {
    setActiveStepId(null)
  }, [])

  const skipAll = useCallback(() => {
    setSkippedAll(true)
    setActiveStepId(null)
  }, [])

  const resetTutorial = useCallback(() => {
    setSkippedAll(false)
    setActiveStepId("persona_intro")
  }, [])

  const value = useMemo<TutorialContextValue>(
    () => ({ activeStepId, showStep, completeStep, skipAll, dismissStep, resetTutorial }),
    [activeStepId, completeStep, dismissStep, resetTutorial, showStep, skipAll]
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
