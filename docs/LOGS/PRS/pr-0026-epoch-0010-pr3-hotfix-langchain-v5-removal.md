# PR Log — PR 3 Hotfix: Replace legacy prompt v5 + LangChain model with PR-3 prompt + PR-2 model enforcement

id: pr-0026
number:
title: "PR 3 Hotfix: Replace legacy prompt v5 + LangChain model with PR-3 prompt + PR-2 model enforcement"
status: open
branch: work
related_prompts:
  - prompt-0123
  - prompt-0124
epoch: 0010-prompt-refinement
notes: |
  Implements the prompt and model enforcement hotfix for the step-generation
  workflow. Replaces the legacy LangChain ChatOpenAI path with the PR-2 OpenAI
  client, uses the PR-3 step prompt, simplifies response parsing, and preserves
  model provenance in the suggestions payload. Follow-up fix ensures the
  enforced model string is passed to the OpenAI client to satisfy type checks.
