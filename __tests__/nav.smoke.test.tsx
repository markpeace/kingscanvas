import { render, screen } from "@testing-library/react"
import Nav from "@/components/Nav"

describe("Nav", () => {
  it("renders primary links", () => {
    render(<Nav />)
    const labels = ["Home", "Login", "Dashboard", "UI Demo", "Forms Demo"]
    for (const label of labels) {
      expect(screen.getByRole("link", { name: label })).toBeInTheDocument()
    }
  })
})
