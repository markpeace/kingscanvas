import type { AppProps } from "next/app"

import "@/app/globals.css"
import "@/lib/debug"

const isMockingEnabled =
  process.env.NEXT_PUBLIC_API_MOCKING === "enabled" &&
  process.env.VERCEL_ENV === "development"

if (isMockingEnabled) {
  import("../mocks").then(({ setupMocks }) => setupMocks())
  console.log("[MSW] Mocking enabled for local development")
} else {
  console.log("[MSW] Disabled — using live API endpoints")
}

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}
