"use client"
import { debugSink } from "../../components/debug/sink"

type DebugOptions = {
  level?: "trace" | "debug" | "info" | "warn" | "error"
  channel?: string
}

// Backward compatible:
// debugLog("Label", payload)
// debugLog("Label", payload, { level: "info", channel: "app" })
export function debugLog(label: string, payload?: any, options?: DebugOptions) {
  try {
    const entry = {
      ts: new Date().toISOString(),
      label,
      level: options?.level ?? "info",
      channel: options?.channel ?? "app",
      payload
    }
    debugSink.push(entry)
  } catch {
    // no-op if panel not mounted
  }
}
