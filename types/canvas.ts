export type BucketId = 'do-now' | 'do-later' | 'before-graduation' | 'after-graduation'

export interface Step {
  _id?: string
  id: string
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
