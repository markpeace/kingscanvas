# PLAN — Epoch 0014: UI Primitives & Form Helpers

## Goal
Ship a curated, accessible set of UI components and a batteries-included form system (React Hook Form + Zod) so new apps start with consistent UX, validation, and error handling.

## Scope
- **UI primitives** (Radix + shadcn/ui style):
  - Button, Input, Textarea, Label, Select, Checkbox, Radio, Switch  
  - Card, Dialog, Sheet, Tabs, Separator, Tooltip  
  - Toast integration (reuse global toast system)
- **Form helpers**
  - `<Form>` wrapper with RHF context  
  - `<FormField>`, `<FormItem>`, `<FormLabel>`, `<FormControl>`, `<FormMessage>`  
  - Zod resolver support + error mapping utilities  
  - Async submit helper with loading state and toast feedback
- **Demo**
  - `/ui-demo/forms` page that exercises validation, async submit, and toasts.
- **Docs**
  - `/docs/UI/primitives.md` and `/docs/UI/forms.md` describing usage and a11y.

## Non-goals
- Theme editor / design tokens / Storybook — future epoch.  
- Complex data grids or charts — out of scope.

## Dependencies
- react-hook-form  
- zod  
- @hookform/resolvers  
- radix-ui primitives (via shadcn)  
- class-variance-authority  
- tailwindcss (already present)

## Acceptance criteria
- `/ui-demo/forms` builds and validates without console errors.  
- Zod errors render inline.  
- Async submit shows loading and toast.  
- Components pass keyboard a11y checks.  
- Docs clearly explain usage.

## Proposed PR sequence
1. Plan & Status (this PR)  
2. UI Primitives scaffold  
3. Form helpers (RHF + Zod)  
4. Demo page (/ui-demo/forms)  
5. Docs polish + Verify & Close

## Risks & mitigations
- Styling drift → centralize exports in `components/ui/index.ts`.  
- Complexity → keep helpers minimal and typed.  

## Notes
- Each PR should be observable on device where possible.  
