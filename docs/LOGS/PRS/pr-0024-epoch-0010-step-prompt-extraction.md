# PR Log — PR 3: Extract and rewrite step-generation prompt into /lib/prompts/steps.ts

id: pr-0024
number: 24
title: "PR 3: Extract and rewrite step-generation prompt into /lib/prompts/steps.ts"
status: open
branch: work
related_prompts:
  - prompt-0122
epoch: 0010-prompt-refinement
notes: |
  Extracts the step-generation prompt into a dedicated builder under
  lib/prompts/steps.ts and wires the workflow to use it with debug preview
  tracing. Maintains existing model handling.
