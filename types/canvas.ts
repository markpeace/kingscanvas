export type BucketId = 'do-now' | 'do-later' | 'before-graduation' | 'after-graduation'

export interface Step {
  id: string
  clientId: string
  intentionId: string
  title?: string
  text?: string
  bucket: BucketId
  order: number
  status?: string
  source?: string
  user?: string
  createdAt?: string | Date
}

export interface Intention {
  id: string
  title: string
  description?: string
  bucket: BucketId
  steps: Step[]
  createdAt: string
  updatedAt: string
}

export type OpportunitySource = "kings-edge-simulated" | "independent"

export type OpportunityForm =
  | "workshop"
  | "mentoring"
  | "short-course"
  | "coaching"
  | "project"
  | "networking"
  | "independent-action"

export type OpportunityFocus = "experience" | "skills" | "community" | "reflection" | "planning"

export type OpportunityStatus = "suggested" | "saved" | "dismissed"

export interface Opportunity {
  _id?: string
  id: string
  stepId: string
  title: string
  summary: string
  source: OpportunitySource
  form: OpportunityForm
  focus: OpportunityFocus
  status: OpportunityStatus
  createdAt?: string | Date
  updatedAt?: string | Date
}

export interface OpportunityApiItem {
  id: string
  title: string
  description?: string
  decision_status: "suggested" | "accepted"
  progress_status?: "not_started" | "in_progress" | "completed" | "abandoned"
  source: "catalogue" | "free_text"
  catalogue_ref?: {
    system: string
    id: string
  }
  created_at?: string
  updated_at?: string
}
