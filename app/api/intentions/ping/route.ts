import { NextResponse } from "next/server"

import { debug } from "@/lib/debug"

export async function GET() {
  debug.info("Intentions API Ping", { time: new Date().toISOString() })
  return NextResponse.json({ ok: true })
}
