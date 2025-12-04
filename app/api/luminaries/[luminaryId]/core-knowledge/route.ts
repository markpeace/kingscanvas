import { NextResponse } from "next/server"
import { getCoreKnowledge } from "@/lib/coreKnowledge/store"

export async function GET(_: Request, { params }: { params: { luminaryId: string } }) {
  const luminaryId = params.luminaryId
  const userId = "demo-user"

  try {
    const result = await getCoreKnowledge({ userId, luminaryId })
    return NextResponse.json({
      userId,
      luminaryId,
      ...result
    })
  } catch (error) {
    console.error("Failed to load core knowledge", error)
    return NextResponse.json({ error: "core_knowledge_unavailable" }, { status: 500 })
  }
}
