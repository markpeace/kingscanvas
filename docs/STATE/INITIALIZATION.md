# State Initialization Guide

This repository ships with a baseline `docs/STATE/CURRENT.yaml` that represents an empty engagement. Apply this file verbatim when starting a new project so the state tracker begins without inherited data.

## Bootstrapping Steps
1. Confirm `docs/STATE/CURRENT.yaml` matches the baseline:
   ```yaml
   # Baseline empty state for new workstreams.
   epoch_current: null
   prompt_active: null
   prs_open: []
   next_actions: []
   health:
     invariants_ok: null
     last_validated: null
   timezone_display: Europe/London
   ```
2. Record the first prompt execution by following `/docs/REHYDRATE.md`.
3. Update `health.last_validated` once the initial validation completes.

> **Note:** Do not populate `prs_open` or `next_actions` until work has actually started; keeping them empty prevents contradictory boot data.
