# Epoch 0005 — AI Recommendations (Intentions → Suggested Steps)

**Branch:** feature/epoch-0005/ai-recommendations  
**Status:** In Progress

## Goals
- When a user creates an intention, trigger a background LangGraph workflow to generate tentative steps distributed across earlier buckets.
- Show immediate ghost cards while generating, then replace with suggestions.
- Allow Accept or Reject of each suggestion. Keep rejected items in DB so we avoid repeating them in later generations.
- Add on-demand "Suggest with AI" to the Add step control per bucket.
- Keep preview working with test user; production uses session user.

## Data Model
- `steps` documents gain a `status`:
  - `suggested` | `accepted` | `rejected`
  - shape: `{ _id, user, intentionId, bucket, text, status, createdAt, updatedAt, source: "ai" | "manual" }`

## Distribution rules
- Intention in `after_grad` → suggest about 3 `do_now`, 2 `do_soon`, 1 `before_grad`.
- Intention in `before_grad` → suggest about 3 `do_now`, 2 `do_soon`.
- Intention in `do_soon` → suggest about 3 `do_now`.
- Intention in `do_now` → suggest 1–2 immediate steps.
- Counts are hints. LangGraph can adapt.

## UX
- Insert ghost cards immediately on intention creation. Show a small spinner and "Generating…" label.
- Suggestions appear with a "Suggested" pill and Accept / Reject controls.
- Add step becomes a split button: Add manually, Suggest with AI.
- Everything emits debug logs on client and API.

## PRs
- 0001 Plan Injection (this)
- 0002 API: AI Suggest Service (LangGraph)
- 0003 DB: Steps status + helpers, indexes
- 0004 Intentions: trigger background generation and ghost cards
- 0005 Accept / Reject suggestion flow
- 0006 On-demand bucket suggestions
- 0007 Prompt builder and hygiene tests
- 0008 UX polish for suggested state
- 0009 Close-out snapshot

## Success Criteria
- Creating an intention shows ghosts, then suggested steps arrive.
- Accept and Reject persist correctly; rejected items influence future suggestions for that intention.
- On-demand suggestions work per bucket.
- Full visibility via debug overlay in preview and prod.
