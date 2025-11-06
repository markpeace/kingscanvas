# PRODUCT_SPEC.md — NextJS PWA Template

## Product Name
**NextJS PWA Template**

## Vision
NextJS PWA Template is a **progressive web app boilerplate** built on modern full-stack tooling to help developers rapidly prototype and ship **installable, mobile-first web apps** with optional AI features. It balances “fork-and-go” simplicity with best practices (TDD, linting, auth, deploy setup) so projects can scale from idea → prototype → production.

## Why This Exists
Many starters are either too minimal (missing auth, tests, deploy glue) or too heavy (opinionated stacks). This template aims to be:
- **Minimal but complete** — everything needed to start, nothing extraneous.
- **PWA-first** — installable on iOS/Android/desktop with offline support.
- **Production-leaning** — tests, linting, formatting, and Vercel-ready.
- **AI-ready (optional)** — helpers for LangChain/LangGraph + OpenAI.

## Target Audience
- Indie hackers and teams validating ideas.
- Internal tools and hackathon projects.
- Educators/learners exploring Next.js + PWAs + AI.

---

## Scope & Core Features

### Framework & Architecture
- **Next.js (App Router, latest stable) + TypeScript**
- Folder-by-feature conventions and clear separation of server/client components.

### PWA
- Web App Manifest (`/public/manifest.json`) with icons/splash assets.
- Service Worker for:
  - App shell caching of critical routes.
  - Runtime caching for API/static assets.
- **Install prompt UX**: custom, dismissible in-app prompt.
- Lighthouse PWA score target **≥ 90** on default routes.

### Authentication
- **NextAuth** with **Google provider**.
- Session handling, secure cookies, and protected routes.
- Example sign-in/sign-out UI and `auth()` helpers.

### Database
- **MongoDB** via Mongoose or official driver.
- Connection util with singleton pattern.
- Example User model (minimal fields).

### AI (Optional)
- **LangChain & LangGraph** helpers.
- Thin utilities to call OpenAI models (model ID via env).
- Example `/api/ai/echo` route.
- Future: integrate from `docs/llms.txt`.

### Styling & UI
- **Tailwind CSS** preconfigured.
- Minimal UI primitives (Button, Card, Input, Form).
- Mobile-first layouts.

### Utilities
- **Global Toast** notification system.
- **Debug Panel** toggled via env var.
- Lightweight state management with **Zustand**.
- **React Hook Form** for forms + validation.

### Testing
- **Jest** + **React Testing Library**.
- Example tests for auth, PWA, toast/debug.
- `npm run test` + watch mode.

### Developer Experience
- **ESLint + Prettier**.
- VS Code recommended extensions.
- `.env.example` provided.

### Deployment
- **Vercel-ready** out of the box.
- README with deploy steps.

---

## Example Routes
- `/` — Splash/landing page.
- `/login` — Google login.
- `/dashboard` — Protected dashboard.
- `/api/ai/echo` — AI demo route.

---

## Goals
- Be **fork-and-go**.
- Be **test-ready**.
- Be **extendable**.
- Be **deployable**.

---

## Out of Scope
- No business logic.
- No payments.
- No theming engine.
- No multi-tenancy.

---

## Tech Stack
- **Frontend**: Next.js, Tailwind, Zustand.
- **Backend**: Next.js API routes, MongoDB.
- **Auth**: NextAuth (Google).
- **AI**: LangChain + LangGraph helpers.
- **Forms**: React Hook Form.
- **Testing**: Jest, React Testing Library.
- **Deployment**: Vercel.

---

## Developer Onboarding
1. Clone repo.
2. Copy `.env.example` → `.env.local`.
3. Add credentials:
   - Google OAuth client ID/secret.
   - MongoDB URI.
   - OpenAI key (optional).
4. Run `npm install && npm run dev`.
5. Open `http://localhost:3000`.

---

## Notes
- Mobile-first design.
- Single source of truth in this spec.
- README complements with setup/deploy.
