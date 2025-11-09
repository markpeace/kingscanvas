export type BucketId = 'do-now' | 'do-later' | 'before-graduation' | 'after-graduation'

export interface Step {
  id: string
  intentionId: string
  title: string
  bucket: BucketId
  order: number
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
