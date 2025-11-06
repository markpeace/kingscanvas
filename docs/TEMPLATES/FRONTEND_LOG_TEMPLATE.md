# Front-end Prompt Log (Template)

Front-matter (YAML keys):
id: prompt-####
issued_at: YYYY-MM-DDTHHMMSSZ
sent_at: YYYY-MM-DDTHHMMSSZ|null # null until the prompt is dispatched
reviewed_at: YYYY-MM-DDTHHMMSSZ|null # null until the review is completed
by: frontend-ai|human-<name>
user_intent: <summary from user>
context_summary: <why now>
plan_authored: true|false
disposition: issued|deferred|needs-clarification
follow_up_owner: frontend-ai|backend-ai|human-<name> # update if ownership changes mid-stream
next_check_in: YYYY-MM-DDTHHMMSSZ|null # null when prompt issued without a timed follow-up
success_criteria:
  - <criterion>
validation:
  roadmap_aligned: true|false
  conflicts_checked: true|false
  schema_checksum: <sha256>|null # null until the JSON payload is validated
links:
  roadmap_items: []
  related_prompts: []
notes:
  risks: []
  follow_ups: []

Body guidance:
- Reasoning trace (steps taken to craft the plan).
- Evidence gathered (quotes, file paths, metrics).
- Summary of discussion with the user.
- Notes captured during back-end execution (clarifications, decisions).
- Review outcome (approved/changes requested), including timestamp and reference to PR ID.
- If `disposition` is not `issued`, explicitly state the rationale, the follow-up owner, and when the next check-in should occur.
- Keep `follow_up_owner` and `next_check_in` accurate whenever the disposition changes so the back-end can audit outstanding work.
