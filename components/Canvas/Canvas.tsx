'use client'

import { useState } from 'react'
import { DndContext, type DragEndEvent } from '@dnd-kit/core'

import { AddIntentionModal } from '@/components/Canvas/AddIntentionModal'
import { mockIntentions } from '@/data/mockIntentions'
import { BUCKETS, bucketOrder } from '@/lib/buckets'
import { IntentionRow } from '@/components/Canvas/IntentionRow'
import type { BucketId, Step } from '@/types/canvas'

export function Canvas() {
  const [intentions, setIntentions] = useState(mockIntentions)
  const [modalOpen, setModalOpen] = useState(false)

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

  const handleAddIntention = (title: string, description: string, bucket: BucketId) => {
    const timestamp = new Date().toISOString()
    setIntentions((prev) => [
      ...prev,
      {
        id: `int-${Date.now()}`,
        title,
        description,
        bucket,
        steps: [],
        createdAt: timestamp,
        updatedAt: timestamp
      }
    ])
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <main className="px-8 py-10 w-full overflow-x-hidden">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-kings-red">Your Intentions</h1>
          <button
            onClick={() => setModalOpen(true)}
            className="border border-kings-red text-kings-red px-4 py-2 text-sm rounded-md hover:bg-kings-red hover:text-white transition-colors"
          >
            ＋ Add Intention
          </button>
        </div>
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

        <AddIntentionModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onAdd={handleAddIntention}
        />
      </main>
    </DndContext>
  )
}

export default Canvas
