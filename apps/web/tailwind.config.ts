import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F9F9F7",
        surface: "#FFFFFF",
        line: "#E7E5DE",
        ink: {
          DEFAULT: "#161613",
          soft: "#3A3A34",
          muted: "#6B6B63",
        },
        // Tenant-driven CSS variables (set by the server theme engine).
        accent: "var(--accent)",
        primary: "var(--primary)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(20,20,15,0.04), 0 10px 30px rgba(20,20,15,0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
