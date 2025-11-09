'use client';

import { useDndContext, useDroppable } from '@dnd-kit/core';
import { useState } from 'react';

import { AddStepModal } from '@/components/Canvas/AddStepModal';
import { IntentionCard } from '@/components/Canvas/IntentionCard';
import { StepCard } from '@/components/Canvas/StepCard';
import { TrashZone } from '@/components/Canvas/TrashZone';
import { BUCKETS, isBefore } from '@/lib/buckets';
import { Intention, Step } from '@/types/canvas';

const emptyText: Record<Step['bucket'], string> = {
  'do-now': 'Start with a small action',
  'do-later': 'Line up the next steps',
  'before-graduation': 'Bigger work before finals',
  'after-graduation': 'Targets for post-grad',
};

type IntentionRowProps = {
  intention: Intention;
  onAddStep: (bucket: Step['bucket'], title: string) => void;
  onDeleteStep: (step: Step) => void;
  onDeleteIntention: (intentionId: string) => void;
  onMoveStep: (intention: Intention, step: Step, direction: 'forward' | 'backward') => void;
  onMoveIntention: (intention: Intention, direction: 'forward' | 'backward') => void;
  highlightBucket: Step['bucket'] | null;
  trashSuccessId?: string | null;
  trashSuccessType?: 'step' | 'intention' | null;
};

type BucketColumnProps = {
  intention: Intention;
  bucketId: Step['bucket'];
  steps: Step[];
  isIntentionBucket: boolean;
  isEarlier: boolean;
  isLater: boolean;
  highlightBucket: Step['bucket'] | null;
  onDeleteStep: (step: Step) => void;
  onDeleteIntention: (intentionId: string) => void;
  onAddStepClick: () => void;
  onMoveStep: (step: Step, direction: 'forward' | 'backward') => void;
  onMoveIntention: (direction: 'forward' | 'backward') => void;
  bucketTitle: string;
};

function BucketColumn({
  intention,
  bucketId,
  steps,
  isIntentionBucket,
  isEarlier,
  isLater,
  highlightBucket,
  onDeleteStep,
  onDeleteIntention,
  onAddStepClick,
  onMoveStep,
  onMoveIntention,
  bucketTitle,
}: BucketColumnProps) {
  const dropId = `${intention.id}:${bucketId}`;
  const { setNodeRef, isOver } = useDroppable({
    id: dropId,
    data: { intentionId: intention.id, bucket: bucketId },
  });

  return (
    <div
      ref={setNodeRef}
      role="region"
      aria-label={`${bucketTitle} bucket`}
      aria-dropeffect="move"
      className={[
        'border rounded-lg p-4 min-h-[140px] flex flex-col gap-3 transition-colors duration-150',
        highlightBucket === bucketId ? 'ring-2 ring-kings-red/50' : '',
        isOver ? 'shadow-sm border-kings-red/40' : '',
        isLater
          ? 'bg-kings-grey-light/20 border-kings-grey-light/60 opacity-70'
          : 'bg-white border-kings-grey-light'
      ].join(' ')}
    >
      {isIntentionBucket && (
        <IntentionCard
          intention={intention}
          onDelete={() => onDeleteIntention(intention.id)}
          onMoveForward={() => onMoveIntention('forward')}
          onMoveBackward={() => onMoveIntention('backward')}
        />
      )}

      {steps.length > 0 ? (
        <div className="flex flex-col gap-3">
          {steps.map((step) => (
            <StepCard
              key={step.id}
              step={step}
              onDelete={() => onDeleteStep(step)}
              onMoveForward={() => onMoveStep(step, 'forward')}
              onMoveBackward={() => onMoveStep(step, 'backward')}
            />
          ))}
        </div>
      ) : (
        isEarlier && (
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-kings-grey-light rounded-lg h-[120px] text-kings-grey-dark/70 text-xs italic gap-1 bg-white/60">
            <span className="text-base text-kings-grey-dark/60">＋</span>
            <p>{emptyText[bucketId] || 'Add Step'}</p>
          </div>
        )
      )}

      {isEarlier && (
        <button
          type="button"
          onClick={onAddStepClick}
          className="text-kings-grey-dark text-sm hover:text-kings-red mt-auto self-start focus:outline-none focus-visible:ring-2 focus-visible:ring-kings-red/40 focus-visible:ring-offset-2"
        >
          ＋ Add Step
        </button>
      )}
    </div>
  );
}

export function IntentionRow({
  intention,
  onAddStep,
  onDeleteStep,
  onDeleteIntention,
  onMoveStep,
  onMoveIntention,
  highlightBucket,
  trashSuccessId,
  trashSuccessType,
}: IntentionRowProps) {
  const [modalBucket, setModalBucket] = useState<Step['bucket'] | null>(null);
  const { active } = useDndContext();
  const isDragging = Boolean(active);

  return (
    <>
      <div className={`relative group${isDragging ? ' dragging' : ''}`}>
        <section
          id={intention.id}
          aria-label={`Intention: ${intention.title}`}
          className="scroll-mt-24 grid grid-cols-4 gap-x-4 sm:gap-x-6 lg:gap-x-8 gap-y-8 mb-12"
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
                highlightBucket={highlightBucket}
                onDeleteStep={onDeleteStep}
                onDeleteIntention={onDeleteIntention}
                onAddStepClick={() => setModalBucket(colBucket)}
                onMoveStep={(step, direction) => onMoveStep(intention, step, direction)}
                onMoveIntention={(direction) => onMoveIntention(intention, direction)}
                bucketTitle={BUCKETS.find((bucket) => bucket.id === colBucket)?.title ?? colBucket}
              />
            );
          })}
        </section>

        <div className="absolute top-1/2 -translate-y-1/2 right-4 z-50">
          <TrashZone
            intentionId={intention.id}
            didDrop={trashSuccessId === intention.id ? trashSuccessType ?? null : null}
          />
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
