'use client'

import { useState } from 'react'
import { DndContext, type DragEndEvent, type DragStartEvent, type DragCancelEvent } from '@dnd-kit/core'

import { AddIntentionModal } from '@/components/Canvas/AddIntentionModal'
import { mockIntentions } from '@/data/mockIntentions'
import { BUCKETS, bucketOrder } from '@/lib/buckets'
import { IntentionRow } from '@/components/Canvas/IntentionRow'
import type { BucketId, Intention, Step } from '@/types/canvas'
import { useToast } from '@/lib/toast'
import { concertinaSteps } from '@/lib/steps'

export function Canvas() {
  const [intentions, setIntentions] = useState(mockIntentions)
  const [modalOpen, setModalOpen] = useState(false)
  const toast = useToast()

  const handleDragStart = (_event: DragStartEvent) => {
    document.body.classList.add('dragging')
  }

  const handleDragCancel = (_event: DragCancelEvent) => {
    document.body.classList.remove('dragging')
  }

  const handleDragEnd = (event: DragEndEvent) => {
    document.body.classList.remove('dragging')
    const { active, over } = event

    if (!active || !over) return

    const activeData = active.data?.current

    if (!activeData) return

    const overId = String(over.id)

    if (overId.startsWith('trash-')) {
      if (activeData.type === 'step') {
        const draggedStep = activeData.step as Step | undefined

        if (!draggedStep) {
          return
        }

        setIntentions((prev) =>
          prev.map((intention) => {
            if (intention.id !== draggedStep.intentionId) return intention

            const remainingSteps = intention.steps.filter((step) => step.id !== draggedStep.id)
            if (remainingSteps.length === intention.steps.length) {
              return intention
            }

            return { ...intention, steps: remainingSteps }
          })
        )
      } else if (activeData.type === 'intention') {
        const draggedIntention = activeData.intention as Intention | undefined

        if (!draggedIntention) {
          return
        }

        setIntentions((prev) => prev.filter((intention) => intention.id !== draggedIntention.id))
      }

      return
    }

    if (activeData.type === 'step') {
      const draggedStep = activeData.step as Step | undefined

      if (!draggedStep) return

      const dropData = over.data?.current as
        | { intentionId: string; bucket: Step['bucket'] }
        | undefined

      if (!dropData) return

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

      return
    }

    if (activeData.type === 'intention') {
      const draggedIntention = activeData.intention as Intention | undefined

      if (!draggedIntention) return

      const dropData = over.data?.current as { bucket?: BucketId } | undefined
      const rawTarget = dropData?.bucket ?? (overId.includes(':') ? overId.split(':').pop() : overId)
      const targetBucket = rawTarget as BucketId | undefined
      const validBuckets = BUCKETS.map((bucket) => bucket.id)

      if (!targetBucket || !validBuckets.includes(targetBucket)) {
        return
      }

      if (targetBucket === 'do-now') {
        toast.warning("Intentions can’t be placed in Do Now.")
        return
      }

      if (targetBucket === draggedIntention.bucket) {
        return
      }

      const targetIndex = bucketOrder[targetBucket]
      const currentIndex = bucketOrder[draggedIntention.bucket]

      if (targetIndex === undefined || currentIndex === undefined) {
        console.warn('Blocked drop: unknown bucket ordering')
        return
      }

      let intentionMoved = false
      const bucketTitle = BUCKETS.find((bucket) => bucket.id === targetBucket)?.title ?? targetBucket

      setIntentions((prev) => {
        const updatedIntentions = prev.map((intention) => {
          if (intention.id !== draggedIntention.id) return intention

          intentionMoved = true

          const baseIntention: Intention = {
            ...intention,
            bucket: targetBucket,
            updatedAt: new Date().toISOString()
          }

          if (targetIndex < currentIndex) {
            return {
              ...baseIntention,
              steps: concertinaSteps(prev, targetBucket, intention.id)
            }
          }

          return baseIntention
        })
        return updatedIntentions
      })

      if (intentionMoved) {
        toast.success(`Moved “${draggedIntention.title}” to ${bucketTitle}.`)
      }
    }
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
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
      <main className="max-w-6xl mx-auto px-6 py-10 text-kings-black bg-white">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-semibold text-kings-red">Your Intentions</h1>
            <button
              onClick={() => setModalOpen(true)}
              className="border border-kings-red text-kings-red text-sm px-3 py-1.5 rounded-md hover:bg-kings-red hover:text-white transition-colors"
            >
              ＋ Add Intention
            </button>
          </div>

          <div className="grid grid-cols-4 gap-6 mb-3">
            {BUCKETS.map((bucket) => (
              <div key={bucket.id} className="relative h-5">
                <span
                  className="absolute left-1/2 -translate-x-1/2 text-kings-red/90 text-xs font-medium uppercase tracking-widest leading-none px-1 text-center select-none"
                >
                  {bucket.title}
                </span>
              </div>
            ))}
          </div>
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
