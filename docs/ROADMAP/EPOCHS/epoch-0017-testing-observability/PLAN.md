# PLAN — Epoch 0017: Testing & Observability

## Goal
Establish a lean, fast test stack (unit + integration) with clear DX, CI-ready scripts, and basic observability hooks so every clone ships with confidence.

## Scope
- Testing stack
  - Jest (Next.js preset), TypeScript support (ts-jest or swc via next/jest)
  - React Testing Library + @testing-library/jest-dom
  - MSW (Mock Service Worker) for API mocking
- Project wiring
  - jest.config.ts using next/jest
  - test/setup.ts for RTL + jest-dom + msw server (node)
  - test/utils.ts helpers (renderWithProviders, user setup)
  - npm scripts: test, test:watch, test:ci, coverage
- Seed tests (observable)
  - Unit: ui Button renders/variants
  - Unit: form helpers (useZodErrorFor)
  - Integration: /api/ai/ping happy path (mocked)
  - Integration: debug panel sink logs (client util)
- Observability
  - Minimal test summary surfaced in Debug Panel (when visible)
  - Docs: how to run locally and in CI (Vercel)

## Non-goals
- Full E2E (Playwright/Cypress) — future epoch
- Visual regression testing — out of scope

## Acceptance Criteria
- `npm run test` passes locally (no flakiness)
- Sample tests are deterministic and fast (< 2s on CI)
- Coverage report generated (`coverage/`) and documented
- Docs explain how to add tests for routes, components, hooks

## Proposed PR sequence
1) PR 1 — Plan & Status (this PR)
2) PR 2 — Tooling scaffold (deps, jest.config.ts, setup files, scripts)
3) PR 3 — Seed unit tests (ui + forms)
4) PR 4 — Seed integration tests (API + debug sink), coverage wiring
5) PR 5 — Docs polish + Verify & Close

## Risks & Mitigations
- Env flakiness in CI → avoid real network; use MSW for deterministic tests
- Next.js app router quirks → use next/jest preset and whatwg-fetch polyfill in setup
