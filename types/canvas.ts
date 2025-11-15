export type BucketId = 'do-now' | 'do-later' | 'before-graduation' | 'after-graduation'

export interface Step {
  _id?: string
  id: string
  persistedId?: string
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

export type OpportunitySource = "edge_simulated" | "independent"

export type OpportunityForm = "intensive" | "evergreen" | "short_form" | "sustained"

export type OpportunityFocus =
  | "capability"
  | "capital"
  | "credibility"
  | Array<"capability" | "capital" | "credibility">

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
