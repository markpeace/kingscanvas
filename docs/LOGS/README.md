# Logs

This directory contains machine/human logs produced by both the front-end and back-end AIs.

Subfolders:
- `FRONTEND/` — discovery notes, validation, and review records for every interaction (including deferred prompts) authored by the front-end AI.
- `PROMPTS/` — one file per executed prompt (back-end AI).
- `PRS/` — pull-request metadata logs.
- `COMMITS/` — optional fine-grained breadcrumbs.
- `EXECUTIONS/` — machine-readable run logs and incident reports.

Each prompt ID must appear in both `FRONTEND/` and `PROMPTS/`. Discovery entries that do not result in a prompt must still reference their disposition, `follow_up_owner`, and `next_check_in` (or `null` when a prompt is issued) so the back-end understands why no work was dispatched and when to expect a revisit. Cross-link PR IDs where relevant.

Maintain **one** front-end log file per user request from discovery through review; update metadata in-place instead of creating additional files when the disposition or owner changes.

---
