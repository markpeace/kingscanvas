# Rehydration Guide

Use this guide when starting a **fresh session** to restore context.

## Steps
1. Open `/AGENTS.md` (root).
2. Load `/docs/STATE/CURRENT.yaml`.
3. Identify active epoch and prompt.
4. Read `/docs/ROADMAP/EPOCHS/<current>/PLAN.md` and `STATUS.yaml`.
5. Read recent `/docs/LOGS/PROMPTS/` and, if present, `/docs/LOGS/PRS/`.
6. Cross-check with `/docs/STATE/INDEX.json`.
7. If something looks off, note it in `/docs/STATE/HEALTHCHECK.md` and investigate before continuing.

## Drift Handling
- If STATE and ROADMAP differ, STATE wins.
- If logs are missing, mark drift in HEALTHCHECK.md and escalate.

## Front-end Export
- For the front-end AI, use `/docs/FRONTEND_EXPORT/MANIFEST.json` as the authoritative list of files to read.

---
_Last updated: 2025-10-02_
