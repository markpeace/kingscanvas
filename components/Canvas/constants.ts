import type { BucketId } from '@/types/canvas'

export type Bucket = {
  id: BucketId
  title: string
}

export const BUCKETS: Bucket[] = [
  { id: 'do-now', title: 'Do Now' },
  { id: 'do-later', title: 'Do Later' },
  { id: 'before-graduation', title: 'Before I Graduate' },
  { id: 'after-graduation', title: 'After I Graduate' }
]

const BUCKET_ORDER = BUCKETS.map((bucket) => bucket.id)

export function isBefore(a: BucketId, b: BucketId) {
  const indexOfA = BUCKET_ORDER.indexOf(a)
  const indexOfB = BUCKET_ORDER.indexOf(b)

  if (indexOfA === -1 || indexOfB === -1) {
    return false
  }

  return indexOfA < indexOfB
}
