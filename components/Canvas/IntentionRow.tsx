import { Intention, Step } from "@/types/canvas"
import { IntentionCard } from "./IntentionCard"
import { StepCard } from "./StepCard"

const BUCKETS: Step["bucket"][] = [
  "do-now",
  "do-later",
  "before-graduation",
  "after-graduation",
]

interface IntentionRowProps {
  intention: Intention
}

export function IntentionRow({ intention }: IntentionRowProps) {
  return (
    <section className="grid grid-cols-4 gap-6">
      {BUCKETS.map((bucket) => {
        const steps = intention.steps
          .filter((step) => step.bucket === bucket)
          .sort((a, b) => a.order - b.order)

        const isIntentionBucket = intention.bucket === bucket

        return (
          <div
            key={`${intention.id}-${bucket}`}
            className="min-h-[140px] rounded-lg border border-kings-grey-light bg-white p-4"
          >
            <div className="space-y-3">
              {steps.map((step) => (
                <StepCard key={step.id} step={step} />
              ))}
              {isIntentionBucket ? <IntentionCard intention={intention} /> : null}
            </div>
          </div>
        )
      })}
    </section>
  )
}

export default IntentionRow
