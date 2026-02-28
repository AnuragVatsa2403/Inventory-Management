/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          950: "#0B0F14",
          900: "#11161C",
          800: "#1A2028",
          700: "#222A35",
          600: "#2E3744",
          500: "#3A4554",
          400: "#4A5568",
          300: "#718096",
          200: "#A0AEC0",
          100: "#CBD5E0",
        },
        hive: {
          600: "#D97706",
          500: "#F59E0B",
          400: "#FBBF24",
        },
      },
    },
  },
  plugins: [],
}