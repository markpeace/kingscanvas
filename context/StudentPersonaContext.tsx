"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

import {
  DEFAULT_STUDENT_PERSONA_ID,
  getStudentPersona,
  type StudentPersona,
  type StudentPersonaId
} from "@/lib/context/studentPersonas"

const STORAGE_KEY = "kingscanvas.personaId"

export type StudentPersonaContextValue = {
  personaId: StudentPersonaId
  persona: StudentPersona
  setPersonaId: (id: StudentPersonaId) => void
}

const StudentPersonaContext = createContext<StudentPersonaContextValue | undefined>(undefined)

export function StudentPersonaProvider({ children }: { children: ReactNode }) {
  const [personaId, setPersonaId] = useState<StudentPersonaId>(DEFAULT_STUDENT_PERSONA_ID)

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY) as StudentPersonaId | null
      if (stored) {
        setPersonaId(getStudentPersona(stored).id)
      }
    } catch (error) {
      console.warn("StudentPersona: failed to read localStorage", error)
    }
  }, [])

  const handleSetPersonaId = useCallback((id: StudentPersonaId) => {
    setPersonaId(id)
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_KEY, id)
      } catch (error) {
        console.warn("StudentPersona: failed to write localStorage", error)
      }
    }
  }, [])

  const persona = useMemo(() => getStudentPersona(personaId), [personaId])

  const value = useMemo(
    () => ({
      personaId,
      persona,
      setPersonaId: handleSetPersonaId
    }),
    [persona, personaId, handleSetPersonaId]
  )

  return <StudentPersonaContext.Provider value={value}>{children}</StudentPersonaContext.Provider>
}

export function useStudentPersona(): StudentPersonaContextValue {
  const context = useContext(StudentPersonaContext)

  if (!context) {
    throw new Error("useStudentPersona must be used within a StudentPersonaProvider")
  }

  return context
}
