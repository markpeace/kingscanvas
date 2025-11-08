'use client'

import { useEffect, useRef, useState } from 'react'
import { DndContext, type DragEndEvent, type DragStartEvent, type DragCancelEvent } from '@dnd-kit/core'
import toast from 'react-hot-toast'

import { AddIntentionModal } from '@/components/Canvas/AddIntentionModal'
import { mockIntentions } from '@/data/mockIntentions'
import { BUCKETS, bucketOrder } from '@/lib/buckets'
import { IntentionRow } from '@/components/Canvas/IntentionRow'
import type { BucketId, Intention, Step } from '@/types/canvas'
import { concertinaSteps } from '@/lib/steps'

export function Canvas() {
  const [intentions, setIntentions] = useState(mockIntentions)
  const [modalOpen, setModalOpen] = useState(false)
  const [highlightBucket, setHighlightBucket] = useState<BucketId | null>(null)
  const [trashSuccessId, setTrashSuccessId] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const highlightTimeoutRef = useRef<number | null>(null)
  const trashTimeoutRef = useRef<number | null>(null)
  const announcementTimeoutRef = useRef<number | null>(null)
  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        window.clearTimeout(highlightTimeoutRef.current)
      }

      if (trashTimeoutRef.current) {
        window.clearTimeout(trashTimeoutRef.current)
      }

      if (announcementTimeoutRef.current) {
        window.clearTimeout(announcementTimeoutRef.current)
      }
    }
  }, [])

  const triggerHighlight = (bucket: BucketId | null) => {
    if (highlightTimeoutRef.current) {
      window.clearTimeout(highlightTimeoutRef.current)
      highlightTimeoutRef.current = null
    }

    if (!bucket) {
      setHighlightBucket(null)
      return
    }

    setHighlightBucket(bucket)
    highlightTimeoutRef.current = window.setTimeout(() => {
      setHighlightBucket(null)
      highlightTimeoutRef.current = null
    }, 300)
  }

  const triggerTrashSuccess = (intentionId: string) => {
    if (trashTimeoutRef.current) {
      window.clearTimeout(trashTimeoutRef.current)
      trashTimeoutRef.current = null
    }

    setTrashSuccessId(intentionId)
    trashTimeoutRef.current = window.setTimeout(() => {
      setTrashSuccessId(null)
      trashTimeoutRef.current = null
    }, 500)
  }

  const handleDragStart = (_event: DragStartEvent) => {
    document.body.classList.add('dragging')
  }

  const handleDragCancel = (_event: DragCancelEvent) => {
    document.body.classList.remove('dragging')
  }

  const announce = (message: string) => {
    if (announcementTimeoutRef.current) {
      window.clearTimeout(announcementTimeoutRef.current)
      announcementTimeoutRef.current = null
    }

    setAnnouncement(message)
    announcementTimeoutRef.current = window.setTimeout(() => {
      setAnnouncement('')
      announcementTimeoutRef.current = null
    }, 1000)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    document.body.classList.remove('dragging')
    const { active, over } = event

    if (!active || !over) return

    const activeData = active.data?.current

    if (!activeData) return

    const overId = String(over.id)

    if (overId.startsWith('trash-')) {
      const trashIntentionId = overId.replace('trash-', '')
      triggerTrashSuccess(trashIntentionId)

      if (activeData.type === 'step') {
        const draggedStep = activeData.step as Step | undefined

        if (!draggedStep) {
          return
        }

        let stepDeleted = false
        setIntentions((prev) =>
          prev.map((intention) => {
            if (intention.id !== draggedStep.intentionId) return intention

            const remainingSteps = intention.steps.filter((step) => step.id !== draggedStep.id)
            if (remainingSteps.length === intention.steps.length) {
              return intention
            }

            stepDeleted = true
            return { ...intention, steps: remainingSteps }
          })
        )

        if (stepDeleted) {
          toast.success('Deleted')
          announce(`Deleted step "${draggedStep.title}".`)
        }
      } else if (activeData.type === 'intention') {
        const draggedIntention = activeData.intention as Intention | undefined

        if (!draggedIntention) {
          return
        }

        setIntentions((prev) => prev.filter((intention) => intention.id !== draggedIntention.id))
        toast.success('Deleted')
        announce(`Deleted intention "${draggedIntention.title}".`)
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

      let stepMoved = false
      const bucketTitle = BUCKETS.find((bucket) => bucket.id === newBucket)?.title ?? newBucket

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

          stepMoved = true

          const updatedSteps = intention.steps.map((step) =>
            step.id === draggedStep.id
              ? { ...step, bucket: newBucket, order: stepsInTarget.length + 1 }
              : step
          )

          return { ...intention, steps: updatedSteps }
        })
      )

      if (stepMoved) {
        triggerHighlight(newBucket)
        toast.success(`Moved to ${bucketTitle}`)
        announce(`Moved "${draggedStep.title}" to ${bucketTitle}.`)
      }

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
        toast.error('Intentions can’t be placed in Do Now')
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
        triggerHighlight(targetBucket)
        toast.success(`Moved to ${bucketTitle}`)
        announce(`Moved "${draggedIntention.title}" to ${bucketTitle}.`)
      }
    }
  }

  const moveStepWithKeyboard = (intention: Intention, step: Step, direction: 'forward' | 'backward') => {
    const currentIndex = bucketOrder[step.bucket]
    const intentionIndex = bucketOrder[intention.bucket]

    if (currentIndex === undefined || intentionIndex === undefined) {
      return
    }

    const offset = direction === 'forward' ? 1 : -1
    const targetBucket = BUCKETS[currentIndex + offset]?.id as Step['bucket'] | undefined

    if (!targetBucket) {
      return
    }

    const targetIndex = bucketOrder[targetBucket]

    if (targetIndex === undefined) {
      return
    }

    if (direction === 'forward' && targetIndex >= intentionIndex) {
      announce('Steps cannot move beyond their intention bucket.')
      return
    }

    let stepMoved = false
    const bucketTitle = BUCKETS.find((bucket) => bucket.id === targetBucket)?.title ?? targetBucket

    setIntentions((prev) =>
      prev.map((currentIntention) => {
        if (currentIntention.id !== intention.id) return currentIntention

        const stepsInTarget = currentIntention.steps.filter(
          (existingStep) => existingStep.bucket === targetBucket && existingStep.id !== step.id
        )

        const updatedSteps = currentIntention.steps.map((existingStep) => {
          if (existingStep.id !== step.id) {
            return existingStep
          }

          stepMoved = true
          return {
            ...existingStep,
            bucket: targetBucket,
            order: stepsInTarget.length + 1
          }
        })

        return { ...currentIntention, steps: updatedSteps }
      })
    )

    if (stepMoved) {
      triggerHighlight(targetBucket)
      toast.success(`Moved to ${bucketTitle}`)
      announce(`Moved "${step.title}" to ${bucketTitle}.`)
    }
  }

  const moveIntentionWithKeyboard = (intention: Intention, direction: 'forward' | 'backward') => {
    const currentIndex = bucketOrder[intention.bucket]

    if (currentIndex === undefined) {
      return
    }

    const offset = direction === 'forward' ? 1 : -1
    const targetBucket = BUCKETS[currentIndex + offset]?.id as BucketId | undefined

    if (!targetBucket) {
      return
    }

    if (targetBucket === 'do-now') {
      toast.error('Intentions can’t be placed in Do Now')
      announce('Intentions can’t be placed in Do Now.')
      return
    }

    if (targetBucket === intention.bucket) {
      return
    }

    const targetIndex = bucketOrder[targetBucket]

    if (targetIndex === undefined) {
      return
    }

    let intentionMoved = false
    const bucketTitle = BUCKETS.find((bucket) => bucket.id === targetBucket)?.title ?? targetBucket

    setIntentions((prev) => {
      const updatedIntentions = prev.map((currentIntention) => {
        if (currentIntention.id !== intention.id) return currentIntention

        intentionMoved = true

        const baseIntention: Intention = {
          ...currentIntention,
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
      triggerHighlight(targetBucket)
      toast.success(`Moved to ${bucketTitle}`)
      announce(`Moved "${intention.title}" to ${bucketTitle}.`)
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

  const handleDeleteStep = (step: Step) => {
    let deleted = false
    setIntentions((prev) =>
      prev.map((intention) => {
        if (intention.id !== step.intentionId) return intention

        const remainingSteps = intention.steps.filter((existingStep) => existingStep.id !== step.id)
        if (remainingSteps.length === intention.steps.length) {
          return intention
        }

        deleted = true
        return { ...intention, steps: remainingSteps }
      })
    )

    if (deleted) {
      toast.success('Deleted')
      announce(`Deleted step "${step.title}".`)
    }
  }

  const handleDeleteIntention = (intentionId: string) => {
    const intention = intentions.find((item) => item.id === intentionId)
    setIntentions((prev) => prev.filter((intentionItem) => intentionItem.id !== intentionId))

    if (intention) {
      toast.success('Deleted')
      announce(`Deleted intention "${intention.title}".`)
    }
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
      <a
        href="#main-canvas"
        className="sr-only focus:not-sr-only focus-visible:ring-2 focus-visible:ring-kings-red/40 focus-visible:ring-offset-2 focus:outline-none absolute top-2 left-2 bg-white border border-kings-red text-kings-red px-3 py-1 rounded"
      >
        Skip to Canvas
      </a>
      <div aria-live="polite" className="sr-only" id="canvas-announcer">
        {announcement}
      </div>
      <main id="main-canvas" className="max-w-6xl mx-auto px-6 py-10 text-kings-black bg-white">
        {/* HEADER GROUP */}
        <header className="mb-8">
          {/* Title + Button Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3">
            <h1 className="text-lg sm:text-xl font-semibold text-kings-red leading-tight">Your Intentions</h1>
            <button
              onClick={() => setModalOpen(true)}
              className="border border-kings-red text-kings-red text-sm px-3 py-1.5 rounded-md hover:bg-kings-red hover:text-white transition-colors w-fit self-start sm:self-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-kings-red/40 focus-visible:ring-offset-2"
            >
              ＋ Add Intention
            </button>
          </div>

          {/* Column Headers */}
          <div className="grid grid-cols-4 gap-6 mt-1 mb-2">
            {BUCKETS.map((b) => (
              <div key={b.id} className="relative h-5 flex justify-center">
                <span
                  className="absolute left-1/2 -translate-x-1/2 text-kings-red/90 text-xs font-medium uppercase tracking-widest leading-none text-center select-none"
                >
                  {b.title}
                </span>
              </div>
            ))}
          </div>
        </header>
        {intentions.map((intention) => (
          <IntentionRow
            key={intention.id}
            intention={intention}
            onAddStep={(bucket, title) => handleAddStep(intention.id, bucket, title)}
            onDeleteStep={handleDeleteStep}
            onDeleteIntention={handleDeleteIntention}
            onMoveStep={moveStepWithKeyboard}
            onMoveIntention={moveIntentionWithKeyboard}
            highlightBucket={highlightBucket}
            trashSuccessId={trashSuccessId}
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
