import { Intention } from "@/types/canvas"
import { StepCard } from "@/components/Canvas/StepCard"

interface IntentionRowProps {
  intention: Intention
}

export function IntentionRow({ intention }: IntentionRowProps) {
  return (
    <section
      aria-label={`Intention: ${intention.title}`}
      className="grid grid-cols-4 gap-4 mb-8 border-t border-kings-grey-light pt-4"
    >
      <header className="col-span-4 mb-2">
        <h2 className="text-lg font-semibold text-kings-red">{intention.title}</h2>
        {intention.description && (
          <p className="text-sm text-kings-grey-dark">{intention.description}</p>
        )}
      </header>

      {/* For now, placeholder Steps by bucket */}
      {["do-now", "do-later", "before-graduation", "after-graduation"].map(bucket => (
        <div key={bucket} className="bg-white min-h-[100px] rounded-md border border-kings-grey-light p-2">
          {intention.steps
            .filter(step => step.bucket === bucket)
            .map(step => (
              <StepCard key={step.id} step={step} />
            ))}
        </div>
      ))}
    </section>
  )
}

export default IntentionRow
