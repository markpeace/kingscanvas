import type { ReactNode } from 'react'

import { Intention } from '@/types/canvas'

import { BUCKETS, isBefore } from './constants'
import { IntentionCard } from './IntentionCard'
import { StepCard } from './StepCard'

export type IntentionRowProps = {
  intention: Intention
}

export function IntentionRow({ intention }: IntentionRowProps) {
  return (
    <>
      {BUCKETS.map(({ id: colBucket }) => {
        const isIntentionBucket = colBucket === intention.bucket
        const isEarlier = isBefore(colBucket, intention.bucket)
        const isLater = !isEarlier && !isIntentionBucket

        let content: ReactNode = null

        if (isIntentionBucket) {
          content = <IntentionCard intention={intention} />
        } else if (isEarlier) {
          const steps = [...(intention.steps || [])]
            .filter((step) => step.bucket === colBucket)
            .sort((a, b) => a.order - b.order)

          content = (
            <div className="space-y-3">
              {steps.map((step) => (
                <StepCard key={step.id} step={step} />
              ))}
            </div>
          )
        }

        return (
          <div
            key={colBucket}
            className={[
              'rounded-lg border p-3 min-h-[140px] transition-colors',
              isLater
                ? 'border-kings-grey-light/60 bg-kings-grey-light/20'
                : 'border-kings-grey-light bg-white'
            ].join(' ')}
            aria-disabled={isLater}
          >
            {content}
          </div>
        )
      })}
    </>
  )
}
