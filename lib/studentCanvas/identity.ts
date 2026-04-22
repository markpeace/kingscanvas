import { randomUUID } from "node:crypto"
import { createHash } from "node:crypto"

export function nowIso(): string {
  return new Date().toISOString()
}

export function toIsoString(value: unknown, fallback: string = nowIso()): string {
  if (typeof value === "string" && value.trim().length > 0) {
    return value
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  return fallback
}

export function createCanonicalId(): string {
  return randomUUID()
}

export function isCanonicalId(value: unknown): boolean {
  if (typeof value !== "string") {
    return false
  }

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export function canonicalIdFromLegacyRef(value: string, scope: "step" | "opportunity" | "intention"): string {
  const digest = createHash("sha1").update(`${scope}:${value}`).digest("hex")
  const chunk = digest.slice(0, 32)
  return `${chunk.slice(0, 8)}-${chunk.slice(8, 12)}-5${chunk.slice(13, 16)}-a${chunk.slice(17, 20)}-${chunk.slice(20, 32)}`
}
