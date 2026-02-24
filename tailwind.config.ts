import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neutral: {
          50: "#f5f5f2",
          100: "#ebede9",
          200: "#d6dbd7",
          300: "#b6c0bd",
          400: "#8f9c9b",
          500: "#6f7d7e",
          600: "#556264",
          700: "#3f4d52",
          800: "#2c383d",
          900: "#172228",
        },
      },
      fontFamily: {
        sans: ["Avenir Next", "Trebuchet MS", "Segoe UI", "sans-serif"],
        display: ["Iowan Old Style", "Palatino Linotype", "Book Antiqua", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
