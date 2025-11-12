import type { AppProps } from "next/app"

import "@/app/globals.css"

import { debug } from "../lib/debug"

console.log("[MSW] Mocking disabled globally — all endpoints use live APIs")
debug.info("[Startup] Mocking disabled globally — all endpoints use live APIs")

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}
