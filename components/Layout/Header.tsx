import HeaderUserMenu from "./HeaderUserMenu"

export default function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white">
      <h1 className="text-lg font-semibold text-kings-red">King’s Canvas</h1>
      <HeaderUserMenu />
    </header>
  )
}
