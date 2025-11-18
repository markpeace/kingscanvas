import { NextRequest, NextResponse } from "next/server"

import { getToken } from "next-auth/jwt"

import { isProd } from "@/lib/auth/config"
import { getSession } from "@/lib/auth/server"
import { debug } from "@/lib/debug"
import { getUserIntentions, saveUserIntentions } from "@/lib/userData"

type IntentionsPayload = {
  intentions?: unknown[]
  [key: string]: unknown
}

async function resolveUserEmail(request: NextRequest) {
  if (!isProd) {
    const session = await getSession()
    return session?.user?.email ?? null
  }

  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    })

    const directEmail = typeof token?.email === "string" ? token.email : null
    const nestedEmail =
      token && typeof token === "object" && typeof (token as any)?.user?.email === "string"
        ? (token as any).user.email
        : null

    if (directEmail || nestedEmail) {
      return directEmail ?? nestedEmail
    }
  } catch (error) {
    debug.error("Intentions API: failed to parse auth token", {
      message: error instanceof Error ? error.message : String(error)
    })
  }

  const session = await getSession()
  return session?.user?.email ?? null
}

function unauthorisedResponse() {
  return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
}

async function handleSave(request: NextRequest) {
  const email = await resolveUserEmail(request)

  if (!email) {
    debug.error("Intentions API: unauthenticated request")
    return unauthorisedResponse()
  }

  let payload: IntentionsPayload

  try {
    payload = await request.json()
  } catch (error) {
    debug.error("Intentions API: invalid JSON payload", {
      method: request.method,
      userId: email,
      error: error instanceof Error ? error.message : String(error)
    })
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 })
  }

  const count = Array.isArray(payload.intentions) ? payload.intentions.length : 0

  try {
    await saveUserIntentions(email, payload)
    debug.info("Intentions API: save success", {
      method: request.method,
      userId: email,
      count
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    debug.error("Intentions API: save failed", {
      method: request.method,
      userId: email,
      error: error instanceof Error ? error.message : String(error)
    })
    return NextResponse.json({ ok: false, error: "Save failed" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const email = await resolveUserEmail(request)

  if (!email) {
    debug.error("Intentions API: unauthenticated request")
    return unauthorisedResponse()
  }

  try {
    debug.trace("Intentions API: GET", { user: email })
    const data = await getUserIntentions(email)
    debug.info("Intentions API: GET complete", { found: !!data })
    return NextResponse.json(data || { intentions: [] })
  } catch (error) {
    debug.error("Intentions API: server error", {
      message: error instanceof Error ? error.message : String(error)
    })
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  return handleSave(request)
}

export async function PUT(request: NextRequest) {
  return handleSave(request)
}
