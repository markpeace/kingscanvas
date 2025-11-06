"use client"

import { useState } from "react"
import { Button, Modal, Card, CardHeader, CardTitle, CardContent } from "@/components/ui"
import { useInstallPrompt } from "./useInstallPrompt"
import { debugLog } from "@/lib/debug/log"

export default function InstallBanner() {
  const { isIOS, canInstall, shouldSuggest, doInstall, dismissForSession } = useInstallPrompt()
  const [status, setStatus] = useState<"idle" | "installing">("idle")

  if (!shouldSuggest) return null

  async function handleInstall() {
    // Android/Desktop flow
    setStatus("installing")
    const choice = await doInstall()
    debugLog("PWAInstallChoice", { outcome: choice.outcome, platform: choice.platform }, { level: "info", channel: "pwa" })
    setStatus("idle")
    if (choice.outcome === "accepted") {
      // User installed: hide banner for this session
      dismissForSession()
    }
  }

  function handleLater() {
    debugLog("PWAInstallDismissed", { reason: "user_clicked_later" }, { level: "info", channel: "pwa" })
    dismissForSession()
  }

  return (
    <aside
      role="region"
      aria-label="Install this app"
      className="sticky top-0 z-40 border-b border-emerald-300/60 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-100"
    >
      <div className="mx-auto max-w-[960px] px-4 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-2">
        <p className="text-sm sm:text-base">
          Install this app for a faster, offline-capable experience.
        </p>
        <div className="flex items-center gap-2">
          {canInstall && !isIOS ? (
            <Button size="sm" onClick={handleInstall} disabled={status === "installing"}>
              {status === "installing" ? "Installing…" : "Install"}
            </Button>
          ) : (
            // iOS: show modal with A2HS steps
            <Modal
              trigger={<Button size="sm" variant="outline">How to Install</Button>}
              title="Add to Home Screen (iOS)"
            >
              <Card>
                <CardHeader><CardTitle>Install on iPhone or iPad</CardTitle></CardHeader>
                <CardContent className="grid gap-2">
                  <ol className="list-decimal pl-5 text-sm text-zinc-700 dark:text-zinc-300 space-y-1">
                    <li>Tap the <strong>Share</strong> icon in Safari.</li>
                    <li>Select <strong>Add to Home Screen</strong>.</li>
                    <li>Tap <strong>Add</strong> to confirm.</li>
                  </ol>
                </CardContent>
              </Card>
            </Modal>
          )}
          <Button size="sm" variant="subtle" onClick={handleLater}>Later</Button>
        </div>
      </div>
    </aside>
  )
}
