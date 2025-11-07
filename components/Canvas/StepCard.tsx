import { useId } from "react"

import { Step } from "@/types/canvas"

interface StepCardProps {
  step: Step
}

export function StepCard({ step }: StepCardProps) {
  const headingId = useId()

  return (
    <article
      aria-labelledby={headingId}
      className="rounded-lg border border-kings-grey-light bg-white p-3 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-kings-red focus-visible:outline-offset-2"
      role="listitem"
      tabIndex={0}
    >
      <h3 className="font-semibold text-kings-grey-dark text-sm md:text-base" id={headingId}>
        {step.title}
      </h3>
    </article>
  )
}

export default StepCard
