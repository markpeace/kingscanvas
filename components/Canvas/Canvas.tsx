import { mockIntentions } from '@/data/mockIntentions'

import { BUCKETS } from './constants'
import { ColumnHeader } from './ColumnHeader'
import { IntentionRow } from './IntentionRow'

export function Canvas() {
  return (
    <div className="max-w-[1920px] mx-auto px-4 py-8 lg:px-8 2xl:px-12">
      <main
        aria-labelledby="canvas-title"
        className="px-8 py-10 overflow-x-hidden w-full bg-kings-white"
        role="main"
      >
        <h1 className="sr-only" id="canvas-title">
          King&apos;s Canvas
        </h1>
        <p className="text-sm text-kings-grey-dark">
          Loaded {mockIntentions.length} intention(s)
        </p>

        <section className="grid grid-cols-4 gap-6 mb-8">
          {BUCKETS.map(({ id, title }) => (
            <div key={id} className="rounded-lg border border-kings-grey-light bg-kings-white">
              <ColumnHeader headingId={`${id}-column-title`} title={title} />
            </div>
          ))}
        </section>

        {mockIntentions.map((intention) => (
          <section className="grid grid-cols-4 gap-6 mb-12 last:mb-0" key={intention.id}>
            <IntentionRow intention={intention} />
          </section>
        ))}
      </main>
    </div>
  )
}

export default Canvas
