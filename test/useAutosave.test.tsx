import { act, renderHook } from "@testing-library/react"

import useAutosave from "@/hooks/useAutosave"

describe("useAutosave", () => {
  beforeEach(() => {
    jest.useFakeTimers()
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: true, status: 200, statusText: "OK" }) as jest.Mock
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.resetAllMocks()
  })

  it("does not save while disabled", () => {
    const { unmount } = renderHook(() =>
      useAutosave({ intentions: [] }, "/api/intentions", 1500, 3, false)
    )

    act(() => {
      jest.advanceTimersByTime(2000)
    })

    expect(global.fetch).not.toHaveBeenCalled()
    unmount()
  })

  it("saves when enabled", async () => {
    const { unmount } = renderHook(() =>
      useAutosave({ intentions: [] }, "/api/intentions", 1500, 3, true)
    )

    await act(async () => {
      jest.advanceTimersByTime(1500)
      await Promise.resolve()
    })

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/intentions",
      expect.objectContaining({ method: "PUT" })
    )
    unmount()
  })
})
