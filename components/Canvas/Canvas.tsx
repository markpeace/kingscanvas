'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useUser } from '@/context/UserContext'
import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  type DragCancelEvent,
  pointerWithin,
  closestCenter,
  rectIntersection,
  type CollisionDetection
} from '@dnd-kit/core'
import toast from 'react-hot-toast'

import { AddIntentionModal } from '@/components/Canvas/AddIntentionModal'
import { BUCKETS, bucketOrder } from '@/lib/buckets'
import { IntentionRow } from '@/components/Canvas/IntentionRow'
import { debug } from '@/lib/debug'
import type { BucketId, Intention, Step } from '@/types/canvas'
import { concertinaSteps } from '@/lib/steps'
import useAutosave from '@/hooks/useAutosave'
import SaveStatus from '@/components/Canvas/SaveStatus'

export function Canvas() {
  const { status } = useUser()
  const [intentions, setIntentions] = useState<Intention[]>([])
  const [loadingIntentions, setLoadingIntentions] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [highlightBucket, setHighlightBucket] = useState<BucketId | null>(null)
  const [trashSuccessId, setTrashSuccessId] = useState<string | null>(null)
  const [trashSuccessType, setTrashSuccessType] = useState<'step' | 'intention' | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const highlightTimeoutRef = useRef<number | null>(null)
  const trashTimeoutRef = useRef<number | null>(null)
  const announcementTimeoutRef = useRef<number | null>(null)
  const autosavePayload = useMemo(() => ({ intentions }), [intentions])
  const { saving, error, lastSavedAt, retryCount } = useAutosave(
    autosavePayload,
    '/api/intentions',
    1500,
    3
  )
  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        window.clearTimeout(highlightTimeoutRef.current)
      }

      if (trashTimeoutRef.current) {
        window.clearTimeout(trashTimeoutRef.current)
        trashTimeoutRef.current = null
      }

      setTrashSuccessId(null)
      setTrashSuccessType(null)

      if (announcementTimeoutRef.current) {
        window.clearTimeout(announcementTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (status !== 'authenticated') {
      return
    }

    let ignore = false

    const loadIntentions = async () => {
      setLoadingIntentions(true)
      debug.trace('Canvas: loading intentions for current user', {
        endpoint: '/api/intentions',
        time: new Date().toISOString()
      })

      try {
        const res = await fetch('/api/intentions')
        const data: { intentions?: Intention[]; error?: string } = await res.json()

        if (!res.ok) {
          throw new Error(data.error || 'Failed to load')
        }

        if (!data.intentions || data.intentions.length === 0) {
          debug.info('Canvas: no saved intentions found, initialising empty board')
          if (!ignore) {
            setIntentions([])
          }
        } else {
          debug.info('Canvas: loaded intentions', { count: data.intentions.length })
          if (!ignore) {
            setIntentions(data.intentions)
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        debug.error('Canvas: failed to load intentions', { message })
        if (!ignore) {
          setIntentions([])
        }
      } finally {
        if (!ignore) {
          setLoadingIntentions(false)
        }
      }
    }

    loadIntentions()

    return () => {
      ignore = true
    }
  }, [status])

  const saveIntentionsManually = useCallback(async () => {
    debug.trace('Canvas: manual save triggered', {
      count: intentions.length,
      time: new Date().toISOString()
    })

    try {
      const res = await fetch('/api/intentions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intentions })
      })

      debug.info('Canvas: manual save result', { status: res.status })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        debug.error('Canvas: manual save failed', {
          status: res.status,
          response: data
        })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      debug.error('Canvas: manual save errored', { message })
    }
  }, [intentions])

  const triggerHighlight = useCallback((bucket: BucketId | null) => {
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
  }, [])

  const triggerTrashSuccess = useCallback((intentionId: string, type: 'step' | 'intention') => {
    if (trashTimeoutRef.current) {
      window.clearTimeout(trashTimeoutRef.current)
      trashTimeoutRef.current = null
    }

    setTrashSuccessId(intentionId)
    setTrashSuccessType(type)
    const duration = type === 'intention' ? 600 : 500
    trashTimeoutRef.current = window.setTimeout(() => {
      setTrashSuccessId(null)
      setTrashSuccessType(null)
      trashTimeoutRef.current = null
    }, duration)
  }, [])

  const handleDragStart = useCallback((_event: DragStartEvent) => {
    document.body.classList.add('dragging')
  }, [])

  const handleDragCancel = useCallback((_event: DragCancelEvent) => {
    document.body.classList.remove('dragging')
  }, [])

  const announce = useCallback((message: string) => {
    if (announcementTimeoutRef.current) {
      window.clearTimeout(announcementTimeoutRef.current)
      announcementTimeoutRef.current = null
    }

    setAnnouncement(message)
    announcementTimeoutRef.current = window.setTimeout(() => {
      setAnnouncement('')
      announcementTimeoutRef.current = null
    }, 1000)
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      document.body.classList.remove('dragging')
      const { active, over } = event

      if (!active || !over) return

      const activeData = active.data?.current

      if (!activeData) return

      const overId = String(over.id)

      console.debug('Drop target:', over.id)

      if (overId.startsWith('trash')) {
        const trashIntentionId = overId.replace(/^trash-?/, '')

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
            triggerTrashSuccess(trashIntentionId || draggedStep.intentionId, 'step')
            toast.success('Step deleted')
            announce(`Deleted step "${draggedStep.title}".`)
          }

          return
        }

        if (activeData.type === 'intention') {
          const draggedIntention = activeData.intention as Intention | undefined

          if (!draggedIntention) {
            return
          }

          setIntentions((prev) => prev.filter((intention) => intention.id !== draggedIntention.id))
          triggerTrashSuccess(trashIntentionId || draggedIntention.id, 'intention')
          toast.success('Intention deleted')
          announce(`Deleted intention "${draggedIntention.title}".`)
          return
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
    },
    [announce, triggerHighlight, triggerTrashSuccess]
  )

  const moveStepWithKeyboard = useCallback(
    (intention: Intention, step: Step, direction: 'forward' | 'backward') => {
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
    },
    [announce, triggerHighlight]
  )

  const moveIntentionWithKeyboard = useCallback(
    (intention: Intention, direction: 'forward' | 'backward') => {
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
    },
    [announce, triggerHighlight]
  )

  const handleAddStep = useCallback((intentionId: string, bucket: Step['bucket'], title: string) => {
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
  }, [])

  const handleAddIntention = useCallback((title: string, description: string, bucket: BucketId) => {
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
  }, [])

  const handleDeleteStep = useCallback(
    (step: Step) => {
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
        toast.success('Step deleted')
        announce(`Deleted step "${step.title}".`)
      }
    },
    [announce]
  )

  const handleDeleteIntention = useCallback(
    (intentionId: string) => {
      let deletedTitle: string | null = null
      setIntentions((prev) =>
        prev.filter((intentionItem) => {
          if (intentionItem.id === intentionId) {
            deletedTitle = intentionItem.title
            return false
          }

          return true
        })
      )

      if (deletedTitle) {
        toast.success('Intention deleted')
        announce(`Deleted intention "${deletedTitle}".`)
      }
    },
    [announce]
  )

  const renderedIntentions = useMemo(
    () =>
      intentions.map((intention) => (
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
          trashSuccessType={trashSuccessType}
        />
      )),
    [
      handleAddStep,
      handleDeleteIntention,
      handleDeleteStep,
      highlightBucket,
      intentions,
      moveIntentionWithKeyboard,
      moveStepWithKeyboard,
      trashSuccessId,
      trashSuccessType
    ]
  )

  const collisionDetection: CollisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args)

    if (pointerCollisions.length > 0) {
      const trashHit = pointerCollisions.find((collision) =>
        String(collision.id).startsWith('trash')
      )

      if (trashHit) {
        return [trashHit]
      }

      return pointerCollisions
    }

    const rectangleCollisions = rectIntersection(args)

    if (rectangleCollisions.length > 0) {
      return rectangleCollisions
    }

    return closestCenter(args)
  }

  const triggerAISuggestionTest = useCallback(async () => {
    const payload = {
      intentionId: 'test-intention',
      intentionText: 'Become a teacher',
      intentionBucket: 'after-graduation',
      historyAccepted: ['Apply for PGCE'],
      historyRejected: ['Volunteer in a school']
    }

    debug.trace('Canvas: manual AI suggestion test triggered', payload)

    try {
      const res = await fetch('/api/ai/suggest-steps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      debug.info('Canvas: AI suggestion test result', data)

      const suggestionCount = Array.isArray(data?.suggestions) ? data.suggestions.length : 0
      alert(
        suggestionCount
          ? `AI returned ${suggestionCount} suggestion${suggestionCount === 1 ? '' : 's'}`
          : 'No suggestions returned'
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      debug.error('Canvas: AI suggestion test errored', { message })
      alert('Unable to fetch AI suggestions')
    }
  }, [])

  if (status === 'loading') {
    return <p>Loading…</p>
  }

  if (status === 'unauthenticated') {
    return null
  }

  if (loadingIntentions) {
    return <p style={{ textAlign: 'center' }}>Loading your intentions…</p>
  }

  return (
    <>
      <DndContext
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
        collisionDetection={collisionDetection}
      >
        <button
          onClick={saveIntentionsManually}
          style={{ position: 'fixed', bottom: 10, left: 10 }}
        >
          Save Now
        </button>
        <a
          href="#main-canvas"
          className="sr-only focus:not-sr-only focus-visible:ring-2 focus-visible:ring-kings-red/40 focus-visible:ring-offset-2 focus:outline-none absolute top-2 left-2 bg-white border border-kings-red text-kings-red px-3 py-1 rounded"
        >
          Skip to Canvas
        </a>
        <div aria-live="polite" className="sr-only" id="canvas-announcer">
          {announcement}
        </div>
        <main id="main-canvas" className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-10 py-8 lg:py-12 text-kings-black bg-white">
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
          {renderedIntentions}

          <AddIntentionModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            onAdd={handleAddIntention}
          />
        </main>
        <SaveStatus
          saving={saving}
          error={error}
          lastSavedAt={lastSavedAt}
          retryCount={retryCount}
        />
      </DndContext>
      <div
        style={{
          position: 'fixed',
          bottom: '12px',
          right: '12px',
          zIndex: 9999
        }}
      >
        <button
          onClick={triggerAISuggestionTest}
          style={{
            background: '#ffffff',
            border: '1px solid #ddd',
            borderRadius: '4px',
            padding: '6px 10px',
            fontSize: '12px',
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
          }}
        >
          Test AI Suggestions
        </button>
      </div>
    </>
  )
}

export default Canvas
