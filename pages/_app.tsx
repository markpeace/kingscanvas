import type { AppProps } from "next/app"

if (
  process.env.NEXT_PUBLIC_API_MOCKING === "enabled" &&
  process.env.VERCEL_ENV === "development"
) {
  import("../mocks").then(({ setupMocks }) => setupMocks())
}

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}
