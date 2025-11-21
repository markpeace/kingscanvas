# Epoch 0010 Prompt Refinement and Context Integration

## Objective
Redesign the AI prompt system so it is fully generative, context aware, concise, and aligned with the King’s Edge learning architecture. Introduce the LLM environment variable for model selection and make the active model visible in the debug panel.

## Goals

### Model control
- Introduce an LLM environment variable to define which model is used.
- Ensure all AI calls use this variable.
- Push the active model into the debug panel.

### Step generation prompt
Replace the deterministic template with a fully generative prompt that:
- Uses course, year, programme type, and study mode.
- Produces concise steps oriented to knowledge, skills, and experience.
- Aligns with the selected bucket.
- Reflects realistic timelines for UG, Masters, and Doctoral students.
- Avoids prescribing concrete activities.

### Opportunity generation prompt
Introduce a new AI prompt that:
- Maps steps to meaningful areas of progress.
- Aligns with the Edge architecture and blueprint tiers.
- Respects constraints such as on campus or distance learning.
- Does not prescribe detailed activities.

### Context integration
Add UI and API support for:
- Course
- Year of study
- Programme type
- Study mode

Ensure this context reaches the prompt builder.

### Debug visibility
Use the debug panel to show:
- Active LLM model
- Optional prompt metadata for testing

## Scope
This epoch includes model integration, prompt redesign, addition of context, creation of the second prompt, and debug visibility. It does not include redesign of the opportunity engine or evaluation tooling.

## Deliverables
1. LLM environment variable support.
2. Debug panel model diagnostics.
3. New step generation prompt.
4. New opportunity generation prompt.
5. Context selectors and API pass through.
6. Refactored prompt builder with no deterministic templates.
7. Bucket aware logic.
8. Final validated outputs.

## Implementation Steps
1. Add LLM environment variable support in lib/ai/client.
2. Emit model info to debug panel in AI routes.
3. Add course, year, programme type, and study mode to UI.
4. Pass context to API and prompt builder.
5. Replace deterministic suggestion prompt builder.
6. Implement the steps to opportunities prompt.
7. Integrate debugSink messages.
8. Use small PRs and hotfixes to refine tone, structure, and context behaviour.
9. Clean up temporary logs and close the epoch.

## Risks
- Temporary instability during prompt redesign.
- Context must pass through cleanly across UI, API, and prompt builder.
- Opportunity mapping must remain abstract.
