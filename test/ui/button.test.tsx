import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { Button } from "@/components/ui"

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText("Click me")).toBeInTheDocument()
  })

  it("applies variant and size classes", () => {
    const { getByRole, rerender } = render(
      <Button variant="secondary" size="lg">
        Go
      </Button>
    )
    expect(getByRole("button")).toHaveClass("bg-zinc-100")
    expect(getByRole("button")).toHaveClass("h-11")

    rerender(<Button variant="destructive" size="icon" aria-label="delete" />)
    const btn = getByRole("button", { name: "delete" })
    expect(btn).toHaveClass("bg-rose-600")
    expect(btn).toHaveClass("w-10")
  })

  it("respects disabled state", () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole("button")).toBeDisabled()
  })
})
