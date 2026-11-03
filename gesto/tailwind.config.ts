import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: { extend: { colors: { ink: "#0e0f12", panel: "#17181d", line: "#2a2c34", accent: "#ff7a1a" } } },
  plugins: [],
};
export default config;
