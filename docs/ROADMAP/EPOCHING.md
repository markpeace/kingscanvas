# Epoching Rules

Rules for how epochs are named, structured, and closed.

## Naming
- `epoch-####-<slug>` where #### is a zero-padded number.
- Slug is a short kebab-case summary (e.g., `bootstrap`).

## Lifecycle
1. **Planned**: listed in ROADMAP.
2. **In Progress**: STATUS.yaml shows phase=in-progress.
3. **Complete**: snapshot in HISTORY, ROADMAP updated.

## STATUS.yaml States
- `planned`
- `in-progress`
- `done`

## Closure
- When `done`, create snapshot under `/docs/HISTORY/`.
- Update `/docs/CHANGELOG.md` with human summary.

---
_Last updated: 2025-10-02_
