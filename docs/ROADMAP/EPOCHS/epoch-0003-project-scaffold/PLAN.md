# PLAN — Epoch 0003: Project Scaffolding & Core Setup

## Context
This epoch establishes the runnable application skeleton so subsequent epochs (debug panel, routes, PWA, auth) have a clean, consistent base. No features beyond a minimal landing page are included here.

## Objectives
- Introduce a baseline Next.js App Router project with TypeScript.
- Prepare the repository for styling (Tailwind), linting (ESLint), formatting (Prettier), and IDE hints (VS Code recommendations).
- Verify local build and Vercel Preview build succeed.

## Deliverables
- This PLAN and a STATUS tracker for the epoch.
- Follow-up PRs in this epoch will add actual code/config.

## Proposed PR sequence within this epoch
1) PR 1 — Plan & Status (this PR): add PLAN.md and STATUS.yaml only.
2) PR 2 — Next.js baseline: package.json, next.config.ts, tsconfig.json, /app with minimal page/layout, and a placeholder /public (no PWA yet).
3) PR 3 — Tooling: Tailwind CSS config & styles; ESLint + Prettier; .vscode/extensions.json.
4) PR 4 — Verify & close: README additions (Getting Started), local build check, Vercel preview note; mark epoch done.

## Acceptance Criteria (Definition of Done for the epoch)
- Running "npm run dev" starts the app locally and serves a minimal landing page.
- Running "npm run build" succeeds locally.
- Vercel Preview build succeeds and shows the landing page.
- Tailwind, ESLint, and Prettier are configured and operational.
- README includes a minimal "Getting Started" for the scaffold.

## Out of Scope
- PWA manifest and service worker (Epoch 0007).
- Debug panel (Epoch 0004).
- Routes "/login" and "/dashboard" (Epoch 0005).
- Auth, DB, Toast, Forms, State, AI (later epochs).

## Links
- Roadmap: /docs/ROADMAP/ROADMAP.md
- Previous epoch (env/config): /docs/ROADMAP/EPOCHS/epoch-0002-env-config/
