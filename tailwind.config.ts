import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#6A0DAD", // Royal Purple (MOTS)
          dark: "#4B0082",    // Indigo/Deep Purple
          light: "#F3E5F5",   // Light Purple bg
        },
        accent: {
          DEFAULT: "#D4AF37", // Gold
          hover: "#B8860B",   // Dark Goldenrod
          light: "#FFF8E1",   // Light Gold/Cream
        },
        bg: {
          DEFAULT: "#F9FAFB",
        },
        border: {
          DEFAULT: "#E5E7EB",
        },
        text: {
          primary: "#1F2937",
          secondary: "#4B5563",
          muted: "#9CA3AF",
        },
        success: "#059669",
        warning: "#D97706",
        error: "#DC2626",
        info: "#2563EB",
      },
      fontFamily: {
        sans: ["Inter", "Noto Sans Thai", "sans-serif"],
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #6A0DAD 0%, #4B0082 100%)',
        'gradient-accent': 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)',
      }
    },
  },
  plugins: [],
};
export default config;
