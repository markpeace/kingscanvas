import { ColumnHeader } from "./ColumnHeader"
import { IntentionCard } from "./IntentionCard"
import { StepCard } from "./StepCard"

export function Canvas() {
  return (
    <main
      aria-label="King's Canvas layout"
      className="grid min-h-screen grid-cols-1 gap-6 bg-kings-white px-6 py-8 lg:grid-cols-4"
    >
      {/* Column 1: Do Now header and tasks will be mounted here in a follow-up PR. */}
      <div className="flex h-full flex-col overflow-hidden rounded-lg border border-kings-grey-light bg-kings-white">
        <ColumnHeader title="Do Now" />
        <div className="flex-1 space-y-4 p-4">
          <StepCard />
          <StepCard />
        </div>
      </div>
      {/* Column 2: Do Later bucket header and entries will render in this section. */}
      <div className="flex h-full flex-col overflow-hidden rounded-lg border border-kings-grey-light bg-kings-white">
        <ColumnHeader title="Do Later" />
        <div className="flex-1 space-y-4 p-4">
          <StepCard />
          <StepCard />
        </div>
      </div>
      {/* Column 3: Before I Graduate content is introduced in PR 0003 and beyond. */}
      <div className="flex h-full flex-col overflow-hidden rounded-lg border border-kings-grey-light bg-kings-white">
        <ColumnHeader title="Before I Graduate" />
        <div className="flex-1 space-y-4 p-4">
          <IntentionCard />
        </div>
      </div>
      {/* Column 4: After I Graduate tasks will appear here once the data layer is wired. */}
      <div className="flex h-full flex-col overflow-hidden rounded-lg border border-kings-grey-light bg-kings-white">
        <ColumnHeader title="After I Graduate" />
        <div className="flex-1 space-y-4 p-4" />
      </div>
    </main>
  )
}

export default Canvas
