"use client"

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"

import type { TutorialMessageId } from "@/lib/tutorial/messages"

export type TutorialContextValue = {
  activeStepId: TutorialMessageId | null
  showStep: (id: TutorialMessageId) => void
  completeStep: (id: TutorialMessageId) => void
  skipAll: () => void
  dismissStep: (id: TutorialMessageId) => void
}

const TutorialContext = createContext<TutorialContextValue | undefined>(undefined)

export function TutorialProvider({ children }: { children: ReactNode }) {
  const [activeStepId, setActiveStepId] = useState<TutorialMessageId | null>(null)
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

  const completeStep = useCallback((id: TutorialMessageId) => {
    if (activeStepId === id) {
      setActiveStepId(null)
      return
    }

    setActiveStepId(null)
  }, [activeStepId])

  const dismissStep = useCallback((id: TutorialMessageId) => {
    if (activeStepId === id) {
      setActiveStepId(null)
      return
    }

    setActiveStepId(null)
  }, [activeStepId])

  const skipAll = useCallback(() => {
    setSkippedAll(true)
    setActiveStepId(null)
  }, [])

  const value = useMemo<TutorialContextValue>(
    () => ({ activeStepId, showStep, completeStep, skipAll, dismissStep }),
    [activeStepId, completeStep, dismissStep, showStep, skipAll]
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
