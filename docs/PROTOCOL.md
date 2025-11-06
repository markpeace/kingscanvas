# Protocol — Prompt/Response Interface

This protocol defines the data contracts, file formats, and lifecycle steps that bind the front-end and back-end AIs. Follow the baseline expectations for every exchange and opt into the enhanced (“audit”) tier when you need the extra traceability.

## Operational Modes

- **Baseline (default for new template consumers):** Maintain deterministic identifiers, exchange prompt packages that validate against the schema, and capture one prompt log per executed prompt. Use automation (see `scripts/logging/create-prompt-log.mjs`) to avoid manual boilerplate. Updating `/docs/STATE/CURRENT.yaml` is only required when work changes the tracked state (e.g. switching active prompt, closing an epoch).
- **Audit tier (opt-in):** Adds PR log files, execution health-check attachments, roadmap snapshots, and deterministic incident reports. Activate this tier when the repository is in production or when compliance stakeholders require full traceability.

> When unsure, start with the baseline. You can graduate to the audit tier incrementally by enabling one optional artefact at a time.

## ID and Naming Conventions
- Prompts: `prompt-####` paired with timestamp `YYYY-MM-DDTHHMMSSZ`.
- Front-end log files: `docs/LOGS/FRONTEND/<issued_at>-<prompt-id>.md`.
- Prompt logs: `docs/LOGS/PROMPTS/<issued_at>-<prompt-id>.md`.
- PR logs: `docs/LOGS/PRS/<created_at>-pr-####.md`.
- Epochs: `epoch-####-<slug>`.
- All filenames must be deterministic and use UTC timestamps with second resolution.

## Prompt Package (Front-end → Back-end)
Prompts must validate against `/docs/SCHEMA/prompt.schema.json`.

Minimum required links:
- `links.frontend_log` — absolute repository path to the discovery/prep log backing the prompt.
- Optional: `links.assets`, `links.related_prompts`, and `links.roadmap_items` arrays for richer traceability.

Required JSON structure:
```json
{
  "id": "prompt-0001",
  "epoch": "epoch-0003-hardening",
  "issued_at": "2025-10-16T12:30:00Z",
  "by": "frontend-ai",
  "intent": "Document the front/back contract",
  "context": "Why the work matters and prior attempts",
  "inputs": [
    { "type": "link", "value": "docs/STATE/CURRENT.yaml", "notes": "Confirm active epoch" }
  ],
  "plan": [
    { "step": "Audit existing contract", "owner": "frontend" },
    { "step": "Update contract + protocol docs", "owner": "backend" }
  ],
  "success_criteria": [
    "Contract lists lifecycle, ready/done definitions",
    "Protocol describes front-end log naming"
  ],
  "risks": ["Docs and schema must stay in sync"],
  "follow_ups": ["Re-run documentation validator"],
  "links": {
    "frontend_log": "docs/LOGS/FRONTEND/2025-10-16T123000Z-prompt-0001.md",
    "assets": ["https://example.com/design.pdf"],
    "roadmap_items": ["epoch-0003-hardening"],
    "related_prompts": []
  }
}
```

> **Schema lock:** The prompt payload rejects unknown top-level keys or unexpected properties within nested objects. If the workflow requires new fields, update `/docs/SCHEMA/prompt.schema.json` and the related templates before sending prompts that include them.

### Front-end Log Entry
For each prompt or discovery session, the front-end writes a Markdown file under `/docs/LOGS/FRONTEND/` with YAML front-matter:
```yaml
id: prompt-0001
issued_at: 2025-10-16T12:30:00Z
by: frontend-ai
user_intent: "Document the front/back contract"
context_summary: "Previous docs were ambiguous about front-end behaviour."
plan_authored: true
validation:
  roadmap_aligned: true
  conflicts_checked: true
  schema_checksum: "ab12..."
disposition: issued|deferred|needs-clarification
follow_up_owner: frontend-ai
next_check_in: 2025-10-17T09:00:00Z
sent_at: 2025-10-16T12:35:00Z
reviewed_at: null
links:
  roadmap_items:
    - docs/ROADMAP/EPOCHS/epoch-0003-hardening/PLAN.md
  related_prompts: []
```
After the front-matter, include:
- Reasoning trace (how the plan was derived).
- Link to any supporting artefacts or research.
- Checklist confirming that success criteria were agreed with the user.
- Space to record review/approval outcome once the PR is evaluated.
- If no prompt is dispatched (e.g. disposition `deferred`), record why and the next follow-up step so the back-end can audit the decision.
- If `disposition` is `deferred` or `needs-clarification`, set `follow_up_owner` and `next_check_in` so the back-end knows who will close the loop and when.
- When `disposition: issued`, keep `follow_up_owner` populated (usually `frontend-ai`) and set `next_check_in` to `null` unless an explicit review deadline is agreed.

#### Metadata Rules
- **Single entry per interaction:** Create one front-end log file when discovery begins and keep updating it as the disposition changes. Do not create parallel files for the same user request.
- **`sent_at`:** Leave `null` until the prompt is actually dispatched. Update it to the UTC timestamp that the payload is handed to the back-end. Deferred or clarification entries remain `null` until they become `issued`.
- **`reviewed_at`:** Leave `null` until the PR review is completed. Populate it when the front-end finishes reviewing the back-end’s implementation, even if the outcome is “changes requested”.
- **`schema_checksum`:** Record the checksum of the JSON schema validation command once per issued prompt. If the disposition is not `issued`, set this field to `null` so it’s obvious that no payload was sent.
- **`follow_up_owner`:** Always reflect who is responsible for the next action (`frontend-ai`, `backend-ai`, or a tagged human owner). Update it immediately when ownership transfers.
- **`next_check_in`:** Use a concrete UTC timestamp whenever the disposition is `deferred` or `needs-clarification`. For `issued`, keep it `null` unless a specific review deadline is negotiated; in that case set the agreed timestamp and update it when circumstances change.

### Delivery Rules
- Attach or link any assets/tests the back-end must reference.
- If any required field is unknown, replace the prompt with an escalation entry in the front-end log and do not dispatch the prompt.
- Set the front-end log `disposition` to `issued` once the payload is final and reference its path in `links.frontend_log`.
- Update `follow_up_owner` and `next_check_in` whenever the disposition changes so both sides can audit outstanding decisions.

### Disposition Ledger (Front-end ↔ Back-end)
- **issued** — Prompt validated and delivered. Back-end sets `prompt_active` in `CURRENT.yaml` and acknowledges the payload in the prompt log.
- **deferred** — Prompt withheld. No back-end action beyond monitoring is required; the front-end owns the next check-in and must cite it in the log.
- **needs-clarification** — Front-end still researching. The log must list open questions, the responder, and a `next_check_in` timestamp so the back-end knows when to expect closure.

## Back-end Response Package
After executing a prompt the back-end must provide the baseline artefacts and may opt into the audit add-ons:

### Baseline deliverables
- Prompt log (`/docs/LOGS/PROMPTS/…`). Generate a skeleton with `node scripts/logging/create-prompt-log.mjs --id <prompt-id>` and fill in the outcomes before closing the prompt.
- Repository changes, committed and pushed.
- Documentation updates for any state that actually changed (e.g. clearing an active prompt, ticking off roadmap items).

### Audit add-ons (opt-in)
- PR log (`/docs/LOGS/PRS/…`) summarising branch, reviewers, CI, and merge state.
- Health-check/validation outputs referenced from the prompt log.
- Roadmap snapshots, incident logs, and changelog updates when compliance requires them.

## Validation Sequence
1. **Front-end** runs schema validation locally before sending the prompt; record the checksum in the log.
2. **Back-end** validates again on receipt. If validation fails or fields are ambiguous, respond with a rejection note and await a corrected prompt.
3. Post-execution, the back-end runs `/scripts/validate_docs.sh` (or successor) and attaches the command output to the prompt log.

## Traceability Guarantees
- Every prompt ID must be discoverable in both `/docs/LOGS/FRONTEND/` and `/docs/LOGS/PROMPTS/`.
- Front-end discovery entries that end with `disposition: deferred` or `needs-clarification` must cite the follow-up owner and timestamp for the next review.
- PR IDs must map to files under `/docs/LOGS/PRS/` and to Git history; reference them from prompt logs once created.
- State transitions in `CURRENT.yaml` must reference either the prompt ID or PR ID responsible for the change.

## Drift & Incident Handling
- Missing or conflicting log files trigger the healthcheck in `/docs/STATE/HEALTHCHECK.md`.
- Incident write-ups belong in `/docs/LOGS/EXECUTIONS/` with cross-links from both front-end and back-end logs.
- Until drift is resolved, the front-end suspends new prompts and records the pause in its log directory.

_Last updated: 2025-10-17_
