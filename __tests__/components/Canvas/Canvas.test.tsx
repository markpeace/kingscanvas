import { render, screen } from "@testing-library/react"
import Canvas from "@/components/Canvas/Canvas"

describe("Canvas layout", () => {
  const renderCanvas = () => render(<Canvas />)

  it("renders the Canvas without crashing", () => {
    renderCanvas()

    expect(screen.getByRole("main", { name: "King's Canvas" })).toBeInTheDocument()
  })

  it("renders four column headers", () => {
    renderCanvas()

    const headers = ["Do Now", "Do Later", "Before I Graduate", "After I Graduate"]
    headers.forEach(title => {
      expect(screen.getByText(title)).toBeInTheDocument()
    })
  })

  it("renders controls for creating intentions", () => {
    renderCanvas()

    expect(screen.getByRole("button", { name: "＋ Add Intention" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Reset tutorial tips" })).toBeInTheDocument()
  })
})
