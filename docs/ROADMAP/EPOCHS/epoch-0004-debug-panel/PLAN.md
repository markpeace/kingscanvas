# PLAN — Epoch 0004: Debug Panel (Early)

## Context
We want an on-device debugging experience from the start so upcoming features (routes, PWA, auth, DB, AI) can be inspected without external tooling. The panel must be developer-only and controlled via an env toggle.

## Objectives
- Ship a minimal, env-toggled debug panel visible in local/preview builds.
- Provide a simple log/state “sink” API the app can push into.
- Allow open/close via a small on-screen control; render structured data.
- Ensure zero footprint when disabled (no bundle/UI leakage).

## Deliverables
- PLAN and STATUS docs for this epoch.
- Debug Panel component scaffold and sink API (added in later PRs of this epoch).
- README notes on enabling/disabling the panel.

## Proposed PR sequence within this epoch
1) PR 1 — Plan & Status (this PR): add PLAN.md and STATUS.yaml only.
2) PR 2 — Component & sink scaffold: DebugPanel component, sink API, env toggle, conditional render in app layout.
3) PR 3 — Verification & docs: README usage, sample debugLog call, close epoch.

## Acceptance Criteria (Definition of Done for the epoch)
- Setting DEBUG_PANEL_ENABLED=true makes a toggle visible; clicking opens the panel.
- Calling the sink/log API displays items in the panel.
- With DEBUG_PANEL_ENABLED=false (default), no UI is rendered and no client code runs.
- Vercel preview demonstrates both states via environment configs.

## Out of Scope
- Persisting logs across reloads, remote streaming, or auth-gated admin views.
- Production-only behavior (panel is dev/preview only).

## Links
- Roadmap: /docs/ROADMAP/ROADMAP.md
- Env guide: /docs/GUIDES/environment-config.md
