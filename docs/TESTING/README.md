# Testing & Observability — Scaffold

This template uses:
- **Jest** via `next/jest` (SWC)
- **React Testing Library** + `@testing-library/jest-dom`
- **MSW (Mock Service Worker)** in Node mode for API mocking
- `whatwg-fetch` to polyfill `fetch` in JSDOM

## Commands
- `npm run test` — run tests once
- `npm run test:watch` — watch mode
- `npm run test:ci` — CI-friendly, serial + coverage
- `npm run coverage` — open HTML report (locally)

## Anatomy
- `jest.config.ts` — Next.js preset, setup file, coverage includes
- `test/setup.ts` — RTL + jest-dom + fetch polyfill + MSW lifecycle
- `test/testServer.ts` — `setupServer()` instance; import `{ server, http, HttpResponse }` in tests

### Config note
The Jest config uses **CommonJS** (`jest.config.js`) to avoid requiring `ts-node` in CI or constrained environments.
If you prefer a TypeScript config, add `ts-node` as a devDependency and switch back to `jest.config.ts`.

## Mocking APIs in a test
    import { server, http, HttpResponse } from "@/test/testServer"

    beforeAll(() => {
      server.use(
        http.get("/api/example", () => HttpResponse.json({ ok: true }))
      )
    })

Keep tests deterministic: avoid real network calls.
## Quick check
After this PR:
- `npm run test` should run 2 test files and pass.
- `npm run test:watch` will re-run on changes.
- `npm run test:ci` will produce coverage under `coverage/`.
## Coverage
- Run `npm run test:ci` to generate coverage output under `coverage/`.
- Open `coverage/lcov-report/index.html` locally (or use `npm run coverage`).
- The default config collects from `components/**`, `lib/**`, and `app/**` (excluding route files for now).
- To include additional paths, edit `collectCoverageFrom` in `jest.config.js`.
