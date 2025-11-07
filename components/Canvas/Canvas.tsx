import { mockIntentions } from '@/data/mockIntentions'
import { BUCKETS } from '@/lib/buckets'
import { IntentionRow } from '@/components/Canvas/IntentionRow'

export function Canvas() {
  return (
    <main className="px-8 py-10 w-full overflow-x-hidden">
      <div className="grid grid-cols-4 gap-6 mb-6 text-kings-red font-semibold text-xl">
        {BUCKETS.map((bucket) => (
          <h2 key={bucket.id}>{bucket.title}</h2>
        ))}
      </div>
      {mockIntentions.map((intention) => (
        <IntentionRow key={intention.id} intention={intention} />
      ))}
    </main>
  )
}

export default Canvas
