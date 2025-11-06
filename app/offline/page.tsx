export const metadata = { title: "Offline • NextJS PWA Template" }

export default function OfflinePage() {
  return (
    <section className="py-16 text-center">
      <h1 className="text-3xl font-bold mb-2">You’re offline</h1>
      <p className="text-zinc-600 dark:text-zinc-300">
        This page is available offline. Reconnect to browse the rest of the app.
      </p>
    </section>
  )
}
