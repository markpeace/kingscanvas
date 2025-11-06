# Telemetry

## What To Log (No Secrets)
- Prompt IDs, epoch IDs, PR numbers.
- Start/end timestamps (UTC).
- Validation results (pass, warn, fail).

## Retention
- Keep machine logs small and redacted in /docs/LOGS/EXECUTIONS/.
- Summarize in human-readable logs when necessary.

## Privacy
- Never include raw PII or secrets.
