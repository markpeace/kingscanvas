# PLAN — Epoch 0010: Testing & Observability _(Superseded)_

> **Superseded on 2025-10-18:** The detailed testing and observability work landed under [epoch-0017-testing-observability](../epoch-0017-testing-observability/).
> This archived plan remains for traceability only.

## Context
The template is feature-complete for a first release (PWA, UI, Toasts, Forms). We now add a lean but effective test setup and basic observability so future clones are confident and measurable by default.

## Objectives
- Add **Jest** + **Testing Library** for unit/component tests (App Router-friendly).
- Add **Playwright** for smoke E2E (install + critical routes load).
- Provide **example tests** for UI primitives, forms validation, and a simple page.
- Add a minimal **coverage** target and npm scripts to run tests locally and in CI.
- Introduce a tiny **observability hook** (client + server log helpers) that can be wired to a vendor later.

## Deliverables
- Jest config, RTL setup file, sample tests under `/__tests__/` and `components/**/__tests__/`.
- Playwright config + one smoke spec (`/`, `/ui-demo`, `/forms-demo`).
- NPM scripts: `test`, `test:watch`, `test:coverage`, `e2e`, `e2e:headed`.
- Observability helpers: `lib/obs/client.ts`, `lib/obs/server.ts` with no-op transport and Debug Panel logging.

## Proposed PR sequence within this epoch
1) PR 1 — Plan & Status (this PR)
2) PR 2 — Jest + RTL base, example unit tests
3) PR 3 — Playwright E2E smoke tests
4) PR 4 — Observability helpers + docs
5) PR 5 — Verify & Close (README + ROADMAP updates)

## Acceptance Criteria (Definition of Done)
- `npm run test` passes locally and on CI (Preview builds).
- `npm run e2e` runs Playwright smoke tests against dev server.
- Example tests cover Button variant rendering, Input validation errors, and page routing.
- Coverage command generates a report (`coverage/`) with a modest threshold (e.g., lines >= 50%).
- Observability helpers callable from client/server and visible in Debug Panel for dev.

## Out of Scope
- Vendor-specific telemetry (Sentry, OpenTelemetry exporters) — can be added later.
- Complex CI matrices; we rely on Vercel for deploy checks and keep tests simple.

## Links
- Roadmap: /docs/ROADMAP/ROADMAP.md
- UI Primitives: /docs/ROADMAP/EPOCHS/epoch-0006-ui-primitives/
- Toasts: /docs/ROADMAP/EPOCHS/epoch-0008-toasts/
- Forms: /docs/ROADMAP/EPOCHS/epoch-0009-forms-validation/
