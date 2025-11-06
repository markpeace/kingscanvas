# Front-end Instructions (Synthesis)

Follow these steps every time you (the front-end AI) engage with the back-end.

## 1. Rehydrate Context
1. Read `AGENTS.md` (root) to refresh invariants.
2. Follow `/docs/REHYDRATE.md` exactly to load the latest state.
3. Inspect `/docs/STATE/CURRENT.yaml` to confirm:
   - Active epoch.
   - Active prompt (must be `null` before issuing a new one).
   - Open PRs and next actions.
4. Review the active epoch’s `PLAN.md` and `STATUS.yaml` under `/docs/ROADMAP/EPOCHS/<current>/`.
5. Skim the most recent entries in `/docs/LOGS/PROMPTS/`, `/docs/LOGS/PRS/`, and `/docs/LOGS/FRONTEND/` to understand in-flight work.

## 2. Decide Whether to Issue a Prompt
- Confirm the requested work advances the roadmap and fits within the active epoch’s scope.
- Check for blocking incidents or drift in `/docs/STATE/HEALTHCHECK.md`.
- When a user only requests a repository “deep dive” or reflection, log the discovery in `/docs/LOGS/FRONTEND/` first, then determine whether action is required. Document the outcome as `disposition: issued`, `deferred`, or `needs-clarification`.
- If unresolved drift exists, document a pause entry in `/docs/LOGS/FRONTEND/` instead of issuing a new prompt.

## 3. Prepare the Prompt Package
1. Draft reasoning in `/docs/LOGS/FRONTEND/<timestamp>-<prompt-id>.md` (or discovery entry) using the format in `/docs/PROTOCOL.md` or the template at `/docs/TEMPLATES/FRONTEND_LOG_TEMPLATE.md`.
2. Capture:
   - User intent and success criteria agreed with the user.
   - References to roadmap items, specs, or prior prompts.
   - Validation checklist results (roadmap alignment, conflict check, schema validation hash).
   - The chosen `disposition`, `follow_up_owner`, and `next_check_in` so deferred or clarification work is traceable. For `disposition: issued`, keep `follow_up_owner` set (typically `frontend-ai`) and set `next_check_in` to `null` unless you agree on a review deadline.
   - Maintain a single log entry for the interaction: leave `sent_at`, `reviewed_at`, and `schema_checksum` as `null` until those events occur, then update the same file. Never spin up a second log file for the same user request.
3. Build the JSON payload that satisfies `/docs/SCHEMA/prompt.schema.json` (required only when `disposition: issued`).
4. Validate the payload; if validation fails, fix the data first. Never send an invalid prompt.

## 4. Handoff & Support
- Deliver the prompt payload along with links to the front-end log and any assets in `inputs`.
- Stay available to answer clarifying questions while the back-end executes.
- Update your front-end log entry with timestamps for `sent_at`, clarifications, and review notes. Set `disposition: issued` and ensure the `links.frontend_log` in the prompt payload matches the file path.
- If the disposition changes (e.g. the user defers the work), update `follow_up_owner` and `next_check_in` immediately so the back-end can see who will revisit the topic and when.

## 5. Review & Closure
- When the back-end signals completion, review the PR diff and logs.
- Confirm each success criterion; record the outcome in your front-end log entry.
- If the work is satisfactory, note the approval time and next prompt recommendation.
- If changes are needed, document them in the log and send an updated prompt or follow-up request.
- When closing a deferred or clarification entry, update `next_check_in` to reflect the actual completion time so historical audits stay accurate.

## Reference Bundle vs. Live-Fetch
- The permanent reference bundle listed in `MANIFEST.json` is limited to process and contract docs that stay valid across apps.

## Live-Fetch Rule
Treat these files as volatile and fetch them fresh every session:
- /docs/STATE/CURRENT.yaml
- /docs/ROADMAP/ROADMAP.md
- /docs/ROADMAP/EPOCHS/<current>/PLAN.md
- /docs/ROADMAP/EPOCHS/<current>/STATUS.yaml
- /docs/LOGS/PROMPTS/
- /docs/LOGS/PRS/
- /docs/LOGS/FRONTEND/

If you must operate from cache (e.g., offline), emit a warning in your log and refresh at the earliest opportunity.

All timestamps are UTC for machine-readable IDs; human summaries default to Europe/London.
