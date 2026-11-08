import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.dirname(fileURLToPath(import.meta.url));
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() { return [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }] }]; },
  webpack(config) { config.resolve.alias["@"] = root; return config; },
};
export default nextConfig;
