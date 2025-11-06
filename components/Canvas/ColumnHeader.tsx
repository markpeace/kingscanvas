export type ColumnHeaderProps = {
  title: string
}

export function ColumnHeader({ title }: ColumnHeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-gray-200 px-4 py-3 text-center font-semibold text-gray-900">
      {title}
    </header>
  )
}

export default ColumnHeader
