/**
 * Unit tests for lib/db/mongo.ts using Jest module mocks.
 * Verifies:
 *  - Throws when env vars are missing (guard)
 *  - getClient() connects once (caching across subsequent calls)
 *  - db() returns named database and is cached
 */
jest.mock("mongodb", () => {
  const connect = jest.fn().mockResolvedValue(undefined)
  const db = jest.fn().mockImplementation((name: string) => ({ databaseName: name, command: jest.fn().mockResolvedValue({ ok: 1 }) }))
  class MongoClientMock {
    static connectCalls = 0
    constructor() {}
    async connect() { MongoClientMock.connectCalls++; return connect() }
    db(name: string) { return db(name) }
  }
  return {
    MongoClient: MongoClientMock,
    ServerApiVersion: { v1: "v1" }
  }
})

// We must set env vars for this test file BEFORE importing the module under test.
const OLD_ENV = process.env
beforeEach(() => {
  jest.resetModules()
  process.env = { ...OLD_ENV, MONGODB_URI: "mongodb://localhost:27017", MONGODB_DB: "testdb" }
})
afterAll(() => { process.env = OLD_ENV })

test("env guards: throws if MONGODB_URI / MONGODB_DB missing", async () => {
  process.env.MONGODB_URI = ""
  await expect(async () => {
    // dynamic import to re-evaluate guards
    await import("@/lib/db/mongo")
  }).rejects.toThrow(/MONGODB_URI is not set/)

  process.env.MONGODB_URI = "mongodb://localhost:27017"
  process.env.MONGODB_DB = ""
  await expect(async () => {
    await import("@/lib/db/mongo")
  }).rejects.toThrow(/MONGODB_DB is not set/)
})

test("getClient caches connection; db() returns named DB and is cached", async () => {
  const mod = await import("@/lib/db/mongo")
  const c1 = await mod.getClient()
  const c2 = await mod.getClient()
  expect(c1).toBe(c2) // cached client

  const d1 = await mod.db()
  const d2 = await mod.db()
  expect(d1).toBe(d2) // cached db
  expect(d1.databaseName).toBe("testdb")
})

test("ping returns ok true with db name", async () => {
  const mod = await import("@/lib/db/mongo")
  const res = await mod.ping()
  expect(res.ok).toBe(true)
  expect(res.db).toBe("testdb")
})
