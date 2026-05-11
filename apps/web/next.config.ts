import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  transpilePackages: ["@jubely/api-schemas", "@jubely/i18n", "@jubely/ui"],
};

export default withNextIntl(nextConfig);

