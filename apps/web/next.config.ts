import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  transpilePackages: ["@jubely/api-schemas", "@jubely/i18n", "@jubely/ui"],
  allowedDevOrigins: ["localhost", "192.168.1.28"],
};

export default withNextIntl(nextConfig);
