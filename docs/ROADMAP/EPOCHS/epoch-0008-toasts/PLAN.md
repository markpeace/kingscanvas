# PLAN — Epoch 0008: Toast Notifications

## Context
We want a global, accessible toast system for lightweight feedback (success, error, info) that works on mobile/desktop and respects dark mode. To stay consistent with our stack, we’ll use Radix UI’s Toast primitives + Tailwind, wrapped in a simple helper API.

## Objectives
- Add a global ToastProvider mounted in the App layout.
- Provide a minimal helper API: `toast.success`, `toast.error`, `toast.info`.
- Ensure accessibility (announcements, focus handling) and dark-mode styles.
- Add a demo section to `/ui-demo` to exercise toasts.
- Document usage in README.

## Deliverables
- `components/toast/ToastProvider.tsx` — wraps Radix Toast + viewport.
- `components/toast/useToast.ts` — hook returning `toast` API.
- `lib/toast/index.ts` — re-exported helper for convenience.
- Layout integration to render the provider globally.
- Demo buttons in `/ui-demo`.
- README section and ROADMAP updates.

## Proposed PR sequence within this epoch
1) **PR 1 — Plan & Status (this PR):** add PLAN.md and STATUS.yaml only.
2) **PR 2 — Toast Provider & Hook:** create provider, hook, and helper API; mount in layout.
3) **PR 3 — UI-Demo Integration:** add demo triggers to `/ui-demo` and verify dark-mode/mobile.
4) **PR 4 — Verify & Close:** README usage docs; mark epoch done; update ROADMAP.

## Acceptance Criteria (Definition of Done)
- Toasts can be triggered anywhere in client components via a simple API.
- Success/Error/Info variants styled and accessible; auto-dismiss + close button.
- Works on mobile; no layout shift; respects dark mode.
- Demo in `/ui-demo` verified on Vercel Preview.
- README updated; epoch marked `done`.

## Out of Scope
- Queuing policies beyond Radix default.
- Persisted toasts (e.g., across navigation) — not needed for template.

## Links
- Roadmap: /docs/ROADMAP/ROADMAP.md
- Radix Toast: https://www.radix-ui.com/primitives/docs/components/toast
- UI primitives (for styling): /docs/ROADMAP/EPOCHS/epoch-0006-ui-primitives/
