# Retry Policy

## Goals
- Idempotent retries for prompt executions.
- Avoid duplicate logs and PR entries.

## Rules
- Exponential backoff with jitter: base 2s, max 30s, attempts ≤ 5.
- Before retrying, check if a previous attempt created a log or PR:
  - If yes, update that record instead of creating a new one.
- Do not retry on validation errors without changes.

## When To Retry
- Transient failures (network, rate limit, HTTP 5xx).
- Do not retry on 4xx except 429 (rate limit).

## Recording
- Note retries in the prompt log under a “retries” section with timestamps.
