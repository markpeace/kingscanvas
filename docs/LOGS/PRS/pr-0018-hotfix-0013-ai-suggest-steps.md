# PR Log — Hotfix 0013 AI Suggest Steps

id: pr-0018
number: 18
title: Hotfix AI suggest steps failure handling
status: open
branch: hotfix/ai-suggest-steps-broken-13-11-2025
related_prompts: []
epoch: null
notes: |
  Urgent hotfix after reproduction showed `/api/ai/suggest-steps` failing with
  `OPENAI_API_KEY is not set`, causing Canvas requests to spin forever.
  Adds defensive API handling, Canvas user feedback, trimmed prompt history,
  and Jest coverage so configuration regressions surface quickly.
