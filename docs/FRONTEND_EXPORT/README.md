# Front-end Export

This directory provides **pointers** and guidance for the front-end AI.

## What to Upload (Stable)
- AGENTS.md
- docs/CONTRACT.md
- docs/PROTOCOL.md
- docs/REHYDRATE.md
- docs/INDEX.md (optional)

## What to Fetch Live at Rehydration (Volatile)
- docs/STATE/CURRENT.yaml
- docs/ROADMAP/ROADMAP.md
- docs/ROADMAP/EPOCHS/<current>/PLAN.md
- docs/ROADMAP/EPOCHS/<current>/STATUS.yaml

The MANIFEST.json may list volatile paths for navigation, but the front-end should fetch them fresh each session (and optionally cache briefly with a timestamp + checksum).

Never export secrets, PII, or raw execution logs.
