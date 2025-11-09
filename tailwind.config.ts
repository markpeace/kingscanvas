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
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif"
        ]
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
            light: "#D1D5DB",
            dark: "#4B5563"
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
