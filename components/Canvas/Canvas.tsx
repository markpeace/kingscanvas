'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
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
import { getDistributionForIntentionBucket, type Bucket as DistributionBucket } from '@/lib/ai/distributionPlan'
import type { BucketId, Intention, Step } from '@/types/canvas'
import { concertinaSteps } from '@/lib/steps'
import useAutosave from '@/hooks/useAutosave'
import SaveStatus from '@/components/Canvas/SaveStatus'

const DEFAULT_BUCKET: BucketId = 'do-now'

const ghostStyle: CSSProperties = {
  opacity: 0.6,
  background: '#f7f7f7',
  border: '1px dashed #d0d0d0',
  borderRadius: '8px',
  padding: '12px',
  height: '72px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#888',
  fontSize: '12px',
  pointerEvents: 'none',
  transition: 'opacity 0.3s ease'
}

function normaliseBucketId(bucket?: string): BucketId {
  if (!bucket) {
    return DEFAULT_BUCKET
  }

  const aliasMap: Partial<Record<string, BucketId>> = {
    after_grad: 'after-graduation',
    before_grad: 'before-graduation',
    do_now: 'do-now',
    do_soon: 'do-later'
  }

  const aliasBucket = aliasMap[bucket]

  if (aliasBucket) {
    return aliasBucket
  }

  const match = BUCKETS.find((candidate) => candidate.id === bucket)
  return (match?.id ?? DEFAULT_BUCKET) as BucketId
}

export function Canvas() {
  const { user, status } = useUser()
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
  const userEmail = user?.email ?? 'test@test.com'
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

  const getIntentionForBucket = useCallback(
    (intentionId: string, bucket: BucketId) => {
      const exactMatch = intentions.find((item) => item.id === intentionId)

      if (exactMatch) {
        return exactMatch
      }

      return intentions.find((item) => {
        if (item.bucket === bucket) {
          return true
        }

        return item.steps.some((step) => step.bucket === bucket)
      })
    },
    [intentions]
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

  const handleAddAIStep = useCallback(
    async (intentionId: string, bucket: Step['bucket']) => {
      debug.trace('Canvas: AI on-demand suggestion requested', { bucket, intentionId })

      const intention = getIntentionForBucket(intentionId, bucket)

      if (!intention) {
        debug.error('Canvas: unable to resolve intention for bucket', { bucket, intentionId })
        return
      }

      const userEmail = user?.email ?? 'test@test.com'
      const ghostId = `ghost-${bucket}-${Date.now()}`
      const ghostBase: Step = {
        id: ghostId,
        intentionId: intention.id,
        title: 'Generating…',
        text: 'Generating…',
        bucket,
        order: 0,
        status: 'ghost',
        source: 'ai',
        user: userEmail
      }

      setIntentions((prev) =>
        prev.map((item) => {
          if (item.id !== intention.id) {
            return item
          }

          const stepsInBucket = item.steps.filter((step) => step.bucket === bucket)
          const ghostStep = { ...ghostBase, order: stepsInBucket.length + 1 }

          return { ...item, steps: [...item.steps, ghostStep] }
        })
      )

      debug.trace('Canvas: inserted on-demand ghost', { bucket, intentionId: intention.id })

      let history: { accepted: string[]; rejected: string[] } = { accepted: [], rejected: [] }

      try {
        const historyRes = await fetch(
          `/api/steps/history?intentionId=${encodeURIComponent(intention.id)}`
        )

        if (historyRes.ok) {
          history = (await historyRes.json()) || history
        } else {
          const errorBody = await historyRes.json().catch(() => ({}))
          debug.error('Canvas: on-demand history fetch failed', {
            bucket,
            intentionId: intention.id,
            status: historyRes.status,
            response: errorBody
          })
        }
      } catch (historyError) {
        const message = historyError instanceof Error ? historyError.message : 'Unknown error'
        debug.error('Canvas: on-demand history fetch errored', {
          bucket,
          intentionId: intention.id,
          message
        })
      }

      let finalStepId: string | null = null

      try {
        type SuggestionEntry = { _id?: string; text?: string }
        type SuggestionResponse = { suggestions?: SuggestionEntry[]; error?: string }

        const aiRes = await fetch('/api/ai/suggest-steps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            intentionId: intention.id,
            intentionText: intention.title,
            intentionBucket: bucket,
            historyAccepted: history.accepted,
            historyRejected: history.rejected
          })
        })

        const data = (await aiRes.json().catch(() => ({}))) as SuggestionResponse

        if (!aiRes.ok) {
          throw new Error(data?.error || 'AI suggestion failed')
        }

        const suggestions = Array.isArray(data?.suggestions) ? data.suggestions : []
        const suggestion = suggestions[0]

        debug.info('Canvas: AI on-demand suggestion received', {
          text: suggestion?.text || null
        })

        if (!suggestion || !suggestion.text) {
          throw new Error('AI suggestion returned no text')
        }

        finalStepId = `ai-${bucket}-${Date.now()}`
        const suggestionId = typeof suggestion._id === 'string' ? suggestion._id : undefined
        const suggestionText = suggestion.text

        setIntentions((prev) =>
          prev.map((item) => {
            if (item.id !== intention.id) {
              return item
            }

            const ghostStep = item.steps.find((step) => step.id === ghostId)
            const stepsInBucket = item.steps.filter(
              (step) => step.bucket === bucket && step.id !== ghostId
            )
            const hasGhost = Boolean(ghostStep)

            const finalStep: Step = {
              id: finalStepId as string,
              _id: suggestionId,
              intentionId: intention.id,
              title: suggestionText,
              text: suggestionText,
              bucket,
              order: ghostStep?.order ?? stepsInBucket.length + 1,
              status: 'suggested',
              source: 'ai',
              user: userEmail,
              createdAt: new Date().toISOString()
            }

            return {
              ...item,
              steps: hasGhost
                ? item.steps.map((step) => (step.id === ghostId ? finalStep : step))
                : [...item.steps, finalStep]
            }
          })
        )

        type PersistResponse = {
          insertedIds?: string[] | Record<string, unknown>
          error?: string
        }

        const persistRes = await fetch('/api/steps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ intentionId: intention.id, steps: [{ bucket, text: suggestionText }] })
        })

        const persistData = (await persistRes.json().catch(() => ({}))) as PersistResponse

        if (!persistRes.ok) {
          throw new Error(persistData?.error || 'Failed to persist suggestion')
        }

        const insertedIdsRaw = Array.isArray(persistData?.insertedIds)
          ? persistData.insertedIds
          : persistData?.insertedIds && typeof persistData.insertedIds === 'object'
          ? Object.values(persistData.insertedIds)
          : []

        const insertedId = insertedIdsRaw
          .map((value: unknown) => {
            if (!value) return null
            if (typeof value === 'string') return value
            if (typeof value === 'object' && 'toString' in value && typeof value.toString === 'function') {
              return value.toString()
            }
            return String(value)
          })
          .find((value): value is string => Boolean(value))

        if (insertedId && finalStepId) {
          setIntentions((prev) =>
            prev.map((item) => {
              if (item.id !== intention.id) {
                return item
              }

              return {
                ...item,
                steps: item.steps.map((step) =>
                  step.id === finalStepId ? { ...step, _id: insertedId } : step
                )
              }
            })
          )
        }

        debug.info('Canvas: on-demand suggestion persisted', {
          bucket,
          intentionId: intention.id
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        debug.error('Canvas: on-demand suggestion failed', {
          bucket,
          intentionId: intention.id,
          message
        })

        setIntentions((prev) =>
          prev.map((item) => {
            if (item.id !== intention.id) {
              return item
            }

            return {
              ...item,
              steps: item.steps.filter((step) => {
                if (step.id === ghostId) {
                  return false
                }

                if (finalStepId && step.id === finalStepId) {
                  return false
                }

                return true
              })
            }
          })
        )
      }
    },
    [getIntentionForBucket, user]
  )

  const mapBucketIdToDistributionBucket = useCallback((bucket: BucketId): DistributionBucket => {
    switch (bucket) {
      case 'after-graduation':
        return 'after_grad'
      case 'before-graduation':
        return 'before_grad'
      case 'do-later':
        return 'do_soon'
      case 'do-now':
      default:
        return 'do_now'
    }
  }, [])

  const mapDistributionBucketToBucketId = useCallback((bucket: DistributionBucket): BucketId => {
    switch (bucket) {
      case 'after_grad':
        return 'after-graduation'
      case 'before_grad':
        return 'before-graduation'
      case 'do_soon':
        return 'do-later'
      case 'do_now':
      default:
        return 'do-now'
    }
  }, [])

  const generateSuggestionsForIntention = useCallback(
    async (intention: Intention) => {
      const distributionBucket = mapBucketIdToDistributionBucket(intention.bucket)
      const distribution = getDistributionForIntentionBucket(distributionBucket)

      debug.trace('Distribution start', {
        intentionId: intention.id,
        bucket: intention.bucket,
        distribution
      })

      for (const item of distribution) {
        const targetBucket = mapDistributionBucketToBucketId(item.bucket)

        if (targetBucket === intention.bucket) {
          continue
        }

        for (let i = 0; i < item.count; i++) {
          const ghostId = `ghost-${targetBucket}-${Date.now()}-${i}`
          let assignedOrder = 0

          const createdAt = new Date().toISOString()

          setIntentions((prev) =>
            prev.map((candidate) => {
              if (candidate.id !== intention.id) {
                return candidate
              }

              const stepsInBucket = candidate.steps.filter((step) => step.bucket === targetBucket)
              assignedOrder = stepsInBucket.length + 1

              const ghostStep: Step = {
                id: ghostId,
                intentionId: intention.id,
                title: 'Generating…',
                text: 'Generating…',
                bucket: targetBucket,
                order: assignedOrder,
                status: 'ghost',
                source: 'ai',
                user: userEmail,
                createdAt
              }

              return {
                ...candidate,
                steps: [...candidate.steps, ghostStep]
              }
            })
          )

          debug.trace('Ghost added', {
            intentionId: intention.id,
            bucket: targetBucket,
            index: i + 1
          })

          let suggestion: { _id?: string; text?: string } | null = null

          try {
            const res = await fetch('/api/ai/suggest-steps', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                intentionId: intention.id,
                intentionText: intention.title,
                intentionBucket: targetBucket,
                historyAccepted: [],
                historyRejected: []
              })
            })

            const data = await res.json()
            if (!res.ok || !data.suggestions?.length) {
              throw new Error('No suggestion returned')
            }

            suggestion = data.suggestions[0]

            debug.info('Suggestion received', {
              intentionId: intention.id,
              bucket: targetBucket,
              preview: suggestion?.text?.slice(0, 80)
            })
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error'

            debug.error('Suggestion failed', {
              intentionId: intention.id,
              bucket: targetBucket,
              message
            })

            setIntentions((prev) =>
              prev.map((candidate) => {
                if (candidate.id !== intention.id) {
                  return candidate
                }

                return {
                  ...candidate,
                  steps: candidate.steps.filter((step) => step.id !== ghostId)
                }
              })
            )

            continue
          }

          const suggestionId = typeof suggestion?._id === 'string' ? suggestion._id : undefined
          const finalStepId = suggestionId ?? `${ghostId}-real`
          const suggestionText = suggestion?.text ?? ''
          const finalCreatedAt = new Date().toISOString()

          const finalStep: Step = {
            id: finalStepId,
            _id: suggestionId,
            intentionId: intention.id,
            title: suggestionText,
            text: suggestionText,
            bucket: targetBucket,
            order: assignedOrder,
            status: 'suggested',
            source: 'ai',
            user: userEmail,
            createdAt: finalCreatedAt
          }

          setIntentions((prev) =>
            prev.map((candidate) => {
              if (candidate.id !== intention.id) {
                return candidate
              }

              return {
                ...candidate,
                steps: candidate.steps.map((step) => (step.id === ghostId ? finalStep : step))
              }
            })
          )

          try {
            const res = await fetch('/api/steps', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                intentionId: intention.id,
                steps: [
                  {
                    bucket: targetBucket,
                    text: suggestionText
                  }
                ]
              })
            })

            const persistData = await res.json().catch(() => ({}))

            if (!res.ok) {
              throw new Error(persistData?.error || 'Failed to persist suggestion')
            }

            const insertedIdsRaw = Array.isArray(persistData?.insertedIds)
              ? persistData.insertedIds
              : persistData?.insertedIds && typeof persistData.insertedIds === 'object'
              ? Object.values(persistData.insertedIds)
              : []

            const insertedId = insertedIdsRaw
              .map((value: unknown) => {
                if (!value) return null
                if (typeof value === 'string') return value
                if (typeof value === 'object' && 'toString' in value && typeof value.toString === 'function') {
                  return value.toString()
                }
                return String(value)
              })
              .find((value: string | null): value is string => Boolean(value))

            if (insertedId) {
              setIntentions((prev) =>
                prev.map((candidate) => {
                  if (candidate.id !== intention.id) {
                    return candidate
                  }

                  return {
                    ...candidate,
                    steps: candidate.steps.map((step) =>
                      step.id === finalStepId
                        ? {
                            ...step,
                            _id: insertedId
                          }
                        : step
                    )
                  }
                })
              )
            }

            debug.info('Suggestion saved', {
              intentionId: intention.id,
              bucket: targetBucket
            })
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error'

            debug.error('Suggestion save failed', {
              intentionId: intention.id,
              bucket: targetBucket,
              message
            })
          }

          await new Promise((resolve) => setTimeout(resolve, 350))
        }
      }

      debug.info('Distribution complete', { intentionId: intention.id })
    },
    [mapBucketIdToDistributionBucket, mapDistributionBucketToBucketId, userEmail]
  )

  const handleAddIntention = useCallback(
    async (title: string, description: string, userSelectedBucket?: string) => {
      const now = Date.now()
      const timestamp = new Date(now).toISOString()
      const intentionId = `int-${now}`
      const resolvedBucket = normaliseBucketId(userSelectedBucket ?? 'after_grad')
      const baseIntention: Intention = {
        id: intentionId,
        title,
        description,
        bucket: resolvedBucket,
        steps: [],
        createdAt: timestamp,
        updatedAt: timestamp
      }

      setIntentions((prev) => [...prev, baseIntention])

      debug.trace('Canvas: intention created', {
        id: intentionId,
        title,
        bucket: resolvedBucket,
        userSelectedBucket: userSelectedBucket ?? null
      })

      generateSuggestionsForIntention(baseIntention)
    },
    [generateSuggestionsForIntention]
  )

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

  const handleAcceptSuggestion = useCallback(async (step: Step) => {
    const stepIdentifier = step._id ?? step.id
    debug.trace('Canvas: accept suggestion', { stepId: stepIdentifier })

    setIntentions((prev) =>
      prev.map((intention) => {
        if (intention.id !== step.intentionId) {
          return intention
        }

        return {
          ...intention,
          steps: intention.steps.map((existingStep) => {
            if (
              existingStep.id === step.id ||
              (step._id && existingStep._id === step._id)
            ) {
              return { ...existingStep, status: 'accepted' }
            }

            return existingStep
          })
        }
      })
    )

    if (!step._id) {
      debug.warn('Canvas: accept suggestion missing persisted id', { stepId: stepIdentifier })
      return
    }

    try {
      const res = await fetch('/api/steps', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepId: step._id, status: 'accepted' })
      })

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}))
        debug.error('Canvas: suggestion accept persist failed', {
          stepId: step._id,
          status: res.status,
          response: errorBody
        })
        return
      }

      debug.info('Canvas: suggestion accepted and persisted', { stepId: step._id })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      debug.error('Canvas: suggestion accept persistence errored', {
        stepId: step._id,
        message
      })
    }
  }, [])

  const handleRejectSuggestion = useCallback(async (step: Step) => {
    const stepIdentifier = step._id ?? step.id
    debug.trace('Canvas: reject suggestion', { stepId: stepIdentifier })

    setIntentions((prev) =>
      prev.map((intention) => {
        if (intention.id !== step.intentionId) {
          return intention
        }

        return {
          ...intention,
          steps: intention.steps.filter(
            (existingStep) =>
              existingStep.id !== step.id && (!step._id || existingStep._id !== step._id)
          )
        }
      })
    )

    if (!step._id) {
      debug.warn('Canvas: reject suggestion missing persisted id', { stepId: stepIdentifier })
      return
    }

    try {
      const res = await fetch('/api/steps', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepId: step._id, status: 'rejected' })
      })

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}))
        debug.error('Canvas: suggestion reject persist failed', {
          stepId: step._id,
          status: res.status,
          response: errorBody
        })
        return
      }

      debug.info('Canvas: suggestion rejected and persisted', { stepId: step._id })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      debug.error('Canvas: suggestion reject persistence errored', {
        stepId: step._id,
        message
      })
    }
  }, [])

  const renderedIntentions = useMemo(
    () =>
      intentions.map((intention) => (
        <IntentionRow
          key={intention.id}
          intention={intention}
          onAddStep={(bucket, title) => handleAddStep(intention.id, bucket, title)}
          onAddAIStep={(bucket) => handleAddAIStep(intention.id, bucket)}
          onDeleteStep={handleDeleteStep}
          onDeleteIntention={handleDeleteIntention}
          onMoveStep={moveStepWithKeyboard}
          onMoveIntention={moveIntentionWithKeyboard}
          onAcceptSuggestion={handleAcceptSuggestion}
          onRejectSuggestion={handleRejectSuggestion}
          highlightBucket={highlightBucket}
          trashSuccessId={trashSuccessId}
          trashSuccessType={trashSuccessType}
          ghostStyle={ghostStyle}
        />
      )),
    [
      handleAddStep,
      handleAddAIStep,
      handleDeleteIntention,
      handleDeleteStep,
      handleAcceptSuggestion,
      handleRejectSuggestion,
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
