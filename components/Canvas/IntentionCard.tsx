import { useId } from "react"

import { Intention } from "@/types/canvas"

import { StepCard } from "./StepCard"

interface IntentionCardProps {
  intention: Intention
}

export function IntentionCard({ intention }: IntentionCardProps) {
  const headingId = useId()

  return (
    <article
      aria-labelledby={headingId}
      className="bg-white border border-kings-grey-light rounded-lg p-4 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-kings-red focus-visible:outline-offset-2"
      role="listitem"
      tabIndex={0}
    >
      <h3 className="font-semibold text-kings-black" id={headingId}>
        {intention.title}
      </h3>
      {intention.description && (
        <p className="text-sm text-kings-grey-dark mb-2">{intention.description}</p>
      )}
      <div className="space-y-2">
        {intention.steps.map((step) => (
          <StepCard key={step.id} step={step} />
        ))}
      </div>
    </article>
  )
}

export default IntentionCard
