import { ObjectId } from "mongodb";
import type { Document, InsertManyResult, UpdateResult } from "mongodb";

import type {
  BucketId,
  Opportunity,
  OpportunityFocus,
  OpportunityForm,
  OpportunitySource,
  OpportunityStatus,
} from "@/types/canvas";

import { getCollection } from "@/lib/dbHelpers";
import { debug } from "./debug";

type OpportunityDocument = {
  _id: ObjectId | string;
  user: string;
  stepId: string;
  title: string;
  summary: string;
  source: OpportunitySource;
  form: OpportunityForm;
  focus: OpportunityFocus[] | OpportunityFocus;
  status: OpportunityStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type StepDocument = {
  _id: ObjectId | string;
  user: string;
  intentionId?: string;
  title?: string;
  text?: string;
  bucket?: BucketId;
  tags?: string[];
  [key: string]: unknown;
};

export type OpportunityUpsertInput = {
  id?: string;
  stepId: string;
  title: string;
  summary: string;
  source: OpportunitySource;
  form: OpportunityForm;
  focus: OpportunityFocus[] | OpportunityFocus;
  status: OpportunityStatus;
};

function normalizeFocusValue(
  focus: OpportunityFocus[] | OpportunityFocus | undefined,
): OpportunityFocus[] {
  if (!focus) {
    return [];
  }

  return Array.isArray(focus) ? focus : [focus];
}

function parseOpportunityId(id: string): ObjectId | string {
  if (ObjectId.isValid(id)) {
    try {
      return new ObjectId(id);
    } catch (error) {
      debug.warn("Mongo: failed to parse opportunity id as ObjectId", {
        id,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return id;
}

function parseStepId(id: string): ObjectId | string {
  if (ObjectId.isValid(id)) {
    try {
      return new ObjectId(id);
    } catch (error) {
      debug.warn("Mongo: failed to parse step id as ObjectId", {
        id,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return id;
}

function mapOpportunityDocument(doc: OpportunityDocument): Opportunity {
  const focus = normalizeFocusValue(doc.focus);
  let idValue: string;

  if (typeof doc._id === "string") {
    idValue = doc._id;
  } else if (doc._id instanceof ObjectId) {
    idValue = doc._id.toHexString();
  } else {
    idValue = String(doc._id);
  }

  return {
    _id: idValue,
    id: idValue,
    stepId: doc.stepId,
    title: doc.title,
    summary: doc.summary,
    source: doc.source,
    form: doc.form,
    focus,
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

/**
 * Save or update a step for a given user.
 */
export async function saveUserStep(email: string, step: any): Promise<UpdateResult<Document>> {
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
  return result;
}

export async function getStepById(user: string, stepId: string): Promise<StepDocument | null> {
  const col = await getCollection<StepDocument>("steps");
  const lookupId = parseStepId(stepId);

  debug.trace("MongoDB: fetching step by id", { user, stepId });
  const doc = await col.findOne({ _id: lookupId, user });

  if (!doc) {
    debug.info("MongoDB: step not found", { user, stepId });
    return null;
  }

  debug.info("MongoDB: step fetched", { user, stepId });
  return doc;
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

export async function getOpportunitiesByStep(user: string, stepId: string): Promise<Opportunity[]> {
  const col = await getCollection<OpportunityDocument>("opportunities");
  debug.trace("Mongo: fetching opportunities", { user, stepId });
  const docs = await col.find({ user, stepId }).toArray();
  debug.info("Mongo: opportunities fetched", { count: docs.length });
  return docs.map(mapOpportunityDocument);
}

export async function getOpportunityById(user: string, opportunityId: string): Promise<Opportunity | null> {
  const col = await getCollection<OpportunityDocument>("opportunities");
  const lookupId = parseOpportunityId(opportunityId);
  debug.trace("Mongo: fetching opportunity by id", { user, opportunityId });
  const doc = await col.findOne({ _id: lookupId, user });

  if (!doc) {
    debug.info("Mongo: opportunity not found", { user, opportunityId });
    return null;
  }

  debug.info("Mongo: opportunity fetched", { user, opportunityId });
  return mapOpportunityDocument(doc);
}

export async function upsertOpportunity(
  user: string,
  opportunity: OpportunityUpsertInput,
): Promise<Opportunity> {
  const col = await getCollection<OpportunityDocument>("opportunities");
  const now = new Date();
  const focus = normalizeFocusValue(opportunity.focus);

  if (opportunity.id) {
    const lookupId = parseOpportunityId(opportunity.id);
    debug.trace("Mongo: updating opportunity", {
      user,
      opportunityId: opportunity.id,
      stepId: opportunity.stepId,
    });

    const result = await col.updateOne(
      { _id: lookupId, user },
      {
        $set: {
          stepId: opportunity.stepId,
          title: opportunity.title,
          summary: opportunity.summary,
          source: opportunity.source,
          form: opportunity.form,
          focus,
          status: opportunity.status,
          updatedAt: now,
        },
        $setOnInsert: { user, createdAt: now },
      },
      { upsert: true }
    );

    const targetId = lookupId;

    const stored = await col.findOne({ _id: { $eq: targetId }, user });

    if (!stored) {
      debug.error("Mongo: opportunity missing after upsert", { user, opportunityId: opportunity.id });
      throw new Error("Opportunity not found after upsert");
    }

    debug.info("Mongo: opportunity upserted", {
      user,
      opportunityId: opportunity.id,
      matched: result.matchedCount,
      upserted: result.upsertedCount,
    });

    return mapOpportunityDocument(stored);
  }

  debug.trace("Mongo: inserting opportunity", { user, stepId: opportunity.stepId });

  const insertDoc: Omit<OpportunityDocument, "_id"> = {
    user,
    stepId: opportunity.stepId,
    title: opportunity.title,
    summary: opportunity.summary,
    source: opportunity.source,
    form: opportunity.form,
    focus,
    status: opportunity.status,
    createdAt: now,
    updatedAt: now,
  };

  const insertResult = await col.insertOne(insertDoc as unknown as OpportunityDocument);
  const insertedId =
    insertResult.insertedId &&
    (typeof insertResult.insertedId === "string" || insertResult.insertedId instanceof ObjectId)
      ? insertResult.insertedId
      : new ObjectId();

  const stored = await col.findOne({ _id: insertedId, user });
  const finalDoc = stored ?? ({ ...insertDoc, _id: insertedId } as OpportunityDocument);

  debug.info("Mongo: opportunity inserted", {
    user,
    opportunityId: typeof insertedId === "string" ? insertedId : insertedId.toString(),
  });

  return mapOpportunityDocument(finalDoc);
}

export async function createOpportunities(
  user: string,
  opportunities: OpportunityUpsertInput[],
): Promise<Opportunity[]> {
  if (!Array.isArray(opportunities) || opportunities.length === 0) {
    debug.warn("Mongo: createOpportunities called with empty payload", { user });
    return [];
  }

  const col = await getCollection<OpportunityDocument>("opportunities");
  const now = new Date();

  const docs: OpportunityDocument[] = opportunities.map((opportunity) => ({
    _id: new ObjectId(),
    user,
    stepId: opportunity.stepId,
    title: opportunity.title,
    summary: opportunity.summary,
    source: opportunity.source,
    form: opportunity.form,
    focus: normalizeFocusValue(opportunity.focus),
    status: opportunity.status,
    createdAt: now,
    updatedAt: now,
  }));

  debug.trace("Mongo: inserting multiple opportunities", { user, count: docs.length });

  const result = await col.insertMany(docs);
  const insertedIds = Object.values(result.insertedIds ?? {}).map((value) => {
    if (typeof value === "string") {
      return value;
    }

    if (value instanceof ObjectId) {
      return value;
    }

    return null;
  });

  const lookupIds = insertedIds.filter(
    (value): value is string | ObjectId => value !== null && value !== undefined,
  );

  let stored = lookupIds.length
    ? await col.find({ _id: { $in: lookupIds }, user }).toArray()
    : [];

  if (!stored.length) {
    stored = docs;
  }

  debug.info("Mongo: inserted opportunities", {
    user,
    count: stored.length,
    inserted: result.insertedCount,
  });

  return stored.map(mapOpportunityDocument);
}

export async function deleteOpportunity(user: string, opportunityId: string): Promise<void> {
  const col = await getCollection<OpportunityDocument>("opportunities");
  const lookupId = parseOpportunityId(opportunityId);
  debug.trace("Mongo: deleting opportunity", { user, opportunityId });
  await col.deleteOne({ _id: lookupId, user });
  debug.info("Mongo: opportunity deleted", { user, opportunityId });
}
