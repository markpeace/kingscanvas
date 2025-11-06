import { setupServer } from "msw/node"
import { http, HttpResponse } from "msw"

// Example placeholder handler (disabled by default in tests)
// export const handlers = [
//   http.get("/api/health", () => HttpResponse.json({ ok: true }))
// ]

// Start with no global handlers; individual tests can register as needed.
export const server = setupServer()
export { http, HttpResponse }
