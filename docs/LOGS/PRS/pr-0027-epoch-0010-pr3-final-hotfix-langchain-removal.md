# PR Log — PR 3 Final Hotfix: Remove LangChain, enforce PR-2 model, and route step-generation through PR-3 prompt

id: pr-0027
number:
title: "PR 3 Final Hotfix: Remove LangChain, enforce PR-2 model, and route step-generation through PR-3 prompt"
status: open
branch: work
related_prompts:
  - prompt-0125
epoch: 0010-prompt-refinement
notes: |
  Removes remaining LangChain usage from the step-generation workflow, routes
  prompting through the PR-3 step prompt, enforces the PR-2 OpenAI client, and
  preserves model provenance in the returned suggestions.
