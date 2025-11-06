import "@testing-library/jest-dom/extend-expect"
// Polyfill: Next.js app router uses fetch in some helpers
if (!global.fetch) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  global.fetch = require("node-fetch") as any
}
