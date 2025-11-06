# Secrets & Redaction Policy

## Never Commit
- API keys, tokens, credentials, private keys.
- Raw PII (emails, phone numbers, addresses, IDs).

## Redaction
- Replace sensitive values with [REDACTED].
- Summarize payloads without exposing secrets.

## Logging
- Prompt and PR logs must not include secrets or PII.
- If accidental exposure occurs:
  - Rotate secret
  - Remove from history via PR
  - Document incident in RISK_REGISTER.md

## Storage
- Use environment variables locally (.env not committed).
- Use GitHub Actions secrets for CI.
