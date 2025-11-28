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
  studyMode: "on-campus" | "distance-online" | "commuter" | "placement-heavy"
  yearsRemaining: number
  notes: string[]
}

export const STUDENT_PERSONAS: StudentPersona[] = [
  {
    id: "social-science-ug-first-year",
    label: "Social science first year undergraduate",
    shortLabel: "Social science UG Y1",
    discipline: "Social science",
    programmeType: "undergraduate",
    totalYears: 3,
    currentYear: 1,
    studyMode: "on-campus",
    yearsRemaining: 3 - 1,
    notes: [
      "New to university",
      "Exploring options",
      "Plenty of time left on the degree"
    ]
  },
  {
    id: "pg-arts-humanities",
    label: "Postgraduate arts and humanities student",
    shortLabel: "PG Arts/Hums",
    discipline: "Arts and humanities",
    programmeType: "taught-postgraduate",
    totalYears: 1,
    currentYear: 1,
    studyMode: "on-campus",
    yearsRemaining: 1 - 1,
    notes: [
      "Time compressed",
      "Often balancing dissertation or final project with enrichment"
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
    studyMode: "on-campus",
    yearsRemaining: 4 - 2,
    notes: [
      "Deep specialist focus",
      "Limited time for extra activities",
      "Needs evidence of research skills and broader development"
    ]
  },
  {
    id: "digital-law-online",
    label: "King’s Digital Law student (online only)",
    shortLabel: "Digital Law",
    discipline: "Law",
    programmeType: "undergraduate",
    totalYears: 3,
    currentYear: 2,
    studyMode: "distance-online",
    yearsRemaining: 3 - 2,
    notes: [
      "Fully online, distance learning",
      "No routine access to physical campus",
      "Relies on virtual communities and online opportunities"
    ]
  },
  {
    id: "psychology-commuter",
    label: "Psychology student who commutes heavily",
    shortLabel: "Psychology commuter",
    discipline: "Psychology",
    programmeType: "undergraduate",
    totalYears: 3,
    currentYear: 2,
    studyMode: "commuter",
    yearsRemaining: 3 - 2,
    notes: [
      "Limited evening availability",
      "Travel time eats into spare time",
      "Needs activities near existing campus days or local options"
    ]
  },
  {
    id: "medicine-third-year-placement",
    label: "Medicine student in third year on placement",
    shortLabel: "Medicine placement Y3",
    discipline: "Medicine",
    programmeType: "undergraduate",
    totalYears: 5,
    currentYear: 3,
    studyMode: "placement-heavy",
    yearsRemaining: 5 - 3,
    notes: [
      "Shift patterns and rota based life",
      "Less predictable spare time",
      "Rich access to applied clinical contexts"
    ]
  }
]

export const DEFAULT_STUDENT_PERSONA_ID: StudentPersonaId = "social-science-ug-first-year"

export function getStudentPersona(id: StudentPersonaId | null | undefined): StudentPersona {
  const match = STUDENT_PERSONAS.find((persona) => persona.id === id)
  return match ?? STUDENT_PERSONAS.find((persona) => persona.id === DEFAULT_STUDENT_PERSONA_ID)!
}
