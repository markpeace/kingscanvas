# Form Helpers (RHF + Zod)

## Demo page
An interactive example is available at `/ui-demo/forms` once deployed.

## Components
- Form, FormItem, FormLabel, FormControl, FormMessage
- Hook: useZodErrorFor(name) to surface a field's error string

## Helpers
- withSubmit(form, async (values) => { ... }) wraps async submit and clears RHF errors after completion.

## Example (conceptual)
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormItem, FormLabel, FormControl, FormMessage, useZodErrorFor } from "@/components/form"
import { Input, Button } from "@/components/ui"

const Schema = z.object({ email: z.string().email(), name: z.string().min(2) })
type Values = z.infer<typeof Schema>
const form = useForm<Values>({ resolver: zodResolver(Schema) })
const emailError = useZodErrorFor("email")

// In JSX:
// <Form {...form}>
//   <form onSubmit={form.handleSubmit(async (v) => { /* ... */ })}>
//     <FormItem>
//       <FormLabel>Email</FormLabel>
//       <FormControl><Input {...form.register("email")} /></FormControl>
//       <FormMessage>{emailError}</FormMessage>
//     </FormItem>
//     <Button type="submit">Submit</Button>
//   </form>
// </Form>

## Notes
- Field names must match your Zod schema.
- Async flows: use form.handleSubmit or withSubmit(form, run).

## Related
- `docs/UI/primitives.md` for base components.
- `docs/UI/README.md` for the UI overview and imports.
