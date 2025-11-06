# PR Log — Hotfix 0004 UI Demo Forms Prerender

id: pr-0017
number: 17
title: Fix forms demo prerender context usage
status: open
branch: work
related_prompts:
  - prompt-0068
epoch: null
notes: |
  Restores static generation for /ui-demo/forms by moving useZodErrorFor
  lookups into a provider-aware child component while preserving the
  existing UI behaviour. Includes prompt logging and state timestamp
  refresh.
