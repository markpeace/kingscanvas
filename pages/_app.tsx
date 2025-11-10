import type { AppProps } from "next/app"

const isMockingEnabled =
  process.env.NEXT_PUBLIC_API_MOCKING === "enabled" &&
  process.env.VERCEL_ENV === "development"

if (isMockingEnabled) {
  import("../mocks").then(({ setupMocks }) => setupMocks())
} else {
  console.log(
    "[Mocks disabled] Using live API endpoints (VERCEL_ENV:",
    process.env.VERCEL_ENV || "unknown",
    ")"
  )
}

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}
