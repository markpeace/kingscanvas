# Export Deny-list

The following MUST NOT be included in the front-end export:

- Any secrets or credentials
- Raw execution logs containing tokens
- PII-bearing examples or datasets
- /docs/SECURITY/**
- /docs/OBSERVABILITY/**
- /docs/LOGS/EXECUTIONS/**

Review this list regularly. The MANIFEST.json should only list safe, high-level docs.
