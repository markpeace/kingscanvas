// CommonJS Jest config to avoid ts-node requirement in CI environments
const nextJest = require("next/jest")

const createJestConfig = nextJest({ dir: "./" })

/** @type {import('jest').Config} */
const customJestConfig = {
  testEnvironment: "jsdom",
  setupFiles: ["<rootDir>/test/setup-globals.ts"],
  setupFilesAfterEnv: ["<rootDir>/test/setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1"
  },
  testPathIgnorePatterns: [
    "<rootDir>/.next/",
    "<rootDir>/node_modules/",
    "<rootDir>/.vercel/"
  ],
  collectCoverageFrom: [
    "components/**/*.{ts,tsx}",
    "lib/**/*.{ts,tsx}",
    "app/**/*.{ts,tsx}",
    "!app/**/route.{ts,tsx}",
    "!**/index.{ts,tsx}"
  ],
  coverageDirectory: "coverage",
  extensionsToTreatAsEsm: [".ts", ".tsx"]
}

module.exports = createJestConfig(customJestConfig)
