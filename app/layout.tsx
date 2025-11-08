import "./globals.css"
import dynamicImport from "next/dynamic"
import { Toaster } from "react-hot-toast"
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
      <body className="min-h-screen bg-white font-sans text-kings-black">
        <AuthProvider>
          <InstallBanner />

          <main className="w-full px-8 py-10 overflow-x-hidden bg-white text-kings-black">
            {children}
          </main>

          {debugEnabled ? <DebugPanelDynamic /> : null}
        </AuthProvider>
        <Toaster
          position="bottom-center"
          toastOptions={{
            duration: 1500,
            style: {
              background: "#fff",
              color: "#222",
              border: "1px solid #e5e5e5",
              fontSize: "0.85rem"
            },
            success: {
              iconTheme: {
                primary: "#cc0000",
                secondary: "#fff"
              }
            }
          }}
        />
      </body>
    </html>
  )
}
