# PLAN — Epoch 0006: UI Primitives

## Context
We want a small, consistent set of accessible UI building blocks to accelerate future work (PWA install UX, auth screens, forms, toasts). This epoch establishes reusable components and a demo page so the design system can be previewed on-device.

## Objectives
- Establish a /components/ui/ library with accessible, theme-aware primitives.
- Base styling on Tailwind; use Radix UI where helpful for behavior (e.g., Dialog).
- Ensure dark-mode compatibility and mobile-friendly tap targets.
- Provide a /ui-demo route to preview components.

## Deliverables
- Button (variants: default, outline, subtle; sizes: sm, md, lg)
- Input (text, password; with label + error helper)
- Card (header, body, footer regions)
- Modal/Dialog (Radix-based) with focus-trap and ESC support
- Tokens/utilities: focus ring, disabled state, spacing rhythm
- /ui-demo page showcasing all primitives (added in a later PR of this epoch)

## Proposed PR sequence within this epoch
1) PR 1 — Plan & Status (this PR): add PLAN.md and STATUS.yaml only.
2) PR 2 — Primitives Scaffold: create /components/ui/{button,input,card,modal}.tsx and shared utils.
3) PR 3 — Demo Route: add /ui-demo with examples, mobile polish.
4) PR 4 — Verify & Close: README usage notes, ROADMAP status, mark epoch done.

## Acceptance Criteria (Definition of Done)
- Components live under /components/ui/ with TypeScript props and stories/examples on /ui-demo.
- Primitives pass basic accessibility checks (focus order, labels, roles).
- Light/dark theme styles render clearly on mobile and desktop.
- Preview build on Vercel verified on a phone.
- Docs updated and epoch marked done.

## Out of Scope
- Form schema validation (arrives in Forms/State epochs).
- Toast system (separate Toast epoch).
- Final branding or design tokens (can evolve later).

## Links
- Roadmap: /docs/ROADMAP/ROADMAP.md
- Previous epoch (pages & routes): /docs/ROADMAP/EPOCHS/epoch-0005-pages-routes/
- Upcoming epoch (PWA): /docs/ROADMAP/EPOCHS/epoch-0007-pwa/ (to be created)
