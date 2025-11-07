export type ColumnHeaderProps = {
  headingId: string
  title: string
}

export function ColumnHeader({ headingId, title }: ColumnHeaderProps) {
  return (
    <header
      className="sticky top-0 z-10 border-b border-kings-grey-dark bg-kings-white px-4 py-3 text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-kings-red focus-visible:outline-offset-2"
      tabIndex={0}
    >
      <h2
        className="font-bold uppercase tracking-wide text-kings-red text-sm md:text-base xl:text-[0.75rem] 2xl:text-[0.85rem]"
        id={headingId}
      >
        {title}
      </h2>
    </header>
  )
}

export default ColumnHeader
