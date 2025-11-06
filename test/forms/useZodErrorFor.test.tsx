import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import "@testing-library/jest-dom"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormItem, FormLabel, FormControl, FormMessage, useZodErrorFor } from "@/components/form"
import { Input, Button } from "@/components/ui"

const Schema = z.object({
  email: z.string().email("Enter a valid email"),
  name: z.string().min(2, "Name too short")
})
type Values = z.infer<typeof Schema>

function DemoForm() {
  const form = useForm<Values>({
    resolver: zodResolver(Schema),
    defaultValues: { email: "", name: "" }
  })
  const emailErr = useZodErrorFor("email")

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(() => { /* no-op */ })}>
        <FormItem>
          <FormLabel>Email</FormLabel>
          <FormControl>
            <Input aria-label="email" {...form.register("email")} />
          </FormControl>
          <FormMessage data-testid="email-msg">{emailErr}</FormMessage>
        </FormItem>
        <FormItem>
          <FormLabel>Name</FormLabel>
          <FormControl>
            <Input aria-label="name" {...form.register("name")} />
          </FormControl>
        </FormItem>
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}

describe("useZodErrorFor", () => {
  it("shows error on invalid submit and clears after fixing", async () => {
    const user = userEvent.setup()
    render(<DemoForm />)

    // submit empty form -> expect email error
    await user.click(screen.getByRole("button", { name: "Submit" }))
    expect(screen.getByTestId("email-msg")).toHaveTextContent("Enter a valid email")

    // type a valid email and submit again -> error should clear
    await user.type(screen.getByLabelText("email"), "ada@example.com")
    await user.click(screen.getByRole("button", { name: "Submit" }))

    // Message element exists but should be empty (component renders null when no children)
    expect(screen.queryByText("Enter a valid email")).not.toBeInTheDocument()
  })
})
