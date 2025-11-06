import { render } from "@testing-library/react"
import { Input } from "@/components/ui"

describe("Input", () => {
  it("renders with label", () => {
    const { getByLabelText } = render(<Input label="Email" placeholder="you@example.com" />)
    expect(getByLabelText("Email")).toBeInTheDocument()
  })

  it("renders error text", () => {
    const { getByText } = render(<Input label="Password" error="Too short" />)
    expect(getByText("Too short")).toBeInTheDocument()
  })
})
