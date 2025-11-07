'use client'

import { useState } from 'react'
import { DndContext, type DragEndEvent } from '@dnd-kit/core'

import { IntentionRow } from '@/components/Canvas/IntentionRow'
import { mockIntentions } from '@/data/mockIntentions'
import { BUCKETS } from '@/lib/buckets'
import type { BucketId } from '@/types/canvas'

export default function Canvas() {
  const [intentions, setIntentions] = useState(mockIntentions)

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const [activeIntentionId, stepId] = String(active.id).split(':')
    const [, overIntentionId, overBucket] = String(over.id).split('-') as [
      string,
      string,
      BucketId
    ]

    if (activeIntentionId !== overIntentionId) return

    setIntentions((prev) =>
      prev.map((intention) => {
        if (intention.id !== activeIntentionId) return intention

        const updatedSteps = intention.steps.map((step) =>
          step.id === stepId ? { ...step, bucket: overBucket } : step
        )

        return { ...intention, steps: updatedSteps }
      })
    )
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <main className="px-8 py-10 w-full overflow-x-hidden">
        <div className="grid grid-cols-4 gap-6 mb-6 text-kings-red font-semibold text-xl">
          {BUCKETS.map((bucket) => (
            <h2 key={bucket.id}>{bucket.title}</h2>
          ))}
        </div>
        {intentions.map((intention) => (
          <IntentionRow key={intention.id} intention={intention} />
        ))}
      </main>
    </DndContext>
  )
}
