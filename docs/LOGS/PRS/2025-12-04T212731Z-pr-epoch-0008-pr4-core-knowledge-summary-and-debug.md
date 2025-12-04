# PR4: Core Knowledge summary card and Debug Panel visibility

## References
- epoch-0008-core-knowledge
- PR4 section of the epoch PLAN

## Summary
- Added `components/luminaries/CoreKnowledgeSummaryCard.tsx` to present a read-only Core Knowledge summary sourced from the CK document for a given Luminary and user.
- Added `app/luminaries/temp/page.tsx` to render the summary card alongside the developer JSON panel.
- Updated graph/logging helpers to attach a Core Knowledge snapshot to Luminary run telemetry.
- Extended the Debug Panel UI to show Core Knowledge presence, timestamps, and domain keys when provided in run payloads.

## Behaviour
- On the Temp Luminary preview, users see a small Core Knowledge summary card that reflects the CK document.
- In the Debug Panel, each Luminary run shows whether CK exists, when it was created and last read or updated, and which domains are present.

## Notes
- Core Knowledge schema, storage, and read-only graph integration are unchanged. Mutation and reflection remain deferred to later epochs.
