// Extend Jest with jest-dom matchers
import "@testing-library/jest-dom"

// Polyfill fetch in JSDOM
import "whatwg-fetch"

// MSW (node) - start a per-test server with no default handlers
import { server } from "./testServer"

// Establish API mocking before all tests.
beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }))

// Reset any runtime request handlers we may add during the tests.
afterEach(() => server.resetHandlers())

// Clean up once the tests are done.
afterAll(() => server.close())
