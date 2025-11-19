import { NextRequest, NextResponse } from "next/server"

import { debug } from "@/lib/debug"
import {
  IntentionsPayload,
  loadUserIntentions,
  resolveIntentionsUser,
  saveUserIntentionsForUser
} from "@/lib/server/intentions"

export async function GET() {
  const email = await resolveIntentionsUser({ kind: "app" })

  if (!email) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 })
  }

  try {
    debug.trace("Intentions API (app): GET", { user: email })
    const data = await loadUserIntentions(email)
    const intentions = Array.isArray(data?.intentions) ? data.intentions : []
    debug.info("Intentions API (app): GET complete", { count: intentions.length })
    return NextResponse.json({ ok: true, intentions })
  } catch (error) {
    debug.error("Intentions API (app): server error", {
      message: error instanceof Error ? error.message : String(error)
    })
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  if (req.headers.get("content-type")?.includes("application/json") === false) {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 })
  }

  const email = await resolveIntentionsUser({ kind: "app" })

  if (!email) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 })
  }

  const payload = ((await req.json()) || {}) as IntentionsPayload
  const intentions = Array.isArray(payload.intentions) ? payload.intentions : []
  const count = intentions.length

  try {
    await saveUserIntentionsForUser(email, intentions)
    debug.info("Intentions API (app): save success", {
      method: req.method,
      userId: email,
      count
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    debug.error("Intentions API (app): save failed", {
      method: req.method,
      userId: email,
      error: error instanceof Error ? error.message : String(error)
    })
    return NextResponse.json({ ok: false, error: "Save failed" }, { status: 500 })
  }
}
