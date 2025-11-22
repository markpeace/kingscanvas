# Epoch 0010 Prompt Refinement and Context Integration

## Objective
Rebuild the AI prompt system so it is fully generative, context-aware, concise, and aligned with the King’s Edge learning architecture. Introduce the LLM environment variable for model selection and ensure all LLM calls are observable in the debug panel with no default model fallback.

## Goals

### Model control
- Introduce a single LLM environment variable to define which model is used.
- Enforce server-side only; client must not read environment variables.
- Throw a visible error if LLM is missing.
- Emit the active model into the debug panel for every LLM call.

### Step generation prompt
Replace the deterministic template with a fully generative prompt that:
- Uses course, year, programme type, and study mode.
- Produces concise steps focused on knowledge, skills, and experience.
- Aligns with the chosen bucket (do now, do later, before graduation, after graduation).
- Adjusts output for 1-year Masters, 3-year UG, doctoral programmes, and distance learners.
- Avoids prescribing detailed activities.

### Opportunity generation prompt
Introduce a new AI prompt that:
- Maps steps to meaningful areas of progress.
- Uses the King’s Edge blueprint architecture and tiers.
- Produces opportunity types, not fully concrete activities.
- Respects constraints such as distance/on-campus engagement.

### Context integration
Add UI selectors and API/runtime pass-through for:
- Course
- Year of study
- Programme type
- Study mode

These must reach the workflow-level prompt builder.

### Debug visibility
Use the application debug panel so every LLM call shows:
- Active model
- Prompt text (trace)
- Errors for missing model
- Runtime request metadata

## Scope
This epoch includes model integration, prompt redesign, contextual input collection, creation of the opportunities prompt, and full LLM observability. It does not include redesign of the deterministic opportunities engine beyond replacing it with AI-driven output.

## Deliverables
1. LLM environment variable support.
2. Debug panel model diagnostics.
3. New step generation prompt.
4. New opportunity generation prompt.
5. Context selectors and runtime pass-through.
6. Non-deterministic prompt builder.
7. Bucket-aware contextual logic.
8. Fully observable LLM calls.

## Implementation Steps
1. Enforce LLM environment variable (server-only).
2. Instrument runtime workflows and core LLM client for debug output.
3. Add course, year, programme type, and study mode selectors.
4. Pass context through to runtime workflows.
5. Replace deterministic prompt builder for step generation.
6. Implement steps→opportunities AI prompt.
7. Integrate debug.log calls for all LLM events.
8. Iteratively refine prompt output.
9. Remove temporary logs and close epoch.

## Risks
- Prompt redesign may require multiple iterations.
- Context plumbing must avoid client-side env access.
- Opportunity mapping must stay abstract and architecture-aligned.
