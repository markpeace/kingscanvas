# PLAN — Epoch 0001: Deployment & CI (Vercel First)

## Context
We want automatic Vercel preview deployments from day one so every subsequent epoch/PR is testable on real devices. This epoch is docs/process only — no app code changes.

## Objectives
- Confirm the repository builds cleanly on Vercel.
- Ensure every PR/branch gets an automatic preview URL.
- Document the preview flow for contributors in README and a short guide.

## Deliverables
- This plan file, plus `STATUS.yaml` (state tracking).
- `/docs/GUIDES/vercel-previews.md` with step-by-step instructions.
- README section “Deploying with Vercel (Previews)” that links to the guide.

## Steps
1. Create `/docs/GUIDES/vercel-previews.md` with contributor instructions.
2. Update `README.md`:
   - If `README.md` does not exist, create it.
   - Add a “Deploying with Vercel (Previews)” section and link to the guide.
3. Verify (manually) that connecting the repo on Vercel yields preview URLs for new PRs.
4. Update `STATUS.yaml` as work progresses (backend to record timestamps/PRs).

## Acceptance Criteria (Definition of Done)
- Repo builds on Vercel without additional config.
- A new PR opened from this branch (or a test PR) shows a Vercel preview URL.
- README contains a clear “Deploying with Vercel (Previews)” section.
- This epoch is marked `done` in `STATUS.yaml` when complete.

## Out of Scope
- No environment variable setup (handled in Epoch 0002).
- No application feature code (handled in later epochs).

## Links
- Roadmap: `/docs/ROADMAP/ROADMAP.md`
- Guide: `/docs/GUIDES/vercel-previews.md`
