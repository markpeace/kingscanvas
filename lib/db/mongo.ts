import { MongoClient, ServerApiVersion, type Db } from "mongodb"

const config = {
  uri: process.env.MONGODB_URI,
  dbName: process.env.MONGODB_DB
}

type Cached = {
  client: MongoClient | null
  db: Db | null
}

// Reuse the client across hot reloads in dev (App Router)
const g = globalThis as unknown as { __MONGO__: Cached | undefined }
if (!g.__MONGO__) {
  g.__MONGO__ = { client: null, db: null }
}

function requireEnv(value: string | undefined, key: "MONGODB_URI" | "MONGODB_DB"): string {
  if (!value) throw new Error(`${key} is not set`)
  return value
}

export async function getClient(): Promise<MongoClient> {
  if (g.__MONGO__!.client) return g.__MONGO__!.client
  const client = new MongoClient(requireEnv(config.uri, "MONGODB_URI"), {
    serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }
  })
  await client.connect()
  g.__MONGO__!.client = client
  return client
}

export async function db(): Promise<Db> {
  if (g.__MONGO__!.db) return g.__MONGO__!.db!
  const client = await getClient()
  const database = client.db(requireEnv(config.dbName, "MONGODB_DB"))
  g.__MONGO__!.db = database
  return database
}

export async function ping(): Promise<{ ok: boolean; db: string }> {
  const database = await db()
  await database.command({ ping: 1 })
  return { ok: true, db: database.databaseName }
}
