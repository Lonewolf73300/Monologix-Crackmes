import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#f2f5f9", panel: "#ffffff", line: "#e3e8ef", accent: "#16a34a", gold: "#d4a24c", night: "#14161b",
        ok: "#16a34a", warn: "#d97706", bad: "#dc2626", info: "#2563eb",
        // Échelle « zinc » adaptée au thème clair : les classes text-zinc-* existantes restent lisibles.
        zinc: { 200: "#cbd5e1", 300: "#334155", 400: "#475569", 500: "#64748b", 600: "#94a3b8" },
      },
      boxShadow: { card: "0 1px 2px rgba(15,23,42,.06), 0 8px 24px rgba(15,23,42,.06)" },
    },
  },
  plugins: [],
};
export default config;
