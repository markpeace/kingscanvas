import { ColumnHeader } from "./ColumnHeader"

export function Canvas() {
  return (
    <main
      aria-label="King's Canvas layout"
      className="grid min-h-screen grid-cols-1 gap-6 bg-white px-6 py-8 lg:grid-cols-4"
    >
      {/* Column 1: Do Now header and tasks will be mounted here in a follow-up PR. */}
      <div className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
        <ColumnHeader title="Do Now" />
        <div className="flex-1" />
      </div>
      {/* Column 2: Do Later bucket header and entries will render in this section. */}
      <div className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
        <ColumnHeader title="Do Later" />
        <div className="flex-1" />
      </div>
      {/* Column 3: Before I Graduate content is introduced in PR 0003 and beyond. */}
      <div className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
        <ColumnHeader title="Before I Graduate" />
        <div className="flex-1" />
      </div>
      {/* Column 4: After I Graduate tasks will appear here once the data layer is wired. */}
      <div className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
        <ColumnHeader title="After I Graduate" />
        <div className="flex-1" />
      </div>
    </main>
  )
}

export default Canvas
