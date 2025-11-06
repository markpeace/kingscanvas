export type ColumnHeaderProps = {
  title: string
}

export function ColumnHeader({ title }: ColumnHeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-kings-grey-dark bg-kings-white px-4 py-3 text-center font-semibold text-kings-red">
      {title}
    </header>
  )
}

export default ColumnHeader
