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
          red: {
            DEFAULT: "#E2231A",
            dark: "#C81E14"
          },
          black: "#000000",
          white: "#FFFFFF",
          grey: {
            light: "#7F8E96",
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
