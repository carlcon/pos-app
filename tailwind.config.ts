import type { Config } from "tailwindcss";
import { heroui } from "@heroui/react";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Avenir Next"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: "#049AE0",
          50: "#E6F7FF",
          100: "#BFEBFF",
          200: "#99DFFF",
          300: "#73D3FF",
          400: "#4DC6FF",
          500: "#049AE0",
          600: "#037BB3",
          700: "#025C86",
          800: "#023D5A",
          900: "#011E2D",
        },
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            primary: {
              DEFAULT: "#049AE0",
              foreground: "#FFFFFF",
            },
          },
        },
        dark: {
          colors: {
            primary: {
              DEFAULT: "#049AE0",
              foreground: "#FFFFFF",
            },
          },
        },
      },
    }),
  ],
};

export default config;
