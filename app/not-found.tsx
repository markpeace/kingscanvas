import Link from "next/link"

export default function NotFound() {
  return (
    <section className="py-16 text-center">
      <h1 className="text-3xl font-bold mb-2">Page not found</h1>
      <p className="text-zinc-600 dark:text-zinc-300 mb-6">
        The page you’re looking for doesn’t exist.
      </p>
      <Link href="/" className="inline-block px-4 py-2 rounded-md border border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">
        Go home
      </Link>
    </section>
  )
}
