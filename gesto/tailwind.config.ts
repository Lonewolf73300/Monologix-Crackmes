import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"], mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"] },
      colors: {
        ink: "#f3f5f8", panel: "#ffffff", line: "#e6eaf0", accent: "#1f9d4c", gold: "#d9a441", night: "#12141a",
        ok: "#16a34a", warn: "#d97706", bad: "#dc2626", info: "#2563eb",
        zinc: { 200: "#cbd5e1", 300: "#334155", 400: "#475569", 500: "#64748b", 600: "#94a3b8" },
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,.04), 0 6px 20px rgba(16,24,40,.06)",
        lift: "0 10px 30px -10px rgba(16,24,40,.25)",
        green: "0 10px 24px -10px rgba(31,157,76,.7)",
      },
    },
  },
  plugins: [],
};
export default config;
