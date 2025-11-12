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

export async function createSuggestedSteps(user: string, intentionId: string, suggestions: any[]) {
  const col = await getCollection("steps");
  const docs = suggestions.map((s) => {
    const timestamp = new Date();
    const doc: Record<string, any> = {
      user,
      intentionId,
      bucket: s.bucket,
      text: s.text,
      status: "suggested",
      source: "ai",
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    if (s.id) {
      doc._id = s.id;
    }

    return doc;
  });

  if (!docs.length) {
    debug.warn("Mongo: createSuggestedSteps called with empty suggestions", { intentionId });
    return [];
  }

  debug.trace("Mongo: inserting suggested steps", { user, intentionId, count: docs.length });
  const result = await col.insertMany(docs);
  debug.info("Mongo: inserted suggested steps", { inserted: result.insertedCount });
  return result;
}

export async function updateStepStatus(user: string, stepId: any, status: string) {
  const col = await getCollection("steps");
  debug.trace("Mongo: updating step status", { stepId, status });
  const result = await col.updateOne(
    { _id: stepId, user },
    { $set: { status, updatedAt: new Date() } }
  );
  debug.info("Mongo: step status updated", { matched: result.matchedCount });
  return result;
}

export async function listRecentHistory(user: string, intentionId: string, limit = 25) {
  const col = await getCollection("steps");
  debug.trace("Mongo: fetching recent step history", { user, intentionId });
  const docs = await col
    .find(
      { user, intentionId, status: { $in: ["accepted", "rejected"] } },
      { projection: { text: 1, status: 1 } }
    )
    .sort({ updatedAt: -1 })
    .limit(limit)
    .toArray();

  const accepted = docs.filter((d) => d.status === "accepted").map((d) => d.text);
  const rejected = docs.filter((d) => d.status === "rejected").map((d) => d.text);
  debug.info("Mongo: step history loaded", { accepted: accepted.length, rejected: rejected.length });
  return { accepted, rejected };
}
