import { mockIntentions } from "@/data/mockIntentions"
import { ColumnHeader } from "./ColumnHeader"
import { IntentionRow } from "./IntentionRow"

const BUCKETS = [
  { id: "do-now", title: "Do Now" },
  { id: "do-later", title: "Do Later" },
  { id: "before-graduation", title: "Before I Graduate" },
  { id: "after-graduation", title: "After I Graduate" },
]

export function Canvas() {
  return (
    <div className="max-w-[1920px] mx-auto bg-kings-white px-4 py-8 xl:px-8 2xl:px-12">
      <main aria-labelledby="canvas-title" className="space-y-10" role="main">
        <div>
          <h1 className="sr-only" id="canvas-title">
            King&apos;s Canvas
          </h1>
          <p className="text-sm text-kings-grey-dark">
            Loaded {mockIntentions.length} intention(s)
          </p>
        </div>

        <section className="grid grid-cols-4 gap-6 mb-12">
          {BUCKETS.map((bucket) => (
            <div
              key={bucket.id}
              className="rounded-lg border border-kings-grey-light bg-kings-white"
              role="region"
              aria-labelledby={`${bucket.id}-column-title`}
            >
              <ColumnHeader headingId={`${bucket.id}-column-title`} title={bucket.title} />
            </div>
          ))}
        </section>

        <div className="space-y-8" role="list">
          {mockIntentions.map((intention) => (
            <IntentionRow key={intention.id} intention={intention} />
          ))}
        </div>
      </main>
    </div>
  )
}

export default Canvas
