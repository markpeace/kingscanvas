# PR Log — PR 2: Enforce LLM env var and remove default model usage

id: pr-0023
number: 23
title: "PR 2: Enforce LLM env var and remove default model usage"
status: open
branch: work
related_prompts:
  - prompt-0121
epoch: 0010-prompt-refinement
notes: |
  Enforces the LLM environment variable for all OpenAI calls, removes default
  model fallbacks, and surfaces suggest-steps errors directly in API responses
  and debug output. Updates suggest-steps tests for the new error handling and
  model reporting behaviour.
