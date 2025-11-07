import { Intention } from "@/types/canvas"
import { useId } from "react"

type IntentionCardProps = {
  intention: Intention
}

export function IntentionCard({ intention }: IntentionCardProps) {
  const headingId = useId()

  return (
    <article
      aria-labelledby={headingId}
      className="rounded-lg border border-kings-grey-dark bg-kings-grey-light p-4 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-kings-red focus-visible:outline-offset-2"
      role="listitem"
      tabIndex={0}
    >
      <h3 className="font-semibold text-kings-black text-sm md:text-base" id={headingId}>
        {intention.title}
      </h3>
      {intention.description ? (
        <p className="mt-2 text-sm text-kings-grey-dark">{intention.description}</p>
      ) : null}
    </article>
  )
}

export default IntentionCard
