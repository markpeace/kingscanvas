export type ColumnHeaderProps = {
  title: string
}

export function ColumnHeader({ title }: ColumnHeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-kings-grey-dark bg-kings-white px-4 py-3 text-center font-bold uppercase tracking-wide text-kings-red text-sm md:text-base">
      {title}
    </header>
  )
}

export default ColumnHeader
