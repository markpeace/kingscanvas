import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        kings: {
          red: "#E2231A",
          black: "#000000",
          white: "#FFFFFF",
          grey: {
            light: "#CDD7DC",
            dark: "#575756"
          }
        },
        brand: {
          primary: "#E2231A",
          accent: "#575756"
        }
      }
    }
  },
  plugins: []
}
export default config
