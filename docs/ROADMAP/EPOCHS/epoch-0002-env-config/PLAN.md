# PLAN — Epoch 0002: Environment Variables & Configuration

## Context
To keep all future work predictable, we define a single, authoritative set of environment variables early. This epoch creates `.env.example`, documents each variable, and aligns local/Vercel configuration.

## Objectives
- Provide a canonical `.env.example` at the repo root.
- Document each variable clearly (purpose, example).
- Add a contributor guide for local/Vercel environment management.

## Deliverables
- This plan file and a `STATUS.yaml` tracker.
- `.env.example` with all required variables.
- `README.md` section: “Environment Variables”.
- `/docs/GUIDES/environment-config.md` (step-by-step guide).

## Steps
1. Add `.env.example` listing all variables with blank/example values.
2. Update `README.md` with a table describing each variable and where it’s used.
3. Add `/docs/GUIDES/environment-config.md` with local + Vercel setup instructions.
4. Open a PR and verify the preview deploy still builds.

## Acceptance Criteria (Definition of Done)
- `.env.example` is present and complete.
- README contains a clear “Environment Variables” section.
- The guide exists and explains local + Vercel configuration.
- The branch builds in Vercel Preview without adding feature code.

## Out of Scope
- Implementing features that consume these variables (handled in later epochs).
- Secrets checked into the repo (never commit real values).

## Links
- Roadmap: `/docs/ROADMAP/ROADMAP.md`
- Guide: `/docs/GUIDES/environment-config.md`
