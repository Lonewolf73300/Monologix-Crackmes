import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"], mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"] },
      colors: {
        // Papier chaud, encre, filets fins, un seul accent (vert alpin profond).
        ink: "#f6f5f1", panel: "#ffffff", line: "#e4e2dc", accent: "#1f5a43", gold: "#b08a4a", night: "#101112",
        ok: "#067647", warn: "#b54708", bad: "#b42318", info: "#175cd3",
        zinc: { 200: "#d6d3cc", 300: "#3f3d39", 400: "#57534e", 500: "#78716c", 600: "#a8a29e" },
      },
      boxShadow: { card: "0 1px 0 rgba(16,17,18,.04)", lift: "0 12px 32px -12px rgba(16,17,18,.18)" },
      letterSpacing: { label: ".08em" },
    },
  },
  plugins: [],
};
export default config;
