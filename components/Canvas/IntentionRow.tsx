'use client'

import { useState } from 'react'

import type { BucketId, Intention, Step } from '@/types/canvas'

import { AddStepForm } from './AddStepForm'
import { BUCKETS, isBefore } from './constants'
import { IntentionCard } from './IntentionCard'
import { StepCard } from './StepCard'

export type IntentionRowProps = {
  intention: Intention
}

export function IntentionRow({ intention }: IntentionRowProps) {
  const [steps, setSteps] = useState<Step[]>(intention.steps ?? [])

  const handleAddStep = (bucket: BucketId, title: string) => {
    setSteps((prevSteps) => {
      const newStep: Step = {
        id: `step-${Date.now()}`,
        intentionId: intention.id,
        title,
        bucket,
        order: prevSteps.filter((step) => step.bucket === bucket).length + 1
      }

      return [...prevSteps, newStep]
    })
  }

  return (
    <section
      aria-label={`Intention row: ${intention.title}`}
      className="grid grid-cols-4 gap-6 mb-10 w-full min-w-0 items-start"
    >
      {BUCKETS.map(({ id: colBucket }) => {
        const isIntentionBucket = colBucket === intention.bucket
        const isEarlier = isBefore(colBucket, intention.bucket)
        const isLater = !isEarlier && !isIntentionBucket

        return (
          <div
            key={colBucket}
            className={[
              'rounded-lg border p-3 min-h-[120px] w-full min-w-0',
              isLater
                ? 'border-kings-grey-light/60 bg-kings-grey-light/20'
                : 'border-kings-grey-light bg-white'
            ].join(' ')}
            aria-disabled={isLater}
          >
            {isIntentionBucket && <IntentionCard intention={intention} />}

            {isEarlier && (
              <>
                <div className="space-y-3 mb-2">
                  {steps
                    .filter((step) => step.bucket === colBucket)
                    .sort((a, b) => a.order - b.order)
                    .map((step) => (
                      <StepCard key={step.id} step={step} />
                    ))}
                </div>
                <AddStepForm onAdd={(title) => handleAddStep(colBucket, title)} />
              </>
            )}
          </div>
        )
      })}
    </section>
  )
}
