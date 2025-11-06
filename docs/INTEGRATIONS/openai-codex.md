# OpenAI (Codex via GPT) — Integration Notes

## Model Priority
1. GPT-5-Codex (coding specialization)
2. GPT-5 (general fallback)
3. o3 (reasoning fallback for complex plans)

## Usage
- Use Responses API with tool/function calling when available.
- Structured outputs should validate against `/docs/SCHEMA/response.schema.json`.

## Rate Limits & Backoff
- Respect `/docs/OPERATIONS/RETRY_POLICY.md` (jitter, max attempts).

## Safety
- Do not log raw prompts that include secrets; redact per `/docs/SECURITY/SECRETS_POLICY.md`.

## Change Control
- Any update to model usage should be captured in an ADR.
