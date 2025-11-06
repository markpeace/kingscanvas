# ROADMAP — NextJS PWA Template

Organized into **epochs**, each on its own branch. Vercel previews land from day one so you can test on-device continuously.

---

## Epoch 0001 — Deployment & CI (Vercel First)
_Status: Completed ✅ — Vercel previews confirmed working as of 2025-10-04._
- Confirm repo builds cleanly on Vercel.
- Configure project and previews.
- Document deploy steps in README.
- **Outcome:** every PR/epoch auto-deploys to a Vercel preview.

---

## Epoch 0002 — Environment Variables & Configuration
_Status: Completed ✅ — Environment variables defined and verified on 2025-10-05._
- Define all required env vars in `.env.example`:
  - NEXTAUTH_URL
  - NEXTAUTH_SECRET
  - GOOGLE_CLIENT_ID
  - GOOGLE_CLIENT_SECRET
  - MONGODB_URI
  - OPENAI_API_KEY
  - DEBUG_PANEL_ENABLED
- Document their purpose in the README.
- Configure variables in Vercel project settings.
- **Outcome:** environment variables consistently defined for local and cloud builds.

---

## Epoch 0003 — Project Scaffolding & Core Setup
- Scaffold Next.js App Router with TypeScript.
- Add Tailwind, ESLint, Prettier, VSCode recommendations.
- Repo structure aligned with CodeBuddy protocols.
- **Outcome:** clean local dev + preview builds.

---

## Epoch 0004 — Debug Panel (Early)
_Status: Completed ✅ — Debug Panel and Logger documented, dark-mode compatible, and verified._
- Env-toggled debug panel available in dev/previews.
- Simple sink API to push events/state.
- Visible toggle to open/close panel.
- **Outcome:** on-device inspection for subsequent features.

---

## Epoch 0005 — Basic App Pages & Routes (Tap-Testable)
_Status: Completed ✅ — Navigation, routing, and mobile layout verified (Epoch 0005)._
- Core routes: `/`, `/login`, `/dashboard`.
- Shared layout + simple nav; responsive baseline.
- Placeholder “requires sign-in” state for dashboard.
- **Outcome:** you can navigate and test flows on a phone.

---

## Epoch 0006 — UI Primitives
_Status: Completed ✅ — Component library and /ui-demo verified on-device (Epoch 0006)._ 
- Shipped Tailwind + Radix-based primitives under `/components/ui/` (Button, Input, Card, Modal).
- Added tokens/utilities for focus states, spacing, and dark-mode parity.
- Published `/ui-demo` route showcasing all primitives for quick regression checks.
- **Outcome:** reusable, accessible building blocks power later form, toast, and AI work.

---

## Epoch 0007 — Progressive Web App (PWA)
_Status: Completed ✅ — Manifest, SW caching, and install UX shipped (Epoch 0007)._ 
- Manifest + icons; service worker + caching strategy.
- Custom, dismissible install-to-home-screen prompt.
- Target Lighthouse PWA ≥ 90 on default routes.
- **Outcome:** installable app with offline basics.

---

## Epoch 0008 — Toast Notifications
_Status: In progress ⚙️ — Core toast system wiring underway; last updated 2025-10-08._
- Install toast library and expose provider in `app/layout.tsx`.
- Create demo controls in `/ui-demo` to validate success/error flows.
- Align placement and styling for consistent desktop/mobile behavior.
- **Outcome (pending):** ready-to-use notification hook surfaced across the template.

---

## Epoch 0009 — Forms & Validation
_Status: Completed ✅ — RHF + Zod demos, helpers, and docs landed (Epoch 0009)._ 
- Added `/components/form` helpers layered on React Hook Form.
- Wired Zod validation with resolver support and shared error helpers.
- Published `/forms-demo` route with success/error toasts and mobile polish.
- **Outcome:** template ships with production-ready form patterns.

---

## Epoch 0010 — Testing & Observability _(Superseded)_
_Status: Superseded ⚠️ — Archived in favour of Epoch 0017 (see below)._ 
- Original plan outlined Jest, Playwright, and observability wiring.
- Early scaffolding work moved wholesale to the later Epoch 0017 delivery.
- **Outcome:** Refer to **Epoch 0017** for the authoritative implementation.

---

## Epoch 0011 — State Helpers _(Planned)_
_Status: Planned — Scheduling TBD once downstream needs emerge._
- Introduce lightweight global state (e.g., Zustand).
- Example slice + demo widget to observe changes.
- Tests confirming predictable updates.
- **Outcome:** ready pattern for shared state.

---

## Epoch 0011 — Authentication (NextAuth + Google)
_Status: Completed ✅ — Google OAuth flow, protected dashboard, and session helpers landed (Epoch 0011)._ 
- Integrate Google provider with secure session handling.
- Replace dashboard placeholder with authenticated-only content scaffold.
- Provide sign-in/out UI and supporting hooks/components.
- **Outcome:** template demonstrates end-to-end auth guard patterns.

---

## Epoch 0012 — Database (MongoDB)
_Status: Completed ✅ — Profiles CRUD, Mongo helpers, and health checks live (Epoch 0012)._ 
- Connect to MongoDB with shared client helper and connection pooling.
- Implement `/api/health/db` and supporting diagnostics.
- Ship CRUD example for profiles with optimistic UI + tests.
- **Outcome:** database integration ready for extension in downstream forks.

---

## Epoch 0013 — AI Integration (LangChain + LangGraph)
_Status: Completed ✅ — Ping/Streaming/Tools live; Graph behind flag; docs and cleanup done._
- Integrated LangChain/LangGraph with OpenAI client and optional base URL.
- Exposed `/api/ai/{ping,stream,tools}` plus guarded `/api/ai/graph` endpoint.
- Added UI demos on `/ui-demo` for ping, streaming, tool invocation, and graph (flagged).
- Wired MongoDB-backed tool example (`profiles_search`) and LangSmith tracing hooks.
- **Outcome:** template showcases production-ready AI orchestration patterns.

---

## Epoch 0014 — UI Primitives & Form Helpers
_Status: Completed ✅ — Form wrappers, async helpers, and `/ui-demo/forms` published (Epoch 0014)._ 
- Consolidated UI exports and form-friendly wrappers under `/components/ui` and `/components/form`.
- Delivered `useZodErrorFor`, `withSubmit`, and other ergonomics helpers.
- Expanded `/ui-demo` with interactive form demos validated against Zod + toasts.
- **Outcome:** template includes cohesive UI/form toolkit with docs and examples.

---

## Epoch 0017 — Testing & Observability
_Status: Completed ✅ — Jest, MSW, Playwright smoke tests, and logging helpers finished (Epoch 0017)._ 
- Scaffolded Jest + React Testing Library with example unit tests and MSW handlers.
- Added Playwright configuration and smoke specs covering critical routes.
- Wired coverage command (`npm run test:ci`) and documented workflows under `/docs/TESTING`.
- Extended debug logging helpers to surface observability events in the Debug Panel.
- **Outcome:** template ships with batteries-included testing and developer telemetry.
