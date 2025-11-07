import { mockIntentions } from "@/data/mockIntentions"
import { ColumnHeader } from "./ColumnHeader"
import { IntentionCard } from "./IntentionCard"
import { StepCard } from "./StepCard"

export function Canvas() {
  return (
    <div className="max-w-[1920px] mx-auto">
      <main
        aria-labelledby="canvas-title"
        className="grid min-h-screen grid-cols-1 gap-4 bg-kings-white px-4 py-8 lg:grid-cols-4 xl:gap-6 xl:px-8 2xl:gap-8 2xl:px-12"
        role="main"
      >
        <h1 className="sr-only" id="canvas-title">
          King&apos;s Canvas
        </h1>
        <p className="text-sm text-kings-grey-dark">
          Loaded {mockIntentions.length} intention(s)
        </p>
        {/* Column 1: Do Now header and tasks will be mounted here in a follow-up PR. */}
        <section
          aria-labelledby="do-now-column-title"
          className="flex h-full flex-col overflow-hidden rounded-lg border border-kings-grey-light bg-kings-white"
          role="region"
        >
          <ColumnHeader headingId="do-now-column-title" title="Do Now" />
          <div className="flex-1 space-y-4 p-4" role="list">
            <StepCard />
            <StepCard />
          </div>
        </section>
        {/* Column 2: Do Later bucket header and entries will render in this section. */}
        <section
          aria-labelledby="do-later-column-title"
          className="flex h-full flex-col overflow-hidden rounded-lg border border-kings-grey-light bg-kings-white"
          role="region"
        >
          <ColumnHeader headingId="do-later-column-title" title="Do Later" />
          <div className="flex-1 space-y-4 p-4" role="list">
            <StepCard />
            <StepCard />
          </div>
        </section>
        {/* Column 3: Before I Graduate content is introduced in PR 0003 and beyond. */}
        <section
          aria-labelledby="before-graduate-column-title"
          className="flex h-full flex-col overflow-hidden rounded-lg border border-kings-grey-light bg-kings-white"
          role="region"
        >
          <ColumnHeader headingId="before-graduate-column-title" title="Before I Graduate" />
          <div className="flex-1 space-y-4 p-4" role="list">
            <IntentionCard />
          </div>
        </section>
        {/* Column 4: After I Graduate tasks will appear here once the data layer is wired. */}
        <section
          aria-labelledby="after-graduate-column-title"
          className="flex h-full flex-col overflow-hidden rounded-lg border border-kings-grey-light bg-kings-white"
          role="region"
        >
          <ColumnHeader headingId="after-graduate-column-title" title="After I Graduate" />
          <div className="flex-1 space-y-4 p-4" role="list" />
        </section>
      </main>
    </div>
  )
}

export default Canvas
