import { BUCKETS } from '@/lib/buckets';
import { mockIntentions } from '@/data/mockIntentions';
import { IntentionRow } from '@/components/Canvas/IntentionRow';

export default function Canvas() {
  return (
    <main className="px-8 py-10">
      {/* Column headers */}
      <div className="grid grid-cols-4 gap-6 mb-6">
        {BUCKETS.map((b) => (
          <h2
            key={b.id}
            className="text-kings-red font-semibold text-xl"
          >
            {b.title}
          </h2>
        ))}
      </div>

      {/* One row per intention */}
      {mockIntentions.map((intention) => (
        <IntentionRow key={intention.id} intention={intention} />
      ))}
    </main>
  );
}
