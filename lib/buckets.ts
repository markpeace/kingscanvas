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

export const bucketOrder = BUCKETS.reduce<Record<BucketId, number>>((orderMap, bucket, index) => {
  orderMap[bucket.id] = index
  return orderMap
}, {} as Record<BucketId, number>)

export function isBefore(a: BucketId, b: BucketId) {
  const indexOfA = bucketOrder[a]
  const indexOfB = bucketOrder[b]

  if (indexOfA === undefined || indexOfB === undefined) {
    return false
  }

  return indexOfA < indexOfB
}

export function isSameOrBefore(a: BucketId, b: BucketId) {
  const indexOfA = bucketOrder[a]
  const indexOfB = bucketOrder[b]

  if (indexOfA === undefined || indexOfB === undefined) {
    return false
  }

  return indexOfA <= indexOfB
}
