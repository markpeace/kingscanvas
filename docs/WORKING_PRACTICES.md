# Working Practices — Back-end AI

This document is the **operating manual** for the back-end AI.

## Execution Loop (Baseline)
1. Rehydrate using `/docs/REHYDRATE.md`; confirm `docs/STATE/CURRENT.yaml` has no active prompt conflict.
2. Validate the incoming prompt against `/docs/SCHEMA/prompt.schema.json` and confirm the referenced front-end log exists.
3. Verify the front-end log indicates `disposition: issued`; if not, pause and request clarification.
   - When the disposition is anything else, ensure the log also lists `follow_up_owner` and `next_check_in` so the pause can be audited before proceeding.
4. Update `docs/STATE/CURRENT.yaml` only if the prompt transitions the tracked state (e.g. from idle to active). Skip this step for changes that do not affect roadmap metadata.
5. Create a feature branch named after the prompt ID (e.g. `prompt-0001-improve-contract`).
6. Implement minimal, atomic changes that satisfy each back-end-owned plan step.
7. Run required tests/checks and capture outputs for the prompt log as needed.
8. Commit changes with a descriptive message referencing the prompt ID.
9. Generate a prompt log stub with `node scripts/logging/create-prompt-log.mjs --id <prompt-id>` and update the scaffold with the actual outcomes before closing the prompt.
10. Open or update a PR and provide a descriptive summary. PR log files are optional unless you opt into the audit tier.
11. Notify the front-end with a summary, highlighting any deviations, follow-ups, or risks discovered.

## Audit Tier Add-ons (Opt-in)
- Mirror PR metadata in `/docs/LOGS/PRS/` so reviewers can audit history outside the Git provider.
- Update `/docs/ROADMAP/EPOCHS/<current>/STATUS.yaml` for every change when the roadmap itself drives reporting.
- Attach validation command outputs to the prompt log.
- Record incidents in `/docs/LOGS/EXECUTIONS/` and snapshot epochs into `/docs/HISTORY/` when compliance or governance requires it.

## After Each Prompt (Baseline)
- Run the checks that the success criteria call for and document the outcome in the prompt log.
- If validation fails, pause merging and coordinate remediation before closing the prompt.
- Push the feature branch, open the PR, and request front-end review.
- Update the prompt log when the PR merges, recording `completed_at` and any follow-up tasks. If state files changed, ensure they remain consistent.

## When an Epoch Completes
- Move the epoch summary to `/docs/HISTORY/`.
- Update `/docs/CHANGELOG.md` with the human-readable summary.
- Confirm `docs/STATE/CURRENT.yaml` points to the next planned work or explicitly notes the idle state.

## Don’ts
- Don’t bypass logs or leave `links.frontend_log` unresolved.
- Don’t commit secrets or user data; follow `/docs/SECURITY/SECRETS_POLICY.md` for redactions.
- Don’t modify state files without reflecting the change in roadmap status and logs.

_Last updated: 2025-10-17_
