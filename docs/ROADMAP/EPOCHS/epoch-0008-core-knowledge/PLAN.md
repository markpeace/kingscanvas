# Epoch 0008 — Core Knowledge Schema Plumbing and Storage

## Goal
Bring Core Knowledge into Luminary workspaces as a read-only context model. Expose JSON for developers and a lightweight summary card while keeping graph wiring intact.

## Scope
- Define and load Core Knowledge for each `(userId, luminaryId)` pair.
- Provide developer visibility via JSON and a compact summary card.
- Ensure Debug Panel highlights whether Core Knowledge is present for runs with timestamps and domains.

## Deliverables
- Core Knowledge lookup helpers and API surface.
- Temp Luminary workspace renders Core Knowledge JSON and summary card.
- Debugging includes Core Knowledge presence, created/updated timestamps, and domain overview.

## Non-Goals
- No mutation or reflection of Core Knowledge.
- No schema-breaking changes.

## Success Criteria
- Read-only CK exposed in workspace and Debug Panel.
- No writes occur during runs.
