import { IntentionCard } from "@/components/Canvas/IntentionCard"
import { mockIntentions } from "@/data/mockIntentions"

const buckets = [
  { id: "do-now", title: "Do Now" },
  { id: "do-later", title: "Do Later" },
  { id: "before-graduation", title: "Before I Graduate" },
  { id: "after-graduation", title: "After I Graduate" }
]

export default function Canvas() {
  return (
    <main className="grid grid-cols-1 gap-6 px-4 py-8 lg:grid-cols-4 lg:px-8">
      {buckets.map((bucket) => (
        <section key={bucket.id} className="space-y-4">
          <header>
            <h2 className="text-kings-red font-semibold text-xl mb-2">{bucket.title}</h2>
          </header>

          {mockIntentions
            .filter((intention) => intention.bucket === bucket.id)
            .map((intention) => (
              <IntentionCard key={intention.id} intention={intention} />
            ))}
        </section>
      ))}
    </main>
  )
}
