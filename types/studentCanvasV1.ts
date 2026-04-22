export type StudentCanvasBucket = "do_now" | "do_later" | "before_graduation" | "after_graduation"

export type StudentCanvasProgressStatus = "not_started" | "in_progress" | "completed" | "abandoned"

export type OpportunityDecisionStatus = "suggested" | "accepted"

export type OpportunitySource = "catalogue" | "free_text"

export type CatalogueRef = {
  system: string
  id: string
}

export type Opportunity = {
  id: string
  title: string
  description?: string
  decision_status: OpportunityDecisionStatus
  progress_status?: StudentCanvasProgressStatus
  source: OpportunitySource
  catalogue_ref?: CatalogueRef
  created_at: string
  updated_at: string
}

export type Step = {
  id: string
  title: string
  description?: string
  bucket: StudentCanvasBucket
  order: number
  progress_status: StudentCanvasProgressStatus
  created_at: string
  updated_at: string
  opportunities: Opportunity[]
}

export type Intention = {
  id: string
  title: string
  description?: string
  bucket: StudentCanvasBucket
  progress_status: StudentCanvasProgressStatus
  created_at: string
  updated_at: string
  steps: Step[]
}

export type CanvasState = {
  intentions: Intention[]
}

export type StudentCanvasDocument = {
  schema_version: "1.0.0"
  student_id: string
  created_at: string
  updated_at: string
  tutorial_state?: Record<string, unknown>
  canvas: CanvasState
}
