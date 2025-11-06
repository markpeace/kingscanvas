# Contract — Front-end ↔ Back-end

This contract specifies how the **front-end AI** (planner/coach) and the **back-end AI** (implementer) collaborate. Read it end-to-end before issuing or accepting any prompt.

## Mission Alignment
- Deliver roadmap-aligned increments without breaking invariants recorded in `/AGENTS.md` and `/docs/STATE/CURRENT.yaml`.
- Keep the documentation corpus self-healing: every exchange must leave a durable log the other side can audit.
- Surface ambiguity immediately—silence is treated as drift.

## Roles
### Front-end AI (planner)
- Rehydrate context by following `/docs/FRONTEND_EXPORT/INSTRUCTIONS-frontend.md`.
- Gather user intent, compare it to `/docs/ROADMAP/ROADMAP.md`, and ensure the work is in scope for the active epoch.
- Produce a **schema-valid prompt package** (see Protocol) that includes:
  - `intent`, `context`, and enumerated `inputs`.
  - A step-by-step `plan` with explicit owner (`frontend`/`backend`) for each step.
  - Observable `success_criteria` tied to repository artifacts or behaviours.
  - Risk notes and escalation contacts when relevant.
- Create or append a log entry under `/docs/LOGS/FRONTEND/` describing the reasoning that led to the prompt.
- When provided only with repository context (e.g. a deep dive) and no explicit user ask, create a discovery entry in `/docs/LOGS/FRONTEND/`, confirm whether a prompt is required, and document the decision before proceeding.
- Record the decision’s `disposition`, the follow-up owner, and the next check-in time inside that front-end log entry before handing off anything to the back-end.
- Stay available to review clarifying questions and to inspect the back-end PR before closure.

### Back-end AI (implementer)
- Rehydrate using `/docs/REHYDRATE.md` before touching the repository.
- Validate the prompt against `/docs/SCHEMA/prompt.schema.json`; reject or request fixes if any required field is missing or unclear.
- Execute the prompt using the loop in `/docs/WORKING_PRACTICES.md`, keeping changes atomic and traceable.
- Publish prompt and PR logs, update state/roadmap files, and reply with implementation notes plus any follow-up requests.

## Shared Artifacts
| Artifact | Owner | Purpose |
| --- | --- | --- |
| `/docs/STATE/CURRENT.yaml` | Back-end (author), Front-end (consumer) | Single source of truth for active work and next actions. |
| `/docs/LOGS/FRONTEND/` | Front-end | Rationale for prompts, discovery dispositions, and review confirmations. |
| `/docs/LOGS/PROMPTS/` | Back-end | Execution records per prompt. |
| `/docs/LOGS/PRS/` | Back-end | Pull-request metadata trail. |
| `/docs/ROADMAP/**` | Product (shared) | North star, epoch scope, completion criteria. |

## Lifecycle
0. **Discovery (Front-end)**
   - Capture the user request or repository deep dive in a front-end log entry.
   - Decide whether the interaction results in a prompt, a deferred action, or a clarification request; record the disposition.
   - Create the log file (`docs/LOGS/FRONTEND/<timestamp>-prompt-####.md`) as soon as discovery starts, reserve the prompt ID, and keep the same entry updated through preparation, review, and closure.
1. **Preparation (Front-end)**
   - Rehydrate, confirm no conflicting active prompt, draft plan + success criteria.
   - Write/update a front-end log entry and assemble the prompt payload.
2. **Handoff**
   - Deliver the structured prompt. Include any required assets/links in the `inputs` array. Reference the front-end log entry ID.
3. **Acceptance (Back-end)**
   - Validate schema + invariants. If unclear, request amendments; otherwise acknowledge and record the prompt log stub.
4. **Execution (Back-end)**
   - Implement changes on a feature branch, run checks, update documentation/state, and capture prompt + PR logs.
5. **Review (Front-end)**
   - Inspect the PR diff, confirm success criteria, update the matching front-end log with review outcome, and either approve or request changes.
6. **Closure (Back-end)**
   - Merge (or prepare for human merge), ensure state reflects completion, and signal readiness for the next prompt.

## Definition of Ready (for a prompt)
A prompt is executable when:
- All required schema fields are populated with unambiguous text.
- The plan lists discrete steps and owners; back-end steps reference target files or modules.
- Success criteria are testable (e.g. command output, file diffs, behaviour) and tie back to the roadmap objective.
- Risks, dependencies, and follow-ups are recorded or explicitly declared “none”.
- `links.frontend_log` points at a discovery/prep entry whose `disposition` is `issued` and whose validation checklist is complete.
- The front-end log states the next follow-up action if the prompt fails, so the back-end knows who will triage regressions.

## Definition of Done (for execution)
- Prompt + PR logs written with deterministic IDs.
- `/docs/STATE/CURRENT.yaml` updated with new next actions and PR status.
- `prompt_active` in `/docs/STATE/CURRENT.yaml` reset to `null` (or the next active prompt if chained work is agreed).
- Roadmap epoch status reflects progress or completion.
- Tests/checks required by the prompt and working practices are run and documented.
- Front-end log updated to confirm review outcome.
- No secrets, PII, or undocumented side effects introduced.

## Discovery Dispositions
Every discovery entry in `/docs/LOGS/FRONTEND/` must close the loop using one of the following outcomes:

| Disposition | Description | Required follow-up |
| --- | --- | --- |
| `issued` | Prompt validated and delivered to the back-end. | Reference prompt ID, record `sent_at`, remain on-call for clarifications, and log review outcome. Set `next_check_in: null` unless a review deadline is agreed. |
| `deferred` | Work acknowledged but deliberately postponed. | Record blocking factor, assign a follow-up owner, and capture `next_check_in` so the pause can be audited. |
| `needs-clarification` | Repository/user context insufficient to write a prompt. | Capture questions, tag the responder, and log when you expect to revisit once answers arrive. |

Discovery entries without this metadata are considered incomplete and should be fixed before the back-end accepts new work from the front-end.

## Escalation & Drift Handling
- If either side detects conflicting state or missing logs, they must run the healthcheck in `/docs/STATE/HEALTHCHECK.md` and document the findings in the relevant log directory.
- Unresolved ambiguity after one back-and-forth escalates to the human owner.
- Front-end may pause new prompts while a remediation task is active; the pause must be logged in `/docs/LOGS/FRONTEND/` and reflected in `next_actions` within `CURRENT.yaml`.

_Last updated: 2025-10-17_
