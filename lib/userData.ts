import { ObjectId } from "mongodb";
import type { Document, Filter, InsertManyResult, WithId } from "mongodb";

import { getCollection } from "./dbHelpers";
import { debug } from "./debug";
import type { Opportunity } from "@/types/canvas";

type OpportunityDocument = {
  _id: ObjectId;
  user: string;
  stepId: string;
  title: string;
  summary: string;
  source: Opportunity["source"];
  form: Opportunity["form"];
  focus: Opportunity["focus"];
  status: Opportunity["status"];
  createdAt: Date;
  updatedAt: Date;
};

export type OpportunityDraft = Omit<Opportunity, "id" | "_id" | "stepId" | "createdAt" | "updatedAt">;

type StepDocument = Document & {
  _id: ObjectId | string;
  id?: string;
  user: string;
};

function toOpportunityId(value: WithId<OpportunityDocument>["_id"]): string {
  if (typeof value === "string") {
    return value;
  }

  if (value instanceof ObjectId) {
    return value.toHexString();
  }

  return String(value);
}

function mapOpportunity(doc: OpportunityDocument): Opportunity {
  const id = toOpportunityId(doc._id);

  return {
    _id: id,
    id,
    stepId: doc.stepId,
    title: doc.title,
    summary: doc.summary,
    source: doc.source,
    form: doc.form,
    focus: doc.focus,
    status: doc.status,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

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

export async function getStepById(stepId: string): Promise<StepDocument | null> {
  const col = await getCollection<StepDocument>("steps");
  debug.trace("MongoDB: fetching step by id", { stepId });

  const queries: Array<Record<string, unknown>> = [];

  if (ObjectId.isValid(stepId)) {
    try {
      queries.push({ _id: new ObjectId(stepId) });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      debug.warn("MongoDB: failed to coerce step id to ObjectId", { stepId, message });
    }
  }

  queries.push({ _id: stepId });
  queries.push({ id: stepId });

  for (const query of queries) {
    const doc = await col.findOne(query);

    if (doc) {
      debug.info("MongoDB: step found by id", { stepId });
      return doc;
    }
  }

  debug.warn("MongoDB: step not found by id", { stepId });
  return null;
}

/**
 * Save or update a step for a given user.
 */
export async function saveUserStep(email: string, step: any): Promise<string | null> {
  const col = await getCollection<StepDocument>("steps");
  const now = new Date();
  const normalizedStep = { ...step };

  if (!normalizedStep.createdAt) {
    normalizedStep.createdAt = now;
  }

  normalizedStep.updatedAt = now;
  normalizedStep.user = email;

  let lookupId: ObjectId | string | null = null;

  if (normalizedStep._id instanceof ObjectId) {
    lookupId = normalizedStep._id;
  } else if (typeof normalizedStep._id === "string" && normalizedStep._id) {
    lookupId = ObjectId.isValid(normalizedStep._id)
      ? new ObjectId(normalizedStep._id)
      : normalizedStep._id;
  } else if (typeof normalizedStep.id === "string" && normalizedStep.id) {
    lookupId = ObjectId.isValid(normalizedStep.id)
      ? new ObjectId(normalizedStep.id)
      : normalizedStep.id;
  }

  if (!lookupId) {
    lookupId = new ObjectId();
  }

  if (lookupId instanceof ObjectId) {
    normalizedStep._id = lookupId;
    if (!normalizedStep.id) {
      normalizedStep.id = lookupId.toHexString();
    }
  } else {
    normalizedStep._id = lookupId;
    if (!normalizedStep.id) {
      normalizedStep.id = lookupId;
    }
  }

  const stepIdentifier = lookupId instanceof ObjectId ? lookupId.toHexString() : String(lookupId);

  debug.trace("MongoDB: upserting step", {
    user: email,
    stepId: stepIdentifier,
  });

  const filter: Filter<StepDocument> = { _id: lookupId, user: email };

  const result = await col.updateOne(filter, { $set: normalizedStep }, { upsert: true });

  debug.info("MongoDB: step upsert result", {
    matched: result.matchedCount,
    modified: result.modifiedCount,
    upserted: result.upsertedId,
  });

  return stepIdentifier;
}

export async function createSuggestedSteps(
  user: string,
  intentionId: string,
  suggestions: any[]
): Promise<InsertManyResult<Document> | null> {
  const col = await getCollection("steps");
  const docs = suggestions.map((s) => ({
    user,
    intentionId,
    bucket: s.bucket,
    text: s.text,
    status: "suggested",
    source: "ai",
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  if (!docs.length) {
    debug.warn("Mongo: createSuggestedSteps called with empty suggestions", { intentionId });
    return null;
  }

  debug.trace("Mongo: inserting suggested steps", { user, intentionId, count: docs.length });
  const result = await col.insertMany(docs);
  debug.info("Mongo: inserted suggested steps", { inserted: result.insertedCount });
  return result;
}

export async function updateStepStatus(user: string, stepId: any, status: string) {
  const col = await getCollection("steps");
  let lookupId = stepId;

  if (typeof stepId === "string") {
    try {
      lookupId = new ObjectId(stepId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      debug.error("Mongo: invalid step id for status update", { stepId, message });
      return {
        acknowledged: false,
        matchedCount: 0,
        modifiedCount: 0,
        upsertedCount: 0,
        upsertedId: null,
      } as any;
    }
  }

  debug.trace("Mongo: updating step status", { stepId: lookupId, status });
  const result = await col.updateOne(
    { _id: lookupId, user },
    { $set: { status, updatedAt: new Date() } }
  );
  debug.info("Mongo: step status updated", { matched: result.matchedCount });
  return result;
}

export async function getStepForUser(user: string, stepId: string) {
  const col = await getCollection("steps");
  debug.trace("Mongo: fetching step for user", { user, stepId });

  const queries: Array<Record<string, unknown>> = [];

  if (typeof stepId === "string" && ObjectId.isValid(stepId)) {
    try {
      queries.push({ _id: new ObjectId(stepId), user });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      debug.warn("Mongo: failed to coerce step id to ObjectId", { stepId, message });
    }
  }

  if (typeof stepId === "string") {
    queries.push({ _id: stepId, user });
    queries.push({ id: stepId, user });
  }

  for (const query of queries) {
    const doc = await col.findOne(query);
    if (doc) {
      debug.info("Mongo: step found for user", { user, stepId });
      return doc;
    }
  }

  debug.warn("Mongo: step not found for user", { user, stepId });
  return null;
}

export async function getOpportunitiesByStep(user: string, stepId: string): Promise<Opportunity[]> {
  const col = await getCollection<OpportunityDocument>("opportunities");
  const normalizedStepId = String(stepId);

  debug.trace("Mongo: fetching opportunities", { user, stepId: normalizedStepId });

  const docs = await col.find({ user, stepId: normalizedStepId }).toArray();
  const sorted = [...docs].sort((a, b) => {
    const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
    const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
    return aTime - bTime;
  });

  const mapped = sorted.map(mapOpportunity);

  debug.info("Mongo: opportunities fetched", {
    user,
    stepId: normalizedStepId,
    count: mapped.length,
  });

  return mapped;
}

export async function createOpportunitiesForStep(
  user: string,
  stepId: string,
  drafts: OpportunityDraft[],
): Promise<Opportunity[]> {
  if (!Array.isArray(drafts) || drafts.length === 0) {
    debug.warn("Mongo: createOpportunitiesForStep called with no drafts", { user, stepId });
    return [];
  }

  const col = await getCollection<OpportunityDocument>("opportunities");
  const normalizedStepId = String(stepId);

  const documents: OpportunityDocument[] = drafts.map((draft) => {
    const timestamp = new Date();
    return {
      _id: new ObjectId(),
      user,
      stepId: normalizedStepId,
      title: draft.title,
      summary: draft.summary,
      source: draft.source,
      form: draft.form,
      focus: draft.focus,
      status: draft.status,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  });

  debug.trace("Mongo: inserting opportunities", {
    user,
    stepId: normalizedStepId,
    count: documents.length,
  });

  const result = await col.insertMany(documents);
  const insertedIds = Object.values(result.insertedIds) as ObjectId[];

  const created = documents.map((doc, index) => {
    const insertedId = insertedIds[index] ?? doc._id;
    return mapOpportunity({ ...doc, _id: insertedId });
  });

  debug.info("Mongo: opportunities inserted", {
    user,
    stepId: normalizedStepId,
    count: created.length,
  });

  return created;
}

export async function deleteOpportunitiesForStep(user: string, stepId: string): Promise<void> {
  const col = await getCollection<OpportunityDocument>("opportunities");
  const normalizedStepId = String(stepId);

  debug.trace("Mongo: deleting opportunities", { user, stepId: normalizedStepId });
  await col.deleteMany({ user, stepId: normalizedStepId });
  debug.info("Mongo: opportunities deleted", { user, stepId: normalizedStepId });
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
