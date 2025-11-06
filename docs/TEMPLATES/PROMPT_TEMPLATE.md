# Prompt Execution Record (Template)

Front-matter (YAML keys):
id: prompt-####
epoch: epoch-####-<slug>
issued_at: YYYY-MM-DDTHHMMSSZ
accepted_at: YYYY-MM-DDTHHMMSSZ
completed_at: YYYY-MM-DDTHHMMSSZ
by: frontend-ai|human-<name>
executor: backend-ai
intent: <short sentence>
context: <why this work matters>
inputs: []
plan: []
success_criteria: []
risks: []
follow_ups: []
validation_checks: []
branch: <feature-branch-name>
pr_id: pr-####
links:
  frontend_log: docs/LOGS/FRONTEND/<timestamp>-prompt-####.md
  pr: docs/LOGS/PRS/<timestamp>-pr-####.md
  commits: []
side_effects: []

After the front-matter, include:
- Context summary and key decisions.
- Changes made (files, commands, migrations).
- Validation results (lint/schema/consistency) with command outputs or references.
- Follow-ups and next actions agreed with the front-end.
- State updates performed (e.g. `docs/STATE/CURRENT.yaml` prompt markers) and confirmation that `prompt_active` now reflects the agreed status.
- Review outcome and merge notes.
