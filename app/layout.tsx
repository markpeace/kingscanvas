import "./globals.css"
import dynamicImport from "next/dynamic"
import Nav from "../components/Nav"
import { ToastProvider } from "../components/toast/ToastProvider"
import AuthProvider from "../components/auth/AuthProvider"
import InstallBanner from "../components/pwa/InstallBanner"

export const metadata = {
  title: "NextJS PWA Template",
  description: "PWA + UI + Auth template"
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0ea5e9" },
    { media: "(prefers-color-scheme: dark)", color: "#0ea5e9" }
  ]
}

const DebugPanelDynamic = dynamicImport(() => import("../components/debug/DebugPanel"), { ssr: false })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const serverFlag = process.env.DEBUG_PANEL_ENABLED === "true"
  const publicFlag = process.env.NEXT_PUBLIC_DEBUG_PANEL === "true"
  const debugEnabled = serverFlag || publicFlag

  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="icon" href="/icons/icon-192.svg" sizes="192x192" type="image/svg+xml" />
        <link rel="icon" href="/icons/icon-512.svg" sizes="512x512" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#0ea5e9" />
      </head>
      <body className="min-h-screen bg-white text-gray-900 dark:bg-zinc-900 dark:text-gray-100">
        <AuthProvider>
          <ToastProvider>
            <InstallBanner />
            <header className="px-4 py-3 sm:px-6 sm:py-4 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between gap-3">
                <Nav />
              </div>
            </header>

            <main className="max-w-[960px] mx-auto px-4 sm:px-6 py-4 sm:py-6">
              {children}
            </main>

            {debugEnabled ? <DebugPanelDynamic /> : null}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
