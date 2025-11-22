# Epoch 0010 Prompt Refinement and Context Integration

## Objective
Rebuild the AI prompt system so it is fully generative, context-aware, concise, and aligned with the King’s Edge learning architecture. Introduce explicit LLM model control and ensure all LLM calls are observable in the debug panel. By the end of the epoch there will be two consolidated, easy-to-edit prompt files: one for step generation and one for opportunity generation.

## High level goals

### Model observability
- Every AI-generated message returned to the front end includes the LLM model used to generate it.
- Debug Panel entries for AI suggestions clearly show the model.
- Errors relating to model configuration are surfaced in the Debug Panel.

### Model configuration
- A single environment variable `LLM` is used to select the model.
- No default model fallback anywhere in the codebase.
- If `LLM` is not set, the backend throws and the error appears in the Debug Panel.
- Client code never reads environment variables directly.

### Step generation prompt
Create a consolidated step-generation prompt that:
- Lives in a single file, e.g. `lib/prompts/steps.ts`.
- Uses course, year, programme type, and study mode as context.
- Produces concise steps focused on knowledge, skills, and experience.
- Respects the intention buckets (do now, do later, before graduation, after graduation).
- Adjusts behaviour for 3-year undergraduate, 1-year Masters, doctoral programmes, and distance learners.
- Avoids prescribing detailed activities that belong in opportunities.

### Opportunity generation prompt
Create a consolidated opportunity-generation prompt that:
- Lives in a single file, e.g. `lib/prompts/opportunities.ts`.
- Maps steps to meaningful areas of progress rather than hard coded examples.
- Uses the King’s Edge blueprint architecture and tiers (Intensive, Sustained, Short form, Evergreen).
- Produces opportunity types, not fully concrete offers.
- Respects constraints such as distance vs on-campus engagement and time intensity.

### Context integration
- Introduce UI controls to capture course/discipline, year of study, programme type, and study mode.
- Pass this context through APIs and workflows into the prompt builders.
- Ensure context is visible in debugging output when helpful.

### Debug visibility
Use the existing debug infrastructure so that:
- Every LLM call that generates user-visible content produces a Debug Panel entry that includes the model.
- Configuration errors (such as a missing `LLM`) are visible in the Debug Panel.
- Prompt text can be inspected via debug entries when needed.

## Planned PR sequence

### PR-1: Model provenance in AI-generated messages
- Ensure every AI-generated suggestion returned to the front end includes the model used to generate it (for example `{ text, model }`).
- No changes to how the model is chosen.

### PR-2: Environment variable and model enforcement
- Introduce and enforce the `LLM` environment variable.
- Remove all default model fallbacks.
- Surface configuration errors in the Debug Panel.

### PR-3: Step prompt extraction and refinement
- Extract the step-generation prompt into `lib/prompts/steps.ts`.
- Rewrite and refine the prompt to meet the goals above.

### PR-4: Opportunity prompt extraction and creation
- Introduce `lib/prompts/opportunities.ts`.
- Implement the first version of the steps→opportunities prompt using the King’s Edge architecture.

### PR-5: Context selectors and wiring
- Add UI controls and state for course, year, programme type, and study mode.
- Pass this context through to the prompt builders.

### PR-6: Context-aware prompt behaviour
- Update both prompts to use the context to shape their outputs.
- Adjust outputs for different programme patterns and constraints.

### PR-7: Replace deterministic opportunity engine
- Replace the existing deterministic opportunities logic with the AI-driven opportunity prompt.
- Preserve the Edge blueprint structure in outputs.

## Scope
This epoch covers:
- LLM observability and configuration.
- Prompt extraction, consolidation, and refinement.
- Context collection and integration.
- Migration of opportunity generation from deterministic JS to AI prompts.

It does not aim to:
- Redesign the overall UI beyond adding context selectors.
- Overhaul autosave or storage.
- Change authentication or deployment configuration.

## Deliverables
1. Model provenance in all AI-generated messages.
2. `LLM` environment variable enforcement with no defaults.
3. Consolidated step-generation prompt file.
4. Consolidated opportunity-generation prompt file.
5. UI and runtime support for course/year/programme/mode context.
6. Context-aware step and opportunity prompts.
7. AI-driven opportunity generation aligned with the King’s Edge blueprint architecture.
8. Debug Panel entries that clearly show the model and, where appropriate, the prompt.

## Implementation steps
1. Implement PR-1 (model provenance in AI messages).
2. Implement PR-2 (`LLM` env var and removal of defaults).
3. Extract and refine step-generation prompt (PR-3).
4. Create and wire the opportunity prompt (PR-4).
5. Add context selectors and wire to workflows (PR-5).
6. Make prompts context-aware (PR-6).
7. Switch opportunities to AI-driven generation (PR-7).
8. Tidy up debug output and close the epoch.

## Risks
- Prompt refinement may require iteration based on live testing.
- Context wiring must avoid client-side environment access.
- Replacing deterministic opportunities with AI output must keep the Edge blueprint logic clear and explainable.
