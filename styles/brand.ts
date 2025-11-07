export const brandColors = {
  red: "#E2231A",
  redDark: "#C81E14",
  black: "#000000",
  white: "#FFFFFF",
  grey: {
    light: "#7F8E96",
    dark: "#575756"
  }
} as const

export const brandUsageExamples = {
  tailwind: {
    background: "bg-kings-red",
    text: "text-kings-red",
    border: "border-kings-grey-light"
  },
  semantic: {
    primary: "bg-brand-primary",
    accent: "text-brand-accent"
  }
} as const
