import { render, screen } from "@testing-library/react"
import Canvas from "@/components/Canvas/Canvas"

describe("Canvas layout", () => {
  const renderCanvas = () => render(<Canvas />)

  it("renders the Canvas without crashing", () => {
    renderCanvas()

    expect(screen.getByRole("main", { name: "King's Canvas" })).toBeInTheDocument()
  })

  it("renders four columns with correct headers", () => {
    renderCanvas()

    const columns = screen.getAllByRole("region")
    expect(columns).toHaveLength(4)

    const headers = ["Do Now", "Do Later", "Before I Graduate", "After I Graduate"]
    headers.forEach(title => {
      expect(screen.getByRole("heading", { level: 2, name: title })).toBeInTheDocument()
    })
  })

  it("renders placeholder cards in the appropriate columns", () => {
    renderCanvas()

    const stepPlaceholders = screen.getAllByText("Step placeholder")
    expect(stepPlaceholders).toHaveLength(4)

    expect(screen.getByText("Intention placeholder")).toBeInTheDocument()
  })
})
