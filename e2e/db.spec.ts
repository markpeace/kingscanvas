import { test, expect } from "@playwright/test"

test.describe("DB endpoints", () => {
  test("GET /api/db/health returns ok true", async ({ request }) => {
    const res = await request.get("/api/db/health")
    expect(res.ok()).toBeTruthy()
    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(typeof json.db).toBe("string")
  })

  test("POST /api/profiles requires auth (401 when signed out)", async ({ request }) => {
    const res = await request.post("/api/profiles", {
      data: { displayName: "Test User", bio: "From E2E (unauthenticated)" },
      headers: { "content-type": "application/json" }
    })
    expect(res.status()).toBe(401)
    const json = await res.json()
    expect(json.ok).toBe(false)
    expect(json.error).toMatch(/unauthorized/i)
  })
})
