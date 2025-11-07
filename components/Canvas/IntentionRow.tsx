'use client'

import { useState } from 'react'

import { Intention, Step } from '@/types/canvas'
import { BUCKETS, isBefore } from '@/lib/buckets'
import { StepCard } from '@/components/Canvas/StepCard'
import { IntentionCard } from '@/components/Canvas/IntentionCard'
import { AddStepForm } from '@/components/Canvas/AddStepForm'

export function IntentionRow({ intention }: { intention: Intention }) {
  const [steps, setSteps] = useState<Step[]>(intention.steps || [])

  const handleAddStep = (bucket: string, title: string) => {
    const newStep: Step = {
      id: `step-${Date.now()}`,
      intentionId: intention.id,
      title,
      bucket: bucket as Step['bucket'],
      order: steps.filter((s) => s.bucket === bucket).length + 1
    }
    setSteps([...steps, newStep])
  }

  return (
    <div
      aria-label={`Intention: ${intention.title}`}
      className="w-full grid grid-cols-4 gap-6 mb-10"
      style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}
    >
      {BUCKETS.map(({ id: colBucket }) => {
        const isIntentionBucket = colBucket === intention.bucket
        const isEarlier = isBefore(colBucket, intention.bucket)
        const isLater = !isEarlier && !isIntentionBucket

        const stepsForBucket = steps.filter((s) => s.bucket === colBucket)

        return (
          <div
            key={colBucket}
            className={[
              'border rounded-lg p-4 min-h-[140px] flex flex-col items-stretch justify-start',
              isLater
                ? 'bg-kings-grey-light/20 border-kings-grey-light/60'
                : 'bg-white border-kings-grey-light'
            ].join(' ')}
          >
            {isIntentionBucket && <IntentionCard intention={intention} />}

            {isEarlier && (
              <>
                <div className="flex flex-col gap-2 mb-2">
                  {stepsForBucket.map((s) => (
                    <StepCard key={s.id} step={s} />
                  ))}
                </div>
                <AddStepForm onAdd={(title) => handleAddStep(colBucket, title)} />
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
