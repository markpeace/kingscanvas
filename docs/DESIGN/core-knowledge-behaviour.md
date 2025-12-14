# Behavioural Core Knowledge — Design Notes

This note explains how Core Knowledge drives Luminary behaviour, how reflection targets domains, and when to rely on `aiExtendable` guardrails.

## Domain-level behaviour metadata
- Each Core Knowledge domain can define a `behaviour` object with:
  - `priority`: ordering for prompt emphasis and reflection targeting.
  - `maintenance`: whether the domain should be refreshed periodically even without direct user input.
  - `proactiveElicitation`: cues to ask for missing facts (e.g., constraints, timelines, safety notes).
- Prompts use the `behaviour` block to decide which domains to surface first and how assertively to seek missing data.

## Luminary-level `coreKnowledgeBehaviour`
- Luminaries declare `coreKnowledgeBehaviour.primaryDomains` to flag the domains that drive tone and guidance.
- Prompt templates weight these primary domains higher, ensuring their facts shape persona, constraints, and suggested actions.

## Prompt guidance
- System and assistant prompts read `behaviour` metadata to:
  - Set narrative or advisory tone anchored in high-priority domains.
  - Inject proactive elicitation when `proactiveElicitation` is present and the domain has gaps.
  - Keep maintenance domains visible so the Luminary routinely checks them (e.g., morale, safety, constraints).

## Reflection
- Target selection favours domains with higher `priority` or recent changes; maintenance domains are revisited on a cadence.
- Intake mapping routes user-provided facts into structured targets: profiles, goals, context, plans, and logs.
- Reflection writes summaries and structured deltas back into Core Knowledge, preserving nested keys and respecting guardrails.

## Examples
- **Pirate Captain — narrative world state**
  - Primary domains: `crewProfile`, `strategy`, `voyageLog`.
  - Prompting leans on the current crew roster, ship traits, and long-term objectives to drive pirate-tone responses.
  - Reflection updates `strategy` when goals shift and appends incidents to `voyageLog`, keeping `aiExtendable` enabled for nested logs.
- **Personal Trainer — profile and plan**
  - Primary domains: `profile`, `goals`, `context`, `plan`, `progress`.
  - Prompts prioritise constraints (shoulder sensitivity, schedule), goals (V5, squat 225), and the 4-day plan cadence.
  - Reflection maps intake text into structured profile/goals/context fields, seeds an initial plan, and records baseline progress with `aiExtendable` depth for nested plan steps.

## `aiExtendable` notes
- Enable `aiExtendable` when a domain requires nested updates (e.g., logs, plans, progress entries) and you want to permit safe extension.
- Simple domains (flat profile fields) usually set shallow depth (1–2 keys) to prevent uncontrolled expansion.
- Nested domains (plans with day -> exercises) can set deeper depth or explicit keys so reflection can append without rewriting the full object.
