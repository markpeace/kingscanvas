"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import { Card, CardHeader, CardTitle, CardContent, CardFooter, Separator } from "@/components/ui"
import { Input, Textarea, Checkbox, Button, Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui"
import { Form, FormItem, FormLabel, FormControl, FormMessage, useZodErrorFor } from "@/components/form"
import { withSubmit } from "@/lib/forms"
import { useToast } from "@/lib/toast"

const Schema = z.object({
  name: z.string().min(2, "Please enter at least 2 characters."),
  email: z.string().email("Enter a valid email address."),
  role: z.string().min(1, "Choose a role."),
  bio: z.string().max(160, "Keep it under 160 characters.").optional(),
  agree: z
    .boolean({ invalid_type_error: "You must accept the terms." })
    .refine((value) => value === true, {
      message: "You must accept the terms."
    })
})
type Values = z.infer<typeof Schema>

function FieldError({ name, className }: { name: keyof Values; className?: string }) {
  const message = useZodErrorFor(name)
  return <FormMessage className={className}>{message}</FormMessage>
}

export default function FormsDemoPage() {
  const form = useForm<Values>({
    resolver: zodResolver(Schema),
    defaultValues: { name: "", email: "", role: "", bio: "", agree: false }
  })

  const { success, error } = useToast()

  async function onSubmit(v: Values) {
    await new Promise((r) => setTimeout(r, 500))
    success("Submitted", `Thanks ${v.name}!`)
  }

  async function onFail() {
    error("Validation failed", "Please check the fields and try again.")
  }

  return (
    <div className="mx-auto max-w-xl p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle>Forms demo (RHF + Zod)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(
                () => withSubmit(form, onSubmit, { onError: () => onFail() }),
                () => onFail()
              )}
              className="grid gap-4"
            >
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Ada Lovelace" {...form.register("name")} />
                </FormControl>
                <FieldError name="name" />
              </FormItem>

              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="ada@example.com" {...form.register("email")} />
                </FormControl>
                <FieldError name="email" />
              </FormItem>

              <FormItem>
                <FormLabel>Role</FormLabel>
                <FormControl>
                  <Select onValueChange={(v) => form.setValue("role", v)} value={form.watch("role")}>
                    <SelectTrigger />
                    <SelectContent>
                      <SelectItem value="developer">Developer</SelectItem>
                      <SelectItem value="designer">Designer</SelectItem>
                      <SelectItem value="pm">Product Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FieldError name="role" />
              </FormItem>

              <FormItem>
                <FormLabel>Bio (optional)</FormLabel>
                <FormControl>
                  <Textarea rows={3} placeholder="Short bio…" {...form.register("bio")} />
                </FormControl>
              </FormItem>

              <Separator />

              <FormItem>
                <label className="flex items-center gap-2">
                  <Checkbox checked={form.watch("agree")} onCheckedChange={(v) => form.setValue("agree", Boolean(v))} />
                  <span className="text-sm">I accept the terms</span>
                </label>
                <FieldError name="agree" className="mt-1" />
              </FormItem>

              <div className="flex gap-2">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Submitting…" : "Submit"}
                </Button>
                <Button type="button" variant="secondary" onClick={() => form.reset()}>
                  Reset
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="text-xs text-zinc-500 dark:text-zinc-400">
          Validates on submit via Zod, shows inline errors and success/failure toasts.
        </CardFooter>
      </Card>
    </div>
  )
}
