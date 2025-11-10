import { debug } from "@/lib/debug"

export async function setupMocks(): Promise<void> {
  debug.warn(
    "[MSW] Mocking was enabled but no browser mocks are configured; skipping setup."
  )
}
