# Contributing

This template is maintained by a single owner. Use the same flow for both human and AI contributions.

## Flow
1. Branch from `main` with a short, descriptive name.
2. Make small, atomic changes with clear intent.
3. Run local checks (once scripts exist): `./scripts/validate_docs.sh`.
4. Open a Pull Request (PR) to `main`. CI advisory gates must pass.
5. Merge via PR (even for the owner) to preserve audit trail.

## Commit Style
Use Conventional Commits:

```
type(scope): message
```

Examples:
- `docs(roadmap): seed epoch-0001 plan`
- `chore(ci): add validate-docs workflow`

## Protected Paths
- Changes under `docs/**` and `docs/STATE/**` must go through a PR.

## Time & Timestamps
- File IDs/timestamps use **UTC** (`YYYY-MM-DDTHHMMSSZ`).
- Human summaries should render dates in **Europe/London**.

## No Secrets
Do not commit secrets or raw PII. Redact per `/docs/SECURITY/SECRETS_POLICY.md`.
