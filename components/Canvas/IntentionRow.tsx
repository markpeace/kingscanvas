'use client';

import { useDndContext, useDroppable } from '@dnd-kit/core';
import { useState } from 'react';

import { AddStepModal } from '@/components/Canvas/AddStepModal';
import { IntentionCard } from '@/components/Canvas/IntentionCard';
import { StepCard } from '@/components/Canvas/StepCard';
import { TrashZone } from '@/components/Canvas/TrashZone';
import { BUCKETS, isBefore } from '@/lib/buckets';
import { Intention, Step } from '@/types/canvas';

type IntentionRowProps = {
  intention: Intention;
  onAddStep: (bucket: Step['bucket'], title: string) => void;
};

type BucketColumnProps = {
  intention: Intention;
  bucketId: Step['bucket'];
  steps: Step[];
  isIntentionBucket: boolean;
  isEarlier: boolean;
  isLater: boolean;
  onAddStepClick: () => void;
};

function BucketColumn({
  intention,
  bucketId,
  steps,
  isIntentionBucket,
  isEarlier,
  isLater,
  onAddStepClick,
}: BucketColumnProps) {
  const dropId = `${intention.id}:${bucketId}`;
  const { setNodeRef, isOver } = useDroppable({
    id: dropId,
    data: { intentionId: intention.id, bucket: bucketId },
  });

  return (
    <div
      ref={setNodeRef}
      className={[
        'border border-kings-grey-light rounded-md p-4 min-h-[140px] flex flex-col gap-3 transition-colors bg-white',
        isOver ? 'shadow-sm border-kings-red/40' : '',
        isLater ? 'opacity-70' : '',
      ].join(' ')}
    >
      {isIntentionBucket && <IntentionCard intention={intention} />}

      {steps.length > 0 ? (
        <div className="flex flex-col gap-3">
          {steps.map((step) => (
            <StepCard key={step.id} step={step} />
          ))}
        </div>
      ) : (
        isEarlier && (
          <div className="flex items-center justify-center border border-kings-grey-light border-dashed rounded-md h-[120px] text-kings-grey-dark/70 text-sm italic">
            Empty — Add Step
          </div>
        )
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
  );
}

export function IntentionRow({ intention, onAddStep }: IntentionRowProps) {
  const [modalBucket, setModalBucket] = useState<Step['bucket'] | null>(null);
  const { active } = useDndContext();
  const isDragging = Boolean(active);

  return (
    <>
      <div className={`relative group${isDragging ? ' dragging' : ''}`}>
        <section
          aria-label={`Intention: ${intention.title}`}
          className="grid grid-cols-4 gap-6 mb-12"
          style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}
        >
          {BUCKETS.map(({ id: colBucket }) => {
            const isIntentionBucket = colBucket === intention.bucket;
            const isEarlier = isBefore(colBucket, intention.bucket);
            const isLater = !isEarlier && !isIntentionBucket;

            const stepsForBucket = intention.steps.filter((step) => step.bucket === colBucket);

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
            );
          })}
        </section>

        <div className="absolute top-0 right-0 flex items-center justify-center h-full pointer-events-none group-[.dragging]:pointer-events-auto">
          <TrashZone intentionId={intention.id} />
        </div>
      </div>

      <AddStepModal
        isOpen={!!modalBucket}
        onClose={() => setModalBucket(null)}
        onAdd={(title) => {
          if (modalBucket) onAddStep(modalBucket, title);
        }}
      />
    </>
  );
}

export default IntentionRow;
