import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}"
  ],
  theme: {
    screens: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px"
    },
    extend: {
      fontFamily: {
        sans: ["Bureau Grotesk 37", "Inter", "Helvetica Neue", "Arial", "sans-serif"],
        serif: ["Georgia", "serif"]
      },
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
