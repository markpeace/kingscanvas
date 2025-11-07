'use client'

import { useState } from 'react'
import { DndContext, type DragEndEvent } from '@dnd-kit/core'

import { mockIntentions } from '@/data/mockIntentions'
import { BUCKETS, bucketOrder } from '@/lib/buckets'
import { IntentionRow } from '@/components/Canvas/IntentionRow'
import type { Step } from '@/types/canvas'

export function Canvas() {
  const [intentions, setIntentions] = useState(mockIntentions)

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    const draggedStep = active?.data?.current?.step as Step | undefined
    const dropData = over?.data?.current as { intentionId: string; bucket: Step['bucket'] } | undefined

    if (!draggedStep || !dropData) return

    const { intentionId, bucket: newBucket } = dropData

    if (draggedStep.bucket === newBucket || draggedStep.intentionId !== intentionId) {
      return
    }

    setIntentions((prev) =>
      prev.map((intention) => {
        if (intention.id !== intentionId) return intention

        const intentionBucket = intention.bucket
        const newBucketOrder = bucketOrder[newBucket]
        const intentionOrder = bucketOrder[intentionBucket]

        if (newBucketOrder === undefined || intentionOrder === undefined) {
          console.warn('Blocked drop: unknown bucket ordering')
          return intention
        }

        if (newBucketOrder >= intentionOrder) {
          console.warn('Blocked drop: cannot move step after intention bucket')
          return intention
        }

        const stepsInTarget = intention.steps.filter(
          (step) => step.bucket === newBucket && step.id !== draggedStep.id
        )

        const updatedSteps = intention.steps.map((step) =>
          step.id === draggedStep.id
            ? { ...step, bucket: newBucket, order: stepsInTarget.length + 1 }
            : step
        )

        return { ...intention, steps: updatedSteps }
      })
    )
  }

  const handleAddStep = (intentionId: string, bucket: Step['bucket'], title: string) => {
    setIntentions((prev) =>
      prev.map((intention) => {
        if (intention.id !== intentionId) return intention

        const stepsInBucket = intention.steps.filter((step) => step.bucket === bucket)

        const newStep: Step = {
          id: `step-${Date.now()}`,
          intentionId,
          title,
          bucket,
          order: stepsInBucket.length + 1
        }

        return { ...intention, steps: [...intention.steps, newStep] }
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
          <IntentionRow
            key={intention.id}
            intention={intention}
            onAddStep={(bucket, title) => handleAddStep(intention.id, bucket, title)}
          />
        ))}
      </main>
    </DndContext>
  )
}

export default Canvas
