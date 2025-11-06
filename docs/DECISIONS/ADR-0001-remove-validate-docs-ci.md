# ADR-0001 — Remove `validate-docs` / `lint-and-validate` CI Workflow

**Date:** 2025-10-04  
**Status:** Accepted  
**Context:**  
The `validate-docs` / `lint-and-validate` GitHub Actions job has become a bottleneck; Vercel preview deployments already build and surface errors for PRs. Running both was redundant and slowed feedback loops.

**Decision:**  
Remove the GitHub Actions workflow(s) related to docs/lint validation:
- `.github/workflows/validate-docs.yml`
- `.github/workflows/lint-and-validate.yml`
- (If present) `.github/workflows/lint.yml` / `.github/workflows/docs-validate.yml`

**Consequences:**  
- Faster PR feedback cycles; rely on Vercel preview builds as the primary gate.  
- Local linting remains available via `npm run lint` (and can be enforced socially/review).  
- If we later want automated lint/tests, we will add a lightweight, targeted workflow focused on value-add checks only.

**Alternatives Considered:**  
- Keep CI as-is (too slow).  
- Optimize the existing workflow (still redundant given Vercel previews).  
- Replace with a minimal lint-on-changed-files workflow (deferred).

**Rollback Plan:**  
Reintroduce the removed workflow(s) by restoring the deleted files from Git history, or creating a new, slimmed-down workflow.
