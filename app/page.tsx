"use client"

import Link from "next/link"
import { debugLog } from "../lib/debug/log"

export default function Page() {
  function sendDemoPing() {
    debugLog("DemoPing", {
      ts: new Date().toISOString(),
      href: typeof location !== "undefined" ? location.href : "",
      ua: typeof navigator !== "undefined" ? navigator.userAgent : ""
    }, { level: "info", channel: "ui" })
  }

  return (
    <section className="py-6 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-2">NextJS PWA Template</h1>
      <p className="text-zinc-600 dark:text-zinc-300 mb-4 sm:mb-5">
        Baseline scaffold is running. Use these pages to test routing on your phone.
      </p>

      <div className="flex flex-wrap gap-2 sm:gap-3 mb-6">
        <Link href="/login" className="px-3 py-2 rounded-md border border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">
          Go to Login
        </Link>
        <Link href="/dashboard" className="px-3 py-2 rounded-md border border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">
          Go to Dashboard
        </Link>
        <button
          onClick={sendDemoPing}
          className="px-3 py-2 rounded-md border border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          aria-label="Send demo debug event"
        >
          Send Debug Demo Event
        </button>
      </div>

      <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
        Pro tip: Use the install banner to add this app to your home screen and try the offline fallback page.
      </p>
    </section>
  )
}
