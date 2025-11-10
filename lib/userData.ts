import { getCollection } from "./dbHelpers";
import { debug } from "./debug";

/**
 * Fetch intentions for a given user.
 */
export async function getUserIntentions(email: string) {
  const col = await getCollection("intentions");
  debug.trace("MongoDB: fetching intentions", { user: email });
  const doc = await col.findOne({ user: email });
  debug.info("MongoDB: fetch complete", { found: !!doc });
  return doc;
}

/**
 * Save or update intentions for a given user.
 */
export async function saveUserIntentions(email: string, data: any) {
  const col = await getCollection("intentions");
  debug.trace("MongoDB: upserting intentions", {
    user: email,
    keys: Object.keys(data || {}),
  });
  const result = await col.updateOne(
    { user: email },
    { $set: { intentions: data.intentions || [], updatedAt: new Date() } },
    { upsert: true }
  );
  debug.info("MongoDB: upsert result", {
    matched: result.matchedCount,
    modified: result.modifiedCount,
    upserted: result.upsertedId,
  });
}

/**
 * Fetch steps for a given user.
 */
export async function getUserSteps(email: string) {
  const col = await getCollection("steps");
  debug.trace("MongoDB: fetching steps", { user: email });
  const docs = await col.find({ user: email }).toArray();
  debug.info("MongoDB: fetch complete", { count: docs.length });
  return docs;
}

/**
 * Save or update a step for a given user.
 */
export async function saveUserStep(email: string, step: any) {
  const col = await getCollection("steps");
  debug.trace("MongoDB: upserting step", {
    user: email,
    stepId: step._id || "(new)",
  });
  const result = await col.updateOne(
    { _id: step._id, user: email },
    { $set: { ...step, updatedAt: new Date() } },
    { upsert: true }
  );
  debug.info("MongoDB: step upsert result", {
    matched: result.matchedCount,
    modified: result.modifiedCount,
    upserted: result.upsertedId,
  });
}
