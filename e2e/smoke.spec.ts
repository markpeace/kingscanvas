import { test, expect } from "@playwright/test"

test.describe("Smoke", () => {
  test("home loads and nav links are present", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByRole("link", { name: "Home" })).toBeVisible()
    await expect(page.getByRole("link", { name: "Login" })).toBeVisible()
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible()
    await expect(page.getByRole("link", { name: "UI Demo" })).toBeVisible()
    await expect(page.getByRole("link", { name: "Forms Demo" })).toBeVisible()
    // Manifest link present in head
    const hasManifest = await page.evaluate(() => !!document.querySelector('link[rel="manifest"]'))
    expect(hasManifest).toBeTruthy()
  })

  test("ui-demo renders buttons, inputs, and opens modal", async ({ page }) => {
    await page.goto("/ui-demo")
    await expect(page.getByRole("heading", { level: 1, name: /UI Primitives Demo/i })).toBeVisible()
    await expect(page.getByRole("button", { name: "Default" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Outline" })).toBeVisible()
    await expect(page.getByLabel("Email")).toBeVisible()
    // Open modal and verify content
    await page.getByRole("button", { name: "Open Modal" }).click()
    await expect(page.getByRole("heading", { level: 3, name: /Example Modal/i })).toBeVisible()
    await page.getByRole("button", { name: "Close via Action" }).click()
  })

  test("forms-demo validates and submits", async ({ page }) => {
    await page.goto("/forms-demo")
    await expect(page.getByRole("heading", { level: 1, name: /Forms & Validation Demo/i })).toBeVisible()
    // Trigger validation errors
    await page.getByRole("button", { name: "Submit" }).click()
    await expect(page.getByText(/Enter a valid email/i)).toBeVisible()
    await expect(page.getByText(/Password must be at least 8 characters/i)).toBeVisible()
    // Fix inputs and submit
    await page.getByLabel("Email").fill("user@example.com")
    await page.getByLabel("Password").fill("mypassword")
    await page.getByRole("button", { name: "Submit" }).click()
    // Expect success toast text somewhere in the DOM (centered toast)
    await expect(page.getByText(/Signed in/i)).toBeVisible()
  })
})
