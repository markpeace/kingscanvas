export type Bucket =
  | 'do-now'
  | 'do-later'
  | 'before-graduation'
  | 'after-graduation';

export const BUCKETS: { id: Bucket; title: string }[] = [
  { id: 'do-now',            title: 'Do Now' },
  { id: 'do-later',          title: 'Do Later' },
  { id: 'before-graduation', title: 'Before I Graduate' },
  { id: 'after-graduation',  title: 'After I Graduate' }
];

export const bucketOrder: Record<Bucket, number> = {
  'do-now': 0,
  'do-later': 1,
  'before-graduation': 2,
  'after-graduation': 3
};

export function isBefore(a: Bucket, b: Bucket) {
  return bucketOrder[a] < bucketOrder[b];
}
