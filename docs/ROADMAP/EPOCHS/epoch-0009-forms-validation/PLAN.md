# PLAN — Epoch 0009: Forms & Validation

## Context
We now have UI primitives and toasts. Next, we’ll add a small, ergonomic forms stack to power Auth and DB flows:
- react-hook-form for performant controlled forms,
- zod for schema validation,
- shims/helpers so forms look and behave consistently with our UI primitives.

## Objectives
- Add react-hook-form + zod + @hookform/resolvers.
- Provide reusable helpers: `<Form>`, `<FormField>`, `<FormItem>`, `<FormLabel>`, `<FormControl>`, `<FormMessage>`, `<FormDescription>`.
- Integrate with existing `Input` component and show error + hint states properly.
- Create a `/forms-demo` page that demonstrates validation, error display, and submit handling.
- Toast on submit success/error.

## Deliverables
- Form primitives under `components/form/*`.
- Validation utilities under `lib/validation/*`.
- Demo page `/forms-demo` with at least: email/password form, Zod schema, submit handler.
- README section documenting the pattern and examples.

## Proposed PR sequence within this epoch
1) PR 1 — Plan & Status (this PR)
2) PR 2 — Dependencies + Form primitives (components + helpers)
3) PR 3 — `/forms-demo` page with working examples
4) PR 4 — Verify & Close (README + ROADMAP updates)

## Acceptance Criteria (Definition of Done)
- Forms use react-hook-form controlled inputs with Zod validation.
- Errors render beneath inputs; aria-attributes/labels are correct.
- Submissions trigger success/error toasts; disabled states during submit.
- `/forms-demo` verified on mobile and desktop; dark-mode compliant.
- README updated; epoch marked `done`.

## Out of Scope
- Server actions for Auth or DB (handled in later epochs).
- Complex multi-step forms (can be added later).

## Links
- Roadmap: /docs/ROADMAP/ROADMAP.md
- UI Primitives: /docs/ROADMAP/EPOCHS/epoch-0006-ui-primitives/
- Toasts: /docs/ROADMAP/EPOCHS/epoch-0008-toasts/
