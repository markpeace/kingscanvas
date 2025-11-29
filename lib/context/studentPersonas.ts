export type StudentPersonaId =
  | "social-science-ug-first-year"
  | "pg-arts-humanities"
  | "phd-chemistry"
  | "digital-law-online"
  | "psychology-commuter"
  | "medicine-third-year-placement"

export type StudentPersona = {
  id: StudentPersonaId
  label: string
  shortLabel: string
  discipline: string
  programmeType: "undergraduate" | "taught-postgraduate" | "research-postgraduate"
  totalYears: number
  currentYear: number
  yearsRemaining: number
  studyMode: "on-campus" | "distance-online" | "commuter" | "placement-heavy"
  notes: string[]
}

export const STUDENT_PERSONAS: StudentPersona[] = [
  {
    id: "social-science-ug-first-year",
    label: "Social science undergraduate (Year 1)",
    shortLabel: "UG1 Social Science",
    discipline: "Social science",
    programmeType: "undergraduate",
    totalYears: 3,
    currentYear: 1,
    yearsRemaining: 2,
    studyMode: "on-campus",
    notes: ["New to university", "Exploring options", "Plenty of time left on the degree"]
  },
  {
    id: "pg-arts-humanities",
    label: "Postgraduate arts and humanities",
    shortLabel: "PG Arts",
    discipline: "Arts and humanities",
    programmeType: "taught-postgraduate",
    totalYears: 1,
    currentYear: 1,
    yearsRemaining: 0,
    studyMode: "on-campus",
    notes: [
      "Time compressed one year Masters",
      "Balancing taught modules with dissertation or final project"
    ]
  },
  {
    id: "phd-chemistry",
    label: "PhD student in chemistry",
    shortLabel: "PhD Chemistry",
    discipline: "Chemistry",
    programmeType: "research-postgraduate",
    totalYears: 4,
    currentYear: 2,
    yearsRemaining: 2,
    studyMode: "on-campus",
    notes: ["Lab based and research intensive", "Deep specialist focus", "Limited time for extra activities"]
  },
  {
    id: "digital-law-online",
    label: "King's Digital Law (online)",
    shortLabel: "Digital Law",
    discipline: "Law",
    programmeType: "undergraduate",
    totalYears: 3,
    currentYear: 2,
    yearsRemaining: 1,
    studyMode: "distance-online",
    notes: [
      "Fully online distance learner",
      "No routine access to physical campus",
      "Relies on virtual communities and online opportunities"
    ]
  },
  {
    id: "psychology-commuter",
    label: "Psychology commuter student",
    shortLabel: "Psych commuter",
    discipline: "Psychology",
    programmeType: "undergraduate",
    totalYears: 3,
    currentYear: 2,
    yearsRemaining: 1,
    studyMode: "commuter",
    notes: [
      "Long commute to campus",
      "Limited evening availability",
      "Needs activity that clusters around existing campus days or local options"
    ]
  },
  {
    id: "medicine-third-year-placement",
    label: "Medicine Year 3 on placement",
    shortLabel: "Med3 placement",
    discipline: "Medicine",
    programmeType: "undergraduate",
    totalYears: 5,
    currentYear: 3,
    yearsRemaining: 2,
    studyMode: "placement-heavy",
    notes: [
      "Clinical placements with rota based life",
      "Less predictable spare time",
      "Rich access to applied contexts in health care"
    ]
  }
]

export const DEFAULT_STUDENT_PERSONA_ID: StudentPersonaId = "social-science-ug-first-year"

export function getStudentPersona(id: StudentPersonaId | string | null | undefined): StudentPersona {
  const match = STUDENT_PERSONAS.find((persona) => persona.id === id)
  return match ?? STUDENT_PERSONAS.find((persona) => persona.id === DEFAULT_STUDENT_PERSONA_ID)!
}
