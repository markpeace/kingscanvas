# PLAN — Epoch 0005: Basic App Pages & Routes

## Context
Now that deployment, environment config, and developer tooling are stable, we can scaffold basic navigation and pages.
This epoch focuses on foundational routing — giving the app a navigable skeleton visible in Vercel previews and usable on mobile.

## Objectives
- Add initial Next.js App Router pages: "/", "/login", "/dashboard", and "not-found".
- Create a lightweight navigation header component shared across pages.
- Add placeholder copy to each page describing its future purpose.
- Implement a soft "auth guard" message on "/dashboard" (no NextAuth integration yet).
- Ensure pages are responsive and render cleanly on mobile devices.

## Deliverables
- PLAN and STATUS files for this epoch.
- Navigable routes and header component (to be added in later PRs).
- Verified preview showing working navigation.

## Proposed PR sequence within this epoch
1) **PR 1 — Plan & Status (this PR):** add PLAN.md and STATUS.yaml only.  
2) **PR 2 — Pages & Nav Scaffold:** create /login, /dashboard, /not-found pages, and header/nav component.  
3) **PR 3 — Mobile UX Polish:** refine layout spacing, tap targets, and ensure dark-mode consistency.  
4) **PR 4 — Verify & Close:** update README and ROADMAP, mark epoch done.

## Acceptance Criteria (Definition of Done for the epoch)
- Routes "/", "/login", "/dashboard" render successfully in Vercel Preview.
- Header navigation works across pages and highlights current route.
- "/dashboard" displays a "Sign in to continue" placeholder (no auth yet).
- A custom "Not Found" page renders for unmatched routes.
- All pages responsive and readable on mobile.

## Out of Scope
- Real authentication logic (NextAuth arrives in a later epoch).
- Database connectivity.
- Persistent layout state beyond navigation.

## Links
- Roadmap: /docs/ROADMAP/ROADMAP.md
- Previous epoch: /docs/ROADMAP/EPOCHS/epoch-0004-debug-panel/
