# PR Log — Epoch 0010 Real Workflow LLM Observability

id: pr-0024
number: 24
title: "PR 1b Hotfix: Instrument real AI workflow (runtime/ai/suggest-next-step.ts) for LLM observability"
status: open
branch: work
related_prompts:
  - prompt-0121
epoch: 0010-prompt-refinement
notes: |
  Adds explicit LLM enforcement and debug instrumentation to the real
  step-generation workflow, ensuring the active model, prompt, and
  runtime request metadata are visible in the debug panel with no
  fallback model behaviour.
