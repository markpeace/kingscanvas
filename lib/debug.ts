const DEFAULT_CHANNEL = "app"

type DebugLevel = "debug" | "info" | "warn" | "error"

type DebugOptions = {
  channel?: string
}

type LogPayload = unknown

const logToConsole = (level: DebugLevel, channel: string, message: string, payload?: LogPayload) => {
  const prefix = channel ? `[${channel}] ${message}` : message
  const method =
    level === "debug"
      ? console.debug
      : level === "info"
      ? console.info
      : level === "warn"
      ? console.warn
      : console.error

  if (payload !== undefined) {
    method?.(prefix, payload)
  } else {
    method?.(prefix)
  }
}

const pushToDebugPanel = (level: DebugLevel, message: string, payload?: LogPayload, channel?: string) => {
  if (typeof window === "undefined") {
    return
  }

  import("./debug/log")
    .then(({ debugLog }) => {
      debugLog(message, payload, { level, channel: channel ?? DEFAULT_CHANNEL })
    })
    .catch(() => {
      // Swallow errors if the debug panel is not available.
    })
}

const emit = (level: DebugLevel, message: string, payload?: LogPayload, options?: DebugOptions) => {
  const channel = options?.channel ?? DEFAULT_CHANNEL
  logToConsole(level, channel, message, payload)
  pushToDebugPanel(level, message, payload, channel)
}

export type DebugLogger = {
  debug: (message: string, payload?: LogPayload, options?: DebugOptions) => void
  info: (message: string, payload?: LogPayload, options?: DebugOptions) => void
  warn: (message: string, payload?: LogPayload, options?: DebugOptions) => void
  error: (message: string, payload?: LogPayload, options?: DebugOptions) => void
}

export const debug: DebugLogger = {
  debug(message, payload, options) {
    emit("debug", message, payload, options)
  },
  info(message, payload, options) {
    emit("info", message, payload, options)
  },
  warn(message, payload, options) {
    emit("warn", message, payload, options)
  },
  error(message, payload, options) {
    emit("error", message, payload, options)
  }
}

export default debug

debug.info(
  "[Startup] MSW mocking state: " +
    (process.env.NEXT_PUBLIC_API_MOCKING === "enabled"
      ? "explicitly enabled"
      : "disabled or default")
)

declare global {
  interface Window {
    msw?: {
      stop?: () => void
    }
  }
}

if (typeof window !== "undefined" && window.msw) {
  console.warn("[MSW] Unexpected mock worker detected — forcibly stopping")
  window.msw.stop?.()
  delete window.msw
}
