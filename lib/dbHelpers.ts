import type { Collection, Document } from "mongodb";

import clientPromise from "./mongodb";

/**
 * Returns a MongoDB collection from the connected client.
 * Reuses the globally cached clientPromise from lib/mongodb.ts
 */
export async function getCollection<T extends Document = Document>(name: string): Promise<Collection<T>> {
  const client = await clientPromise;
  const dbName = process.env.MONGODB_DB_NAME || "lumin";
  const db = client.db(dbName);
  return db.collection<T>(name);
}

/**
 * Returns the user's intentions collection.
 * All documents are keyed by user.email.
 */
export async function getIntentionsCollection() {
  return getCollection("intentions");
}

/**
 * Returns the user's steps collection.
 * Steps may optionally be embedded within intentions.
 */
export async function getStepsCollection() {
  return getCollection("steps");
}
