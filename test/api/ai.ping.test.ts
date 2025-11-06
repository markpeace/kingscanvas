import { NextRequest } from "next/server"
import { GET } from "@/app/api/ai/ping/route"

// Helper to build a Request-like object for App Router handlers
function makeRequest(url: string) {
  return new NextRequest(new Request(url))
}

describe("/api/ai/ping GET", () => {
  it("returns ok:true and a greeting payload", async () => {
    const req = makeRequest("http://localhost/api/ai/ping")
    const res = await GET(req)
    expect(res.ok).toBe(true)

    const json = await res.json()
    // Expected shape from our earlier epoch
    expect(json.ok).toBe(true)
    expect(json.data).toBeDefined()
    // Guard for the message key we use in the demo
    expect(typeof json.data.output === "string" || typeof json.data.message === "string").toBe(true)
  })
})
