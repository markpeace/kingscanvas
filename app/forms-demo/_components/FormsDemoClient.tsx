"use client"

import { useForm, useFormContext } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button, Card, CardContent, CardFooter, CardHeader, CardTitle, Input } from "@/components/ui"
import { Form, FormControl, FormItem, FormLabel, FormMessage, useZodErrorFor } from "@/components/form"
import { useToast } from "@/lib/toast"
import { demoLoginSchema } from "@/lib/validation"

type DemoLogin = z.infer<typeof demoLoginSchema>

function DemoField({
  name,
  label,
  type,
  placeholder,
  autoComplete,
  description,
  submitting
}: {
  name: "email" | "password"
  label: string
  type: string
  placeholder: string
  autoComplete: string
  description: string
  submitting: boolean
}) {
  const { register } = useFormContext<DemoLogin>()
  const message = useZodErrorFor(name)

  return (
    <FormItem>
      <FormLabel htmlFor={name}>{label}</FormLabel>
      <FormControl>
        <Input
          id={name}
          {...register(name)}
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={submitting}
        />
      </FormControl>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
      <FormMessage>{message}</FormMessage>
    </FormItem>
  )
}

export default function FormsDemoClient() {
  const { success, error } = useToast()

  const form = useForm<DemoLogin>({
    resolver: zodResolver(demoLoginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onSubmit"
  })

  async function onSubmit(values: DemoLogin) {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500))
      success("Signed in", `Welcome ${values.email}`)
      form.reset()
    } catch (err) {
      error("Sign in failed", "Please try again.")
    }
  }

  const submitting = form.formState.isSubmitting

  return (
    <section className="py-6 sm:py-8">
      <h1 className="mb-2 text-2xl font-bold sm:text-3xl">Forms & Validation Demo</h1>
      <p className="mb-4 text-zinc-600 dark:text-zinc-300 sm:mb-5">
        react-hook-form + zod with our UI primitives. Try invalid inputs to see inline errors.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Demo Login Form</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="max-w-md" onSubmit={form.handleSubmit(onSubmit)}>
              <DemoField
                name="email"
                label="Email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                description="We’ll never spam you."
                submitting={submitting}
              />

              <DemoField
                name="password"
                label="Password"
                type="password"
                placeholder="********"
                autoComplete="current-password"
                description="At least 8 characters."
                submitting={submitting}
              />

              <div className="pt-2">
                <Button type="button" variant="subtle" className="mr-2" onClick={() => form.reset()} disabled={submitting}>
                  Reset
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Submitting…" : "Submit"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="text-xs text-zinc-500 dark:text-zinc-400">
          On success you’ll see a toast. Errors show beneath inputs.
        </CardFooter>
      </Card>
    </section>
  )
}
