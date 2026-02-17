import type { NextConfig } from "next";

const isProd = false;

const nextConfig: NextConfig = {
  output: "export",
  basePath: isProd ? "/MoneyTrackingApp" : "",
  assetPrefix: isProd ? "/MoneyTrackingApp" : "",
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
};

export default nextConfig;
