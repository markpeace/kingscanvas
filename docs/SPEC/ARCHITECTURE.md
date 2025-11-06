# Architecture Overview

This is a high-level view of the system components.

## Components
- **Docs Layer**: /docs contains all specifications, state, logs, schemas, and templates.
- **AI Execution Layer**: Back-end AI reads docs, executes prompts, writes changes.
- **CI Layer**: GitHub Actions + scripts validate consistency.
- **Front-end Export**: Provides curated subset of docs for front-end AI.

## Data Flows
1. Front-end AI issues prompt → stored in LOGS.
2. Back-end executes prompt → updates STATE + ROADMAP.
3. PR is opened → CI validates.
4. Epoch completes → HISTORY snapshot created.
5. Export refreshed for front-end.

## Deployment
- Repo hosted in private GitHub.
- Scripts run in Linux CI runners.
- No runtime services beyond docs and scripts.

## Diagram (placeholder)
```
[Front-end] -> [Prompts] -> [Back-end Execution] -> [Docs/State/Logs] -> [PR+CI] -> [History/Export]
```

---
_Last updated: 2025-10-02_
