import { render } from "@testing-library/react"
import { Button } from "@/components/ui"

describe("Button", () => {
  it("renders default variant", () => {
    const { getByRole } = render(<Button>Click</Button>)
    const btn = getByRole("button", { name: /click/i })
    expect(btn).toBeInTheDocument()
  })

  it("applies outline variant", () => {
    const { getByRole } = render(<Button variant="outline">Outline</Button>)
    const btn = getByRole("button", { name: /outline/i })
    // Basic class presence smoke-check (tailwind class fragment)
    expect(btn.className).toMatch(/border/)
  })
})
