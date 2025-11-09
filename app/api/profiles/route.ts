import { NextRequest } from "next/server"
import { db } from "@/lib/db/mongo"
import { ProfileInputSchema } from "@/lib/db/types"
import { getSession } from "@/lib/auth/server"
import { ObjectId } from "mongodb"

function isoNow() {
  return new Date().toISOString()
}

export async function GET() {
  try {
    const database = await db()
    const docs = await database
      .collection("profiles")
      .find({}, { projection: { _id: 1, displayName: 1, bio: 1, userId: 1, createdAt: 1, updatedAt: 1 } })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray()

    // Convert _id ObjectId to string
    const data = docs.map((d: any) => ({ ...d, _id: String(d._id) }))
    return new Response(JSON.stringify({ ok: true, data }), { status: 200, headers: { "content-type": "application/json" } })
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: err?.message ?? "unknown error" }), { status: 500, headers: { "content-type": "application/json" } })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.email) {
      return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), { status: 401, headers: { "content-type": "application/json" } })
    }

    const body = await req.json()
    const parsed = ProfileInputSchema.safeParse(body)
    if (!parsed.success) {
      return new Response(JSON.stringify({ ok: false, error: "validation_error", details: parsed.error.flatten() }), { status: 400, headers: { "content-type": "application/json" } })
    }

    const now = isoNow()
    const doc = {
      _id: new ObjectId(),
      userId: session.user.email,        // using email as stable user key for template
      displayName: parsed.data.displayName,
      bio: parsed.data.bio ?? "",
      createdAt: now,
      updatedAt: now
    }

    const database = await db()
    await database.collection("profiles").insertOne(doc)

    // return normalized doc (_id as string)
    const data = { ...doc, _id: String(doc._id) }
    return new Response(JSON.stringify({ ok: true, data }), { status: 201, headers: { "content-type": "application/json" } })
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: err?.message ?? "unknown error" }), { status: 500, headers: { "content-type": "application/json" } })
  }
}
