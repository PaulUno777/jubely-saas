import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@jubely/api-schemas", "@jubely/i18n", "@jubely/ui"],
};

export default nextConfig;

