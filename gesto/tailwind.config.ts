import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: { extend: { colors: { ink: "#0e0f12", panel: "#17181d", line: "#2a2c34", accent: "#ff7a1a", ok: "#22c55e", warn: "#f59e0b", bad: "#ef4444", info: "#3b82f6" } } },
  plugins: [],
};
export default config;
