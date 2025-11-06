# Typography System

King's Canvas adopts a typography stack that prioritises King's Bureau Grotesk 37 while providing accessible, widely available fallbacks.

## Font Stacks

- **Sans-serif (default UI & body):** `"Bureau Grotesk 37", "Inter", "Helvetica Neue", "Arial", sans-serif`
- **Serif (editorial moments):** `"Georgia", serif`

## Hierarchy

| Token | Tailwind classes | Usage |
| --- | --- | --- |
| Column headers | `font-bold uppercase tracking-wide text-kings-red text-xl md:text-2xl` | Canvas column headings and primary section labels |
| Body text | `font-normal text-base text-kings-black` | General copy, descriptions, table cells |
| Placeholder cards | `font-medium text-kings-grey-dark` | Temporary states, empty-data placeholders |

## Implementation Notes

- Fonts load via Google Fonts (`Inter`) in `app/globals.css`. Bureau Grotesk 37 is referenced for environments where the licensed font is available.
- Tailwind's `fontFamily.sans` and `fontFamily.serif` tokens are extended in `tailwind.config.ts` to surface the stacks globally.
- Base styles apply the sans-serif stack and body text sizing/colour via Tailwind's `@layer base` utilities.
