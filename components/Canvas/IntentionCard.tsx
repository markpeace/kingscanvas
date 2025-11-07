import { useId } from "react"

export function IntentionCard() {
  const headingId = useId()

  return (
    <article
      aria-labelledby={headingId}
      className="rounded-lg border border-kings-grey-dark bg-kings-grey-light p-4 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-kings-red focus-visible:outline-offset-2"
      role="listitem"
      tabIndex={0}
    >
      <h3 className="font-semibold text-kings-black text-sm md:text-base" id={headingId}>
        Intention placeholder
      </h3>
    </article>
  )
}

export default IntentionCard
