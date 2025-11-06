import { db } from "@/lib/db/mongo"

export async function findProfilesByNameFragment(fragment: string, limit = 5) {
  const database = await db()
  const cur = database.collection("profiles").find(
    { displayName: { $regex: fragment, $options: "i" } },
    { projection: { _id: 0, displayName: 1, userId: 1, createdAt: 1 }, sort: { createdAt: -1 }, limit }
  )
  return await cur.toArray()
}
