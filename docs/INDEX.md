# Documentation Index

This is the map of all repository documentation. Start from AGENTS.md at the root, then follow this index.

## Start Here
- AGENTS.md (root) — Entry guide for the back-end AI.
- /docs/REHYDRATE.md — Rehydrate context for a fresh session.
- /docs/STATE/CURRENT.yaml — Current epoch/prompt, PRs, and next actions.

## Contracts & Protocols
- /docs/CONTRACT.md — Front-end ↔ Back-end responsibilities, lifecycle, definition of done.
- /docs/PROTOCOL.md — Prompt/response file conventions, IDs, metadata, schemas.
- /docs/WORKING_PRACTICES.md — Execution loop for prompts and updates.

## Planning & History
- /docs/ROADMAP/ROADMAP.md — Upcoming and in-progress epochs/milestones.
- /docs/ROADMAP/EPOCHING.md — Rules for epoch IDs, states, and closure.
- /docs/HISTORY/ — Immutable snapshots when epochs complete.
- /docs/CHANGELOG.md — Human summaries across releases/epochs (to be added when first epoch completes).

## State & Logs
- /docs/STATE/ — CURRENT.yaml (truth source), INDEX.json (cross-refs), HEALTHCHECK.md (repair).
- /docs/LOGS/ — FRONTEND/, PROMPTS/, PRS/, COMMITS/, EXECUTIONS/ (linked logs across both AIs).

## Specs & Glossary
- /docs/SPEC/PRODUCT_SPEC.md — Product vision and requirements.
- /docs/SPEC/ARCHITECTURE.md — Components and data flows.
- /docs/SPEC/GLOSSARY.md — Canonical terminology.

## Schemas & Templates
- /docs/SCHEMA/ — JSON schemas for structured files (decision, epoch, manifest, PR log, prompt, response).
- /docs/TEMPLATES/ — Boilerplates (front-end log, prompt execution, epoch, ADR, PR log).

## Guides & Libraries
- /docs/GUIDES/ — Recording progress, incidents, playbooks, decision making.
- /docs/PROMPT_LIBRARY/ — Reusable prompt patterns and anti-patterns.

## Quality & Review
- /docs/EVALUATIONS/ — Heuristics and checklists.
- /docs/REVIEW_GUIDELINES.md — Review rubric aligned to checklists.

## Security, Privacy, Risk
- /docs/SECURITY.md and /docs/SECURITY/SECRETS_POLICY.md (policy directory present).
- /docs/PRIVACY_COMPLIANCE.md
- /docs/RISK_REGISTER.md

## Operations & Observability
- /docs/OPERATIONS/RETRY_POLICY.md
- /docs/INTEGRATIONS/openai-codex.md
- /docs/OBSERVABILITY/ — Telemetry and dashboards.

## Access, Audit, Legal
- /docs/ACCESS_CONTROL.md
- /docs/AUDIT.md
- /docs/LEGAL/THIRD_PARTY_LICENSES.md

## Front-end Export
- /docs/FRONTEND_EXPORT/MANIFEST.json — Authoritative list of files to export for front-end context.
- /docs/FRONTEND_EXPORT/INSTRUCTIONS-frontend.md — Front-end navigation guide.
- /docs/FRONTEND_EXPORT/EXCLUDE_PATTERNS.md — Deny-list of exportable content.
- /docs/FRONTEND_EXPORT/README.md — Export notes (directory fully committed).

IDs and timestamps use UTC (YYYY-MM-DDTHHMMSSZ). Human-readable dates default to Europe/London.
