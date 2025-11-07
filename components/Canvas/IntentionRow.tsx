import { type ReactNode } from 'react';
import { Intention, Step } from '@/types/canvas';
import { BUCKETS, isBefore } from '@/lib/buckets';
import { StepCard } from '@/components/Canvas/StepCard';
import { IntentionCard } from '@/components/Canvas/IntentionCard';

interface Props {
  intention: Intention;
}

export function IntentionRow({ intention }: Props) {
  return (
    <section
      aria-label={`Intention row: ${intention.title}`}
      className="grid grid-cols-4 gap-6 mb-10"
    >
      {BUCKETS.map(({ id: colBucket }) => {
        const isIntentionBucket = colBucket === intention.bucket;
        const isEarlier = isBefore(colBucket, intention.bucket);
        const isLater = !isEarlier && !isIntentionBucket;

        let content: ReactNode = null;

        if (isIntentionBucket) {
          content = <IntentionCard intention={intention} />;
        } else if (isEarlier) {
          const steps = (intention.steps || []).filter(
            (s: Step) => s.bucket === colBucket
          );
          content = (
            <div className="space-y-2">
              {steps.map((s) => (
                <StepCard key={s.id} step={s} />
              ))}
            </div>
          );
        }

        return (
          <div
            key={colBucket}
            className={[
              'rounded-lg border p-3 min-h-[120px]',
              isLater
                ? 'border-kings-grey-light/60 bg-kings-grey-light/20'
                : 'border-kings-grey-light bg-white'
            ].join(' ')}
            aria-disabled={isLater}
          >
            {content}
          </div>
        );
      })}
    </section>
  );
}
