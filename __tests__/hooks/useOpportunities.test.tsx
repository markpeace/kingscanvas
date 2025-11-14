import { render, screen, waitFor } from "@testing-library/react"
import type { FC } from "react"

import { useOpportunities } from "@/hooks/useOpportunities"

type HookTesterProps = {
  stepId?: string | null
}

const HookTester: FC<HookTesterProps> = ({ stepId }) => {
  const { opportunities, isLoading, error } = useOpportunities(stepId ?? undefined)

  return (
    <div>
      <span data-testid="loading">{isLoading ? "true" : "false"}</span>
      <span data-testid="count">{opportunities.length}</span>
      <span data-testid="error">{error ? error.message : ""}</span>
    </div>
  )
}

describe("useOpportunities", () => {
  const originalFetch = global.fetch

  afterEach(() => {
    jest.clearAllMocks()
    if (originalFetch) {
      global.fetch = originalFetch
    } else {
      // @ts-expect-error - cleaning up test overrides
      delete global.fetch
    }
  })

  it("does not issue a request when the step id is missing", async () => {
    const fetchMock = jest.fn()
    global.fetch = fetchMock as typeof global.fetch

    render(<HookTester stepId={null} />)

    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"))
    expect(fetchMock).not.toHaveBeenCalled()
    expect(screen.getByTestId("count")).toHaveTextContent("0")
    expect(screen.getByTestId("error")).toHaveTextContent("")
  })

  it("treats 404 responses as an empty opportunities list", async () => {
    const jsonSpy = jest.fn()
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: jsonSpy
    })

    global.fetch = fetchMock as typeof global.fetch

    render(<HookTester stepId="abc123" />)

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"))

    expect(screen.getByTestId("count")).toHaveTextContent("0")
    expect(screen.getByTestId("error")).toHaveTextContent("")
    expect(jsonSpy).not.toHaveBeenCalled()
  })
})
