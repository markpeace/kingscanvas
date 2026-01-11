# Healthcheck

Run this checklist if CI or docs seem out of sync.

## Invariants
- `/docs/STATE/CURRENT.yaml` matches an existing epoch folder.
- All prompts referenced by STATE exist in `/docs/LOGS/PROMPTS/`.
- Closed epochs have a snapshot in `/docs/HISTORY/`.

## Repair
1. Manually verify `/docs/STATE/INDEX.json` against the roadmap and prompt logs.
2. Fix any broken links or missing files you discover.
3. Re-run CI locally, then push updates.

Timestamp (UTC): 2025-10-02T12:00:00Z

## Drift log
- 2026-01-11T17:16:03Z: `/docs/STATE/INDEX.json` does not list `epoch-0011-tutorial-guidance` or the recent prompt IDs tied to the tutorial guidance work. Update the index to restore parity with CURRENT.yaml and prompt logs.
