import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pg is server-only; keep it out of client bundles.
  serverExternalPackages: ["pg"],
};

export default nextConfig;
