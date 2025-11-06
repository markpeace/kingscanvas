"use client"

import { debugLog } from "@/lib/debug/log"

type Payload = Record<string, unknown> | undefined

type Level = "debug" | "info" | "warn" | "error"

type EmitOptions = {
  channel?: string
}

function emit(level: Level, label: string, payload?: Payload, options?: EmitOptions) {
  try {
    debugLog(
      label,
      payload,
      {
        level,
        channel: options?.channel ?? "obs"
      }
    )
  } catch {
    // no-op if debug panel not mounted
  }
}

export const obs = {
  debug(label: string, payload?: Payload, options?: EmitOptions) {
    emit("debug", label, payload, options)
  },
  info(label: string, payload?: Payload, options?: EmitOptions) {
    emit("info", label, payload, options)
  },
  warn(label: string, payload?: Payload, options?: EmitOptions) {
    emit("warn", label, payload, options)
  },
  error(label: string, payload?: Payload, options?: EmitOptions) {
    emit("error", label, payload, options)
  }
}

export type Obs = typeof obs
