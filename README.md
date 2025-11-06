# AI-Driven Backend Template

<!-- Preview badge (static indicator; click through to the Deploying section) -->
[![Vercel Preview Enabled](https://img.shields.io/badge/Vercel-Preview%20Enabled-black)](#deploying-with-vercel-previews)

## Deploying with Vercel (Previews)

**Deployment verified:**
This template repository is connected to Vercel and configured for automatic Preview deployments.
Forks or template copies will not receive Preview URLs until a maintainer links their instance to Vercel.

**One-time setup for your fork/template**
1. Create your own Vercel project and import your GitHub fork (or follow the steps in `/docs/GUIDES/vercel-previews.md`).
2. Confirm the project is connected to the correct GitHub repository and branch.

**How it works (after linking)**
- When a PR is opened or updated, Vercel posts a **Preview URL** in the PR.

**Where to find it**
- Open any PR → look for the Vercel bot comment or the “Checks” panel → click the Preview link.

For step-by-step details, see: `/docs/GUIDES/vercel-previews.md`.

This repository is a **template backend** for AI-driven app scaffolding.
It encodes documentation, working practices, and contracts that guide the back-end AI (Codex/GPT).  

## Quickstart
1. Clone this repository and install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env.local` and fill in any required secrets.
3. Start the development server:
   ```bash
   npm run dev
   ```
4. (Optional) Run `npm run lint` or `npm test` before opening a PR.

That is all you need for day-to-day changes. Dive into **AGENTS.md** and `/docs` when you want the full protocol or compliance workflow.

## Testing & Observability (Epoch 0017 complete)
- Jest + React Testing Library + MSW preconfigured
- Coverage reporting via `npm run test:ci`
- See `docs/TESTING/README.md` and `docs/TESTING/SUMMARY.md` for details

## UI Toolkit (Epoch 0014 complete)
- Primitives available via `@/components/ui`.
- Form helpers via `@/components/form` (React Hook Form + Zod).
- Try the interactive demo: `/ui-demo/forms`.

## PR Preview Checklist

Before requesting review, confirm:
- The PR has a **Vercel Preview URL** in the Checks or bot comment.
- You opened the Preview on a **mobile device** and performed a smoke test.
- Any docs or screenshots affected by the change are updated.

> For setup and details, see: `/docs/GUIDES/vercel-previews.md`.

> **Note (2025-10-04):** We removed the `validate-docs` / `lint-and-validate` CI job.  
> Vercel preview builds serve as the primary check for PRs. Please run `npm run lint` locally before opening a PR.

## Environment Variables

This project uses environment variables for auth, database, AI, and debugging. Copy `.env.example` → `.env.local` and fill in your values.

| Name                 | Purpose                                       | Example                         |
|----------------------|-----------------------------------------------|----------------------------------|
| NEXTAUTH_URL         | Public base URL for NextAuth callbacks        | http://localhost:3000           |
| NEXTAUTH_SECRET      | Secret for session signing/encryption         | (generate a long random string) |
| GOOGLE_CLIENT_ID     | Google OAuth credential                       |                                 |
| GOOGLE_CLIENT_SECRET | Google OAuth secret                           |                                 |
| MONGODB_URI          | Database connection string                    | mongodb+srv://...               |
| MONGODB_DB           | Database name used by the app                 | nextjspwa_template              |
| OPENAI_API_KEY       | OpenAI key for LangChain/LangGraph            |                                 |
| DEBUG_PANEL_ENABLED  | Toggle the in-app debug panel ("true"/"false")| false                           |
| NEXT_PUBLIC_DEBUG_PANEL | Client-side toggle for the debug panel        | false                           |

See `/docs/GUIDES/environment-config.md` for local and Vercel setup steps.

**Verification:**  
As of 2025-10-05, all required environment variables are validated in both local and Vercel environments.  
Subsequent epochs may extend this list but must update `.env.example` and `/docs/GUIDES/environment-config.md` accordingly.
## Debug Panel & Logger

The Debug Panel provides a live, in-app log viewer for developers and testers.
It is disabled in production by default and can be toggled with environment variables.

Enabling:
- In .env.local or your Vercel Preview Environment:
  DEBUG_PANEL_ENABLED=true
  or
  NEXT_PUBLIC_DEBUG_PANEL=true

Then run or redeploy the app.
A Debug button appears in the bottom-right corner of the page.

Sending logs:
Use the built-in helper from any client component:

    "use client"
    import { debugLog } from "../lib/debug/log"
    debugLog("UserLoaded", { id: user.id, email: user.email })

Optional metadata:
Pass an optional third argument to include level or channel metadata:

    debugLog("AuthError", { message: err.message }, { level: "error", channel: "auth" })

Options:
- level: log severity ("debug", "info", "warn", "error")
- channel: logical subsystem ("auth", "db", "ai", etc.)

Viewing & filtering:
- Open the Debug Panel with the Debug button.
- Use the search box to find text within any log.
- Use the Level and Channel dropdowns to narrow results.
- Click ▸ Payload or ▸ More to expand details.
- Click the small JSON pill on an entry to toggle raw view.
- Click Clear to remove all entries.

Disabling:
Remove or set both env vars to false before production deployment.

For template maintainers:
The Debug Panel is developer-only instrumentation.
It must never be shipped enabled to production.
## Routes & Pages

The app includes a minimal navigable skeleton ready for further feature development.

### Routes
- `/` — Home page with links and a demo debug button.
- `/login` — Placeholder for the authentication flow (NextAuth to be added later).
- `/dashboard` — Soft "auth guard" note shown until authentication is implemented.
- `/not-found` — Custom 404 page for unmatched routes.

### Navigation
The header navigation is mobile-friendly with large tap targets and active link highlighting.
It appears across all pages.

### Install hint
On small screens, a temporary dismissible banner appears once per session:
“Tip: You’ll be able to install this app once PWA support is added.”
This will be replaced by a real install prompt in the PWA epoch.

### Debug Panel
The debug panel continues to function across all pages when enabled via:
- `DEBUG_PANEL_ENABLED=true`, or
- `NEXT_PUBLIC_DEBUG_PANEL=true`.

### Next steps
Future epochs will add:
- Authentication (NextAuth)
- Database integration
- Toast notifications and form helpers
- PWA install experience
- AI integration

---
_Status: Epoch 0005 completed. The app is now navigable, responsive, and verified._
## UI Primitives

A small, accessible component set using Tailwind, Radix UI, and class-variance-authority.

### Components
- Button — variants: default, outline, subtle, ghost; sizes: sm, md, lg
- Input — label, hint, error, start/end adornments
- Card — header, content, footer regions
- Modal — Radix Dialog wrapper with focus trap and ESC support

### Import
    import { Button, Input, Card, CardHeader, CardTitle, CardContent, CardFooter, Modal } from "@/components/ui"

### Examples
    <Button>Primary</Button>
    <Button variant="outline" size="lg">Outline</Button>

    <Input label="Email" type="email" placeholder="you@example.com" />
    <Card>
      <CardHeader><CardTitle>Title</CardTitle></CardHeader>
      <CardContent>Body</CardContent>
      <CardFooter>Actions</CardFooter>
    </Card>

    <Modal trigger={<Button variant="subtle">Open</Button>} title="Example">
      Content…
    </Modal>

### Notes
- Components are dark-mode aware (Tailwind class strategy).
- See /ui-demo for interactive examples.
- Buttons support `asChild` via Radix Slot (wrap links or custom elements).

---
_Status: Epoch 0006 completed. UI foundation is ready for downstream features (PWA, Auth, Toasts, Forms, AI)._
## PWA Install

The app supports installation and offline use.

### How it works
- **Manifest & Icons** are provided at `app/manifest.webmanifest` and `/public/icons/*`.
- A **Service Worker** is generated by `next-pwa` in production builds (Preview/Prod).
- An **Install App** button appears in the header when install is possible, or on iOS (with manual steps).

### Android / Desktop
- When the browser fires `beforeinstallprompt`, click **Install App** → **Install**.

### iOS (Safari)
- Tap the **Share** icon → **Add to Home Screen** → **Add**.

### Offline
- Common assets and pages are cached; an offline fallback is served at `/offline`.

For advanced caching or custom branding, replace SVG icons with PNGs and adjust `next.config.mjs` runtime caching.

## Forms & Validation

This template ships a small forms stack using **react-hook-form** and **zod**, integrated with our UI primitives.

### Components & Helpers
- `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormDescription`, `FormMessage` (under `components/form/`)
- Validation schemas under `lib/validation/` (example: `demoLoginSchema`)

### Usage (example)
    import { z } from "zod"
    import { zodResolver } from "@hookform/resolvers/zod"
    import { useForm } from "react-hook-form"
    import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/form"
    import { Input, Button } from "@/components/ui"

    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(8)
    })
    type Values = z.infer<typeof schema>

    const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } })

    <Form form={form}>
      <FormField
        name="email"
        control={form.control}
        render={({ id, value, onChange, onBlur, name, ref }) => (
          <FormItem>
            <FormLabel htmlFor={id}>Email</FormLabel>
            <FormControl>
              <Input id={id} name={name} ref={ref as any} value={value} onChange={onChange} onBlur={onBlur} />
            </FormControl>
            <FormMessage>{form.formState.errors.email?.message}</FormMessage>
          </FormItem>
        )}
      />
    </Form>

### Demo
- Visit `/forms-demo` to test validation, error messages, and submit toasts.

---
_Status: Epoch 0009 completed. Forms stack is ready for Auth and DB flows._

## Authentication

Integrated with **NextAuth.js** using the **Google** provider.

**Environment Variables**
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` (base site URL, e.g. `https://yourapp.vercel.app`)

**Usage**
- `/login` — “Sign in with Google” page.
- Header automatically shows **Sign in** or **avatar + Sign out**.
- `/dashboard` — protected route, redirects to `/login` when unauthenticated.
- Helpers:
  - `getSession()` / `requireAuth()` in `lib/auth/server`.
  - `useSession()` in client components.

---
_Status: Epoch 0011 completed. Authentication layer verified end-to-end._

## Database (MongoDB)

- Helper: `lib/db/mongo.ts` provides a cached `MongoClient` and `db()` accessor.
- Health check: `/api/db/health` → `{ ok: true, db: "<name>" }`.
- Example API: `/api/profiles` (GET public, POST requires sign-in).
- Env vars: `MONGODB_URI`, `MONGODB_DB`.

**Profiles DTOs**
- Input: `ProfileInputSchema` — `{ displayName: string; bio?: string }`
- Stored: `ProfileSchema` — extends input with `_id`, `userId`, `createdAt`, `updatedAt`.
## Database Tests

- **Unit (Jest):** `__tests__/db.mongo.test.ts` mocks the MongoDB driver to verify env guards and connection/db caching.
- **E2E (Playwright):**
  - `e2e/db.spec.ts` checks `/api/db/health` returns `{ ok: true }`.
  - Confirms `POST /api/profiles` rejects unauthenticated requests with **401**.

Useful scripts:
- `npm run test` — run unit tests
- `npm run e2e` — build, serve, and run Playwright tests
- `npm run e2e:report` — open the HTML report

## Status: Database (MongoDB) Complete

The template now includes a production-safe MongoDB integration:
- Cached `MongoClient` + `db()` helper (`lib/db/mongo.ts`)
- Health endpoint: `/api/db/health`
- Demo CRUD: `/api/profiles` (Zod-validated input; GET public, POST requires Google sign-in)
- Tests: Jest unit (helper) and Playwright E2E (health + 401 for unauth POST)

Configure `MONGODB_URI` and `MONGODB_DB` in your environment, then visit `/api/db/health` to verify.

## AI Integration (LangChain + OpenAI)

This template includes a minimal, production-safe AI foundation:

- Library: **LangChain** with **@langchain/openai**
- Default model: `gpt-4o-mini`
- Endpoints: `/api/ai/ping` (basic), `/api/ai/stream` (streaming), `/api/ai/tools` (function calling), `/api/ai/graph` (enable with `AI_GRAPH_ENABLE="true"`)
- UI demo: `/ui-demo` → “AI (OpenAI)” card
- Observability: emits `AI.Demo.Request` and `AI.Demo.Success/Error` events visible in Debug Panel

**Environment variables:** see `/docs/ENV/ai.md` for configuration and troubleshooting.

---
_Status: Epoch 0013 complete — AI endpoints and UI verified._

## Status: Epoch 0013 — AI Integration (Complete)

The template now ships with production-ready AI capabilities:
- Endpoints: `/api/ai/ping` (basic), `/api/ai/stream` (streaming), `/api/ai/tools` (function-calling), and `/api/ai/graph` (enable with `AI_GRAPH_ENABLE="true"`).
- UI: `/ui-demo` includes cards for exercising each endpoint on-device.
- Optional: LangSmith tracing (`LANGCHAIN_TRACING_V2`, `LANGSMITH_API_KEY`, `LANGCHAIN_PROJECT`).

See `/docs/ENV/ai.md` for environment setup.
