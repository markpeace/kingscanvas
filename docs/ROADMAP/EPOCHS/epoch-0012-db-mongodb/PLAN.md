# PLAN — Epoch 0012: Database (MongoDB)

## Context
The template needs a first-class MongoDB setup with minimal friction on Vercel. We will add a thin connection helper using the official MongoDB Node.js driver, environment-driven configuration, and a simple demo route with tests to prove connectivity. (NextAuth continues to use JWT sessions; DB adapter can be added later if needed.)

## Environment Variables (define now in Vercel)
- `MONGODB_URI` — full connection string (e.g., from MongoDB Atlas)
- `MONGODB_DB` — database name (e.g., `nextjspwa_template`)

## Objectives
- Install official `mongodb` driver.
- Add a pooled, cached connection helper compatible with App Router hot reloads.
- Expose a `/api/db/health` endpoint to verify connectivity at runtime.
- Provide a tiny data access layer example (e.g., `profiles` collection) with Zod-validated DTOs.
- Add unit tests for the helper and a smoke E2E that hits `/api/db/health`.

## Deliverables
- `lib/db/mongo.ts` — cached client + db() helper.
- `lib/db/types.ts` — shared types and Zod schemas for demo collection.
- `app/api/db/health/route.ts` — ping endpoint.
- Example `app/api/profiles/route.ts` (GET/POST minimal sample).
- Tests: unit for `mongo.ts`; Playwright smoke for `/api/db/health`.
- README section with setup steps and troubleshooting notes.

## Proposed PR sequence within this epoch
1) PR 1 — Plan & Status (this PR)
2) PR 2 — Dependencies + connection helper + /api/db/health
3) PR 3 — Example collection (profiles) + DTO validation + basic CRUD
4) PR 4 — Tests (unit + E2E) and docs
5) PR 5 — Verify & Close (README + ROADMAP updates)

## Acceptance Criteria (Definition of Done)
- `MONGODB_URI` and `MONGODB_DB` are the only required DB env vars.
- `/api/db/health` returns `{ ok: true }` when connected.
- Example CRUD works locally and on Vercel Preview.
- Unit + E2E tests pass in CI.
- README documents configuration and common Atlas/VPC pitfalls.

## Out of Scope
- ODMs (Mongoose) or complex schema migrations.
- NextAuth DB adapter (can be added later if session persistence is desired).

## Notes
- We’ll use a **singleton/cached client** to avoid re-connecting on hot reloads.
- Connection pooling is handled by the driver; Vercel serverless is supported.

## Links
- Roadmap: /docs/ROADMAP/ROADMAP.md
- Auth epoch: /docs/ROADMAP/EPOCHS/epoch-0011-auth-google/
- Testing epoch: /docs/ROADMAP/EPOCHS/epoch-0010-testing-observability/
