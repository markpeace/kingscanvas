# AGENTS — Back-end AI Entry Guide

> You are the back-end AI operating on this repository. Read this file first, then follow the reading order below.

## Mission
Build and maintain applications from structured prompts while **self-documenting** every action. Keep the roadmap current, record every prompt execution, and produce auditable history.

## Invariants
- **Truth source:** `/docs/STATE/CURRENT.yaml` is the single source of truth for “where we are”.
- **UTC IDs:** All IDs and timestamps in filenames/front-matter use UTC in ISO-8601 format: YYYY-MM-DDTHHMMSSZ (e.g. 2025-10-02T12:00:00Z).
- **Human times:** Summaries in docs default to Europe/London.
- **No secrets in repo:** Never commit credentials, keys, tokens, or raw PII. Redact per `/docs/SECURITY/SECRETS_POLICY.md`.
- **Traceability (baseline):** Capture at least one prompt log per executed prompt. Use `scripts/logging/create-prompt-log.mjs` to scaffold the entry and fill in outcomes once the work is complete. Richer artefacts (PR logs, execution logs, etc.) remain optional but recommended for long-lived projects.

## Boot Order (do this every session)
1. Open `/docs/REHYDRATE.md` and follow the steps.
2. Read `/docs/STATE/CURRENT.yaml` and confirm the active epoch and prompt status.
3. Read the current epoch files:
   - `/docs/ROADMAP/EPOCHS/<current>/PLAN.md`
   - `/docs/ROADMAP/EPOCHS/<current>/STATUS.yaml`
4. If drift is detected, follow `/docs/STATE/HEALTHCHECK.md`.

## Reading Order (start here)
1. `/docs/PROTOCOL.md`
2. `/docs/CONTRACT.md`
3. `/docs/WORKING_PRACTICES.md`
4. `/docs/REHYDRATE.md`
5. `/docs/INDEX.md`
6. `/docs/STATE/CURRENT.yaml`
7. `/docs/ROADMAP/ROADMAP.md`

## Rules of Engagement
- **Before execution:** Validate the incoming prompt against `/docs/SCHEMA/prompt.schema.json` (when available).
- **During execution:** Work on a feature branch. Keep changes minimal and atomic.
- **After execution (baseline obligations):**
  - Generate or update a prompt log via `scripts/logging/create-prompt-log.mjs`.
  - Update `/docs/STATE/CURRENT.yaml` only when the work actually changes state. Routine feature work that does not alter roadmap metadata can skip this step.
  - Summarise the implementation in the PR description.
- **After execution (audit-ready opt-ins):**
  - Maintain `/docs/LOGS/PRS/` entries for each PR when you need reviewer traceability.
  - Capture health-check outputs, incident logs, and roadmap snapshots whenever compliance or regulatory reporting matters to your team.

## Front-end Export
- The authoritative list for front-end context is `/docs/FRONTEND_EXPORT/MANIFEST.json`.
- The guide for the front end is `/docs/FRONTEND_EXPORT/INSTRUCTIONS-frontend.md`.

## Pointers
- Contract: `/docs/CONTRACT.md`
- Protocol: `/docs/PROTOCOL.md`
- Working practices: `/docs/WORKING_PRACTICES.md`
- Rehydration flow: `/docs/REHYDRATE.md`
- State: `/docs/STATE/CURRENT.yaml`
- Roadmap: `/docs/ROADMAP/ROADMAP.md`
- Schemas: `/docs/SCHEMA/`
- Guides: `/docs/GUIDES/`

Last updated: 2025-10-02
