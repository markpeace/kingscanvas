"use client"

import { debugLog } from "./log"

type Payload = Record<string, unknown> | undefined

type Level = "trace" | "debug" | "info" | "warn" | "error"

type EmitOptions = {
  channel?: string
}

function emit(level: Level, label: string, payload?: Payload, options?: EmitOptions) {
  try {
    debugLog(label, payload, {
      level,
      channel: options?.channel ?? "app"
    })
  } catch {
    // no-op if debug panel not mounted
  }
}

export const debug = {
  trace(label: string, payload?: Payload, options?: EmitOptions) {
    emit("trace", label, payload, options)
  },
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

export type Debug = typeof debug
