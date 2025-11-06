import { requireAuth } from "@/lib/auth/server"

export const metadata = { title: "Dashboard • NextJS PWA Template" }

export default async function DashboardPage() {
  // Server-side guard: redirects to /login if not authenticated
  const session = await requireAuth("/login")
  const user = session.user

  return (
    <section className="py-6 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-2">Dashboard</h1>
      <p className="text-zinc-600 dark:text-zinc-300 mb-6">
        You are signed in with Google. This page is protected on the server.
      </p>

      <div className="grid gap-4 sm:grid-cols-[auto_1fr] items-center">
        {user?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image}
            alt=""
            className="h-16 w-16 rounded-full border border-zinc-300 dark:border-zinc-700"
          />
        ) : <div className="h-16 w-16 rounded-full bg-zinc-200 dark:bg-zinc-700" />}
        <div className="grid">
          <div className="text-base font-semibold">{user?.name ?? "User"}</div>
          <div className="text-sm text-zinc-500 dark:text-zinc-400">{user?.email ?? ""}</div>
        </div>
      </div>

      <div className="mt-6 text-xs text-zinc-500 dark:text-zinc-400">
        Session is enforced via <code>requireAuth()</code> (server redirect if missing).
      </div>
    </section>
  )
}
