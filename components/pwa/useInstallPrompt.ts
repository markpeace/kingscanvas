"use client"

import { useEffect, useMemo, useState } from "react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

function detectIOS() {
  if (typeof window === "undefined") return false
  const ua = window.navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && (navigator as any).maxTouchPoints > 1)
}

function detectStandaloneMode() {
  if (typeof window === "undefined") return false

  const media = window.matchMedia?.("(display-mode: standalone)")
  if (media?.matches) return true

  if (typeof window.navigator === "object" && (window.navigator as any).standalone === true) return true

  if (typeof document !== "undefined" && document.referrer.startsWith("android-app://")) return true

  return false
}

const SEEN_KEY = "pwa-install-dismissed" // session-based; do not nag after dismiss

export function useInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(() => detectStandaloneMode())
  const [dismissed, setDismissed] = useState(false)
  const isIOS = useMemo(detectIOS, [])
  const installContextReady = useMemo(() => {
    if (typeof window === "undefined") return false
    if (!window.isSecureContext) return false
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return false
    return process.env.NODE_ENV === "production"
  }, [])

  useEffect(() => {
    // hydrate dismissed flag from sessionStorage
    try {
      const v = sessionStorage.getItem(SEEN_KEY)
      if (v === "1") setDismissed(true)
    } catch {}
  }, [])

  useEffect(() => {
    if (detectStandaloneMode()) {
      setInstalled(true)
      setDismissed(true)
      return
    }

    const media = window.matchMedia?.("(display-mode: standalone)")
    if (!media) return

    const listener = () => {
      if (media.matches) {
        setInstalled(true)
        setDismissed(true)
      }
    }

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", listener)
      return () => media.removeEventListener("change", listener)
    }

    if (typeof media.addListener === "function") {
      media.addListener(listener)
      return () => media.removeListener(listener)
    }
  }, [])

  useEffect(() => {
    const onBIP = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setInstalled(true)
      setDeferred(null)
    }

    window.addEventListener("beforeinstallprompt", onBIP)
    window.addEventListener("appinstalled", onInstalled)
    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP)
      window.removeEventListener("appinstalled", onInstalled)
    }
  }, [])

  async function doInstall() {
    // Only valid for Android/Desktop (deferred present)
    if (!deferred) return { outcome: "dismissed" as const, platform: "" }
    try {
      await deferred.prompt()
      const choice = await deferred.userChoice
      // Only clear deferred AFTER we have a decision so repeated clicks aren't "lost"
      setDeferred(null)
      return choice
    } catch {
      return { outcome: "dismissed" as const, platform: "" }
    }
  }

  function dismissForSession() {
    setDismissed(true)
    try { sessionStorage.setItem(SEEN_KEY, "1") } catch {}
  }

  const canInstall = Boolean(deferred) // Android/Desktop prompt available
  const iosEligible = isIOS && installContextReady
  const shouldSuggest = (canInstall || iosEligible) && !installed && !dismissed

  return {
    isIOS,
    installed,
    canInstall,
    shouldSuggest,
    dismissForSession,
    doInstall
  }
}
