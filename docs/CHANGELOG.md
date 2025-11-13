# Changelog

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
