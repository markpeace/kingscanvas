jest.mock("mongodb", () => {
  let counter = 0;

  class FakeObjectId {
    private value: string;

    constructor(id?: string) {
      if (id && FakeObjectId.isValid(id)) {
        this.value = id;
      } else {
        counter += 1;
        this.value = counter.toString().padStart(24, "0");
      }
    }

    toHexString() {
      return this.value;
    }

    toString() {
      return this.value;
    }

    static isValid(id: unknown) {
      return typeof id === "string" && id.length > 0;
    }
  }

  return { ObjectId: FakeObjectId };
});

import { ObjectId } from "mongodb";

type StoredOpportunity = {
  _id: ObjectId | string;
  user: string;
  stepId: string;
  title: string;
  summary: string;
  source: string;
  form: string;
  focus: string[];
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

function idsEqual(a: ObjectId | string | undefined, b: ObjectId | string | undefined): boolean {
  if (a === undefined || b === undefined) {
    return a === b;
  }

  const toString = (value: ObjectId | string) =>
    value instanceof ObjectId ? value.toHexString() : String(value);

  return toString(a) === toString(b);
}

function createFakeCollection(store: StoredOpportunity[]) {
  return {
    find: jest.fn((query: { user: string; stepId: string }) => ({
      toArray: jest.fn(async () =>
        store.filter((doc) => doc.user === query.user && doc.stepId === query.stepId),
      ),
    })),
    findOne: jest.fn(async (query: { _id: ObjectId | string; user: string }) =>
      store.find((doc) => idsEqual(doc._id, query._id) && doc.user === query.user) ?? null,
    ),
    insertOne: jest.fn(async (doc: Omit<StoredOpportunity, "_id"> & Partial<Pick<StoredOpportunity, "_id">>) => {
      const identifier = doc._id ?? new ObjectId();
      const stored: StoredOpportunity = {
        ...doc,
        _id: identifier,
      } as StoredOpportunity;
      store.push(stored);
      return { acknowledged: true, insertedId: identifier };
    }),
    updateOne: jest.fn(
      async (
        filter: { _id: ObjectId | string; user: string },
        update: {
          $set: Partial<StoredOpportunity>;
          $setOnInsert?: Partial<StoredOpportunity>;
        },
        options?: { upsert?: boolean },
      ) => {
        const index = store.findIndex(
          (doc) => idsEqual(doc._id, filter._id) && doc.user === filter.user,
        );

        if (index >= 0) {
          store[index] = {
            ...store[index],
            ...update.$set,
          };
          return { acknowledged: true, matchedCount: 1, modifiedCount: 1, upsertedCount: 0 };
        }

        if (options?.upsert) {
          const identifier = filter._id ?? new ObjectId();
          const stored: StoredOpportunity = {
            _id: identifier,
            user: filter.user,
            stepId: (update.$set.stepId ?? "") as string,
            title: (update.$set.title ?? "") as string,
            summary: (update.$set.summary ?? "") as string,
            source: (update.$set.source ?? "") as string,
            form: (update.$set.form ?? "") as string,
            focus: (update.$set.focus ?? []) as string[],
            status: (update.$set.status ?? "") as string,
            createdAt: (update.$setOnInsert?.createdAt ?? new Date()) as Date,
            updatedAt: (update.$set.updatedAt ?? new Date()) as Date,
          };
          store.push(stored);
          return {
            acknowledged: true,
            matchedCount: 0,
            modifiedCount: 0,
            upsertedCount: 1,
            upsertedId: { _id: identifier },
          };
        }

        return { acknowledged: true, matchedCount: 0, modifiedCount: 0, upsertedCount: 0 };
      },
    ),
    deleteOne: jest.fn(async (filter: { _id: ObjectId | string; user: string }) => {
      const index = store.findIndex(
        (doc) => idsEqual(doc._id, filter._id) && doc.user === filter.user,
      );

      if (index >= 0) {
        store.splice(index, 1);
        return { acknowledged: true, deletedCount: 1 };
      }

      return { acknowledged: true, deletedCount: 0 };
    }),
  };
}

describe("opportunity data access helpers", () => {
  afterEach(() => {
    jest.resetModules();
  });

  it("creates, retrieves, updates, and deletes opportunities", async () => {
    const store: StoredOpportunity[] = [];
    const fakeCollection = createFakeCollection(store);

    await jest.isolateModulesAsync(async () => {
      const getCollectionMock = jest.fn().mockResolvedValue(fakeCollection as unknown as any);
      jest.doMock("@/lib/dbHelpers", () => ({ getCollection: getCollectionMock }));

      const {
        getOpportunitiesByStep,
        getOpportunityById,
        upsertOpportunity,
        deleteOpportunity,
      } = await import("@/lib/userData");

      const created = await upsertOpportunity("user@example.com", {
        stepId: "step-1",
        title: "Explore internship",
        summary: "Reach out to alumni for internship opportunities",
        source: "independent",
        form: "evergreen",
        focus: "capital",
        status: "suggested",
      });

      expect(created.id).toBeDefined();
      expect(created.stepId).toBe("step-1");
      expect(created.focus).toEqual(["capital"]);

      const listed = await getOpportunitiesByStep("user@example.com", "step-1");
      expect(listed).toHaveLength(1);
      expect(listed[0].title).toBe("Explore internship");

      const fetched = await getOpportunityById("user@example.com", created.id);
      expect(fetched?.id).toBe(created.id);

      const updated = await upsertOpportunity("user@example.com", {
        id: created.id,
        stepId: "step-1",
        title: "Explore paid internship",
        summary: "Contact alumni and prepare application materials",
        source: "edge_simulated",
        form: "intensive",
        focus: ["capability", "credibility"],
        status: "saved",
      });

      expect(updated.title).toBe("Explore paid internship");
      expect(updated.focus).toEqual(["capability", "credibility"]);
      expect(updated.status).toBe("saved");

      await deleteOpportunity("user@example.com", created.id);
      const afterDelete = await getOpportunitiesByStep("user@example.com", "step-1");
      expect(afterDelete).toHaveLength(0);

      expect(getCollectionMock).toHaveBeenCalled();
    });
  });
});
