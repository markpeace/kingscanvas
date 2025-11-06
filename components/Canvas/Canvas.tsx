export function Canvas() {
  return (
    <main
      aria-label="King's Canvas layout"
      className="grid min-h-screen grid-cols-1 gap-6 bg-white px-6 py-8 lg:grid-cols-4"
    >
      {/* Column 1: Do Now header and tasks will be mounted here in a follow-up PR. */}
      <div className="h-full rounded-lg border border-gray-200 bg-gray-50" />
      {/* Column 2: Do Later bucket header and entries will render in this section. */}
      <div className="h-full rounded-lg border border-gray-200 bg-gray-50" />
      {/* Column 3: Before I Graduate content is introduced in PR 0003 and beyond. */}
      <div className="h-full rounded-lg border border-gray-200 bg-gray-50" />
      {/* Column 4: After I Graduate tasks will appear here once the data layer is wired. */}
      <div className="h-full rounded-lg border border-gray-200 bg-gray-50" />
    </main>
  )
}

export default Canvas
