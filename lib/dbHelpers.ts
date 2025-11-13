import type { Collection, Db, Document } from "mongodb";

import clientPromise from "./mongodb";
import { debug } from "./debug";

/**
 * Returns a connected database instance.
 */
export async function getDb(): Promise<Db> {
  const dbName = process.env.MONGODB_DB_NAME || process.env.MONGODB_DB || "lumin";
  debug.trace("MongoDB: connecting", { dbName });
  const client = await clientPromise;
  const db = client.db(dbName);
  debug.info("MongoDB: connection established", { dbName });
  return db;
}

/**
 * Returns a collection handle, logging its use.
 */
export async function getCollection<TSchema extends Document = Document>(
  name: string,
): Promise<Collection<TSchema>> {
  const db = await getDb();
  debug.trace("MongoDB: using collection", { name });
  return db.collection<TSchema>(name);
}

export async function ensureStepIndexes() {
  const col = await getCollection("steps");
  await col.createIndex({ user: 1, intentionId: 1 });
  await col.createIndex({ user: 1, status: 1 });
}

export async function ensureOpportunityIndexes() {
  const col = await getCollection("opportunities");
  await col.createIndex({ user: 1, stepId: 1 });
  await col.createIndex({ user: 1, status: 1 });
}
