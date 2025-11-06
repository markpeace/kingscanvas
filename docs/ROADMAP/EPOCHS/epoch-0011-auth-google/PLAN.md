# PLAN — Epoch 0011: Authentication (NextAuth + Google)

## Context
We want first-party authentication using **NextAuth.js** with the **Google** provider (only). The goal is to protect the `/dashboard` route, expose a sign-in/out flow, and surface the session in client/server components (App Router).

## Objectives
- Add `next-auth` and Google provider.
- Configure Auth route handlers and session helpers (server + client).
- Create `/login` UI wired to Google Sign in.
- Gate `/dashboard` behind `auth()` (server) or `useSession()` (client).
- Add header avatar/menu (signed-in) and “Sign in” (signed-out).
- Document required **environment variables** and Vercel callback setup.

## Environment Variables (define in Vercel Project → Settings → Environment Variables)
- `GOOGLE_CLIENT_ID` — from Google Cloud OAuth Client (Web).
- `GOOGLE_CLIENT_SECRET` — from Google Cloud.
- `NEXTAUTH_SECRET` — random 32+ char; generate with `openssl rand -base64 32`.
- `NEXTAUTH_URL` — e.g., `https://<your-vercel-preview-or-prod-domain>`.
- Optional (dev convenience): `.env.local` with the same keys.

## Deliverables
- Auth config: `auth.config.ts` + `auth.ts` (NextAuth helpers).
- Route handlers: `app/api/auth/[...nextauth]/route.ts` (GET/POST).
- Components: `components/auth/SignInButton.tsx`, `SignOutButton.tsx`, `UserMenu.tsx`.
- Layout/header integration: conditional “Sign in” vs avatar menu.
- `/login` page: “Sign in with Google” flow using our UI primitives.
- `/dashboard` protection: server-side check with `auth()` + redirect to `/login` when unauthenticated.
- README + ROADMAP updates.

## Proposed PR sequence within this epoch
1) **PR 1 — Plan & Status (this PR)**: add PLAN.md and STATUS.yaml.
2) **PR 2 — Dependencies + Auth scaffolding**: next-auth setup, env docs, route handlers, helpers.
3) **PR 3 — UI integration**: header sign-in/out, `/login` page.
4) **PR 4 — Gate `/dashboard` + session demo**: protect route; show session data snippet.
5) **PR 5 — Verify & Close**: docs, ROADMAP, STATUS finalization.

## Acceptance Criteria (Definition of Done)
- Clicking **Sign in with Google** completes OAuth and returns to app.
- Signed-in users see avatar/user menu with **Sign out**.
- Visiting `/dashboard` when signed out redirects to `/login`.
- Session available via `auth()` (server) and `useSession()` (client).
- Docs list env vars + Google OAuth callback URL and scopes.

## Out of Scope
- Other OAuth providers.
- Credentials/Email magic-link.
- DB adapters (we'll use JWT session for now).

## Notes
- Deploy target: **Vercel**. Confirm **Callback URL** in Google Cloud OAuth:
  - `https://<your-domain>/api/auth/callback/google`
- For local dev: set `NEXTAUTH_URL=http://localhost:3000`.

## Links
- Roadmap: /docs/ROADMAP/ROADMAP.md
- Forms epoch (for login UI patterns): /docs/ROADMAP/EPOCHS/epoch-0009-forms-validation/
- PWA epoch (install UX): /docs/ROADMAP/EPOCHS/epoch-0007-pwa/
