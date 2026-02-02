import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F7F7F7",
        foreground: "#0B0B0B", // Primary Text
        secondary: "#6F6F6F", // Secondary Text
        accent: "#E53935", // Red
        surface: "#FFFFFF", // Cards/Surfaces
        border: "#EAEAEA", // Borders
      },
      fontFamily: {
        sans: ["var(--font-inter)"],
      },
    },
  },
  plugins: [],
};
export default config;
