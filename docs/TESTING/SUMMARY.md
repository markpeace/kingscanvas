# Testing & Observability Summary (Epoch 0017)

## Overview
This epoch established a full testing baseline with Jest, React Testing Library, and MSW,
ensuring new apps cloned from this template have reliable unit and integration tests
with CI-ready coverage.

## Stack
- Jest (via next/jest) using jsdom
- RTL + @testing-library/jest-dom for DOM assertions
- MSW (Mock Service Worker, Node mode) for deterministic API mocks
- whatwg-fetch polyfill for jsdom

## Key Coverage
| Category | Example | File |
|-----------|----------|------|
| UI | Button variants render, disabled state | `test/ui/button.test.tsx` |
| Forms | useZodErrorFor validation + reset | `test/forms/useZodErrorFor.test.tsx` |
| API | /api/ai/ping route handler | `test/api/ai.ping.test.ts` |
| Debug | Event sink subscribe / emit cycle | `test/debug/sink.test.ts` |

## Commands
- `npm run test` → run suites once  
- `npm run test:watch` → watch mode  
- `npm run test:ci` → serial execution + coverage  

## Output
- `coverage/lcov-report/index.html` → open HTML coverage
- `jest.config.js` → commonjs config, no ts-node needed
- `docs/TESTING/README.md` → usage + CI guidance

## Outcome
- ✅ 4 green test suites
- ✅ Clean CI run with coverage
- ✅ Epoch 0017 marked complete in roadmap
