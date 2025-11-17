# Changelog

### 2025-11-15 – Epoch 0008 "Opportunity AI Simulation" completed
- Added the simulated opportunities generator plus eligibility rules for manual steps and accepted AI suggestions only.
- Implemented shuffle-capable opportunities APIs so the badge/modal always load fresh content on demand.
- Updated the ear badge and Opportunities modal to show counts, Edge vs independent groupings, shuffle, close, and scroll-safe layouts.
- Landed structured logging plus unit/integration tests for the generator, eligibility checks, and API flows.

### 2025-11-14 – Epoch 0007 "Opportunities Model and UI" completed
- Introduced Opportunity model linked to steps with metadata for source, form, focus, and status.
- Persisted opportunities and exposed `GET /api/steps/[stepId]/opportunities` for read-only access.
- Added opportunity badges and modal UI (loading, empty, populated) for real steps while ghost AI suggestions remain unchanged.

### 2025-11-13 – Epoch 0006 "Roadmap and UX Refresh" completed
- Synced `/docs/STATE/CURRENT.yaml`, roadmap artefacts, and STATUS records to archive Epoch 0006 and queue Epoch 0007.
- Polished Canvas layout hierarchy, modal treatments, and saving indicator feedback informed by Epoch 0005 observations.
- Refined drag-and-drop affordances and documentation to reflect the refreshed UX flow.

### 2025-11-13 – Hotfix: AI suggestion reliability and feedback
- Guard `/api/ai/suggest-steps` against missing OpenAI credentials and return clearer errors when generation fails.
- Trim large histories before building prompts and log the configured model for debugging.
- Surface Canvas toasts when on-demand suggestions fail so users can fall back to manual entry.

### [Epoch 0002 Completed] — Intentions, Steps & Swim Lanes (2025-11-09)
- Finalised Canvas UI with stable drag-and-drop for Intentions and Steps.
- Added accessibility, visual polish, and performance improvements.
- Epoch verified visually; no binary screenshot committed.

### [Epoch 0003 Completed] — Authentication & Session Handling (2025-11-10)
- Implemented NextAuth Google OAuth and protected Canvas routes.  
- Added user menu and sign-out UI.  
- Introduced UserProvider context for global session state.  
- Integrated API middleware and preview/local auth bypass.  
- Epoch archived and ready for Epoch 0004 (Persistence & Autosave).
