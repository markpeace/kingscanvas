'use client'

import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'

import { AddStepModal } from '@/components/Canvas/AddStepModal'
import { IntentionCard } from '@/components/Canvas/IntentionCard'
import { StepCard } from '@/components/Canvas/StepCard'
import { BUCKETS, isBefore } from '@/lib/buckets'
import { Intention, Step } from '@/types/canvas'

type IntentionRowProps = {
  intention: Intention
  onAddStep: (bucket: Step['bucket'], title: string) => void
}

type BucketColumnProps = {
  intention: Intention
  bucketId: Step['bucket']
  steps: Step[]
  isIntentionBucket: boolean
  isEarlier: boolean
  isLater: boolean
  onAddStepClick: () => void
}

function BucketColumn({
  intention,
  bucketId,
  steps,
  isIntentionBucket,
  isEarlier,
  isLater,
  onAddStepClick
}: BucketColumnProps) {
  const dropId = `${intention.id}:${bucketId}`
  const { setNodeRef, isOver } = useDroppable({
    id: dropId,
    data: { intentionId: intention.id, bucket: bucketId }
  })

  return (
    <div
      ref={setNodeRef}
      className={[
        'border rounded-lg p-4 min-h-[140px] flex flex-col justify-start transition-colors',
        isOver
          ? 'bg-kings-grey-light/40'
          : isLater
            ? 'bg-kings-grey-light/20 border-kings-grey-light/60'
            : 'bg-white border-kings-grey-light'
      ].join(' ')}
    >
      {isIntentionBucket && <IntentionCard intention={intention} />}

      {steps.length > 0 && (
        <div className={`flex flex-col gap-2 mb-3 ${isIntentionBucket ? 'mt-3' : ''}`}>
          {steps.map((step) => (
            <StepCard key={step.id} step={step} />
          ))}
        </div>
      )}

      {isEarlier && (
        <button
          type="button"
          onClick={onAddStepClick}
          className="text-kings-grey-dark text-sm hover:text-kings-red mt-auto self-start"
        >
          ＋ Add Step
        </button>
      )}
    </div>
  )
}

export function IntentionRow({ intention, onAddStep }: IntentionRowProps) {
  const [modalBucket, setModalBucket] = useState<Step['bucket'] | null>(null)

  return (
    <>
      <div
        aria-label={`Intention: ${intention.title}`}
        className="w-full grid grid-cols-4 gap-6 mb-10"
        style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}
      >
        {BUCKETS.map(({ id: colBucket }) => {
          const isIntentionBucket = colBucket === intention.bucket
          const isEarlier = isBefore(colBucket, intention.bucket)
          const isLater = !isEarlier && !isIntentionBucket

          const stepsForBucket = intention.steps.filter((step) => step.bucket === colBucket)

          return (
            <BucketColumn
              key={`${intention.id}:${colBucket}`}
              intention={intention}
              bucketId={colBucket}
              steps={stepsForBucket}
              isIntentionBucket={isIntentionBucket}
              isEarlier={isEarlier}
              isLater={isLater}
              onAddStepClick={() => setModalBucket(colBucket)}
            />
          )
        })}
      </div>

      <AddStepModal
        isOpen={!!modalBucket}
        onClose={() => setModalBucket(null)}
        onAdd={(title) => {
          if (modalBucket) onAddStep(modalBucket, title)
        }}
      />
    </>
  )
}

export default IntentionRow
