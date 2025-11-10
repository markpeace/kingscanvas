import clientPromise from "./mongodb";
import { debug } from "./debug";

/**
 * Returns a connected database instance.
 */
export async function getDb() {
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
export async function getCollection<T = any>(name: string) {
  const db = await getDb();
  debug.trace("MongoDB: using collection", { name });
  return db.collection<T>(name);
}
