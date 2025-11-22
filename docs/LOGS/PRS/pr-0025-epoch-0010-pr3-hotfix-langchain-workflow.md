# PR Log — PR 3 Hotfix: Replace LangChain pathway and enforce PR-3 prompt + PR-2 model in workflow.ts

id: pr-0025
number: 25
title: "PR 3 Hotfix: Replace LangChain pathway and enforce PR-3 prompt + PR-2 model in workflow.ts"
status: open
branch: work
related_prompts: []
epoch: 0010-prompt-refinement
notes: |
  Replaces the LangChain ChatOpenAI invocation in the step-generation workflow
  with the core OpenAI client to enforce the PR-2 model setting and prevent
  prompt overrides. Simplifies response parsing to use the `output_text`
  response field, updates debug labelling, and returns model provenance in the
  suggestions payload.
