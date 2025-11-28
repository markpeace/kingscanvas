'use client'

import { useMemo } from 'react'

import { useStudentPersona } from '@/context/StudentPersonaContext'
import { STUDENT_PERSONAS } from '@/lib/context/studentPersonas'

export function StudentPersonaSelector() {
  const { personaId, setPersonaId, persona } = useStudentPersona()

  const options = useMemo(() => STUDENT_PERSONAS.map((item) => ({ id: item.id, label: item.label })), [])

  return (
    <div className="flex flex-col gap-2 text-sm">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-kings-black">Student persona</span>
        <span className="text-xs text-kings-grey-dark">{persona.shortLabel}</span>
      </div>
      <label className="sr-only" htmlFor="student-persona-select">
        Choose student persona
      </label>
      <select
        id="student-persona-select"
        className="w-full min-w-[16rem] rounded-md border border-kings-grey-light bg-white px-3 py-2 text-sm text-kings-black shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-kings-red/40 focus-visible:ring-offset-2"
        value={personaId}
        onChange={(event) => setPersonaId(event.target.value as typeof personaId)}
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export default StudentPersonaSelector
