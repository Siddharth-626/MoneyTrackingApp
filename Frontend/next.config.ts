import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/MoneyTrackingApp",
  assetPrefix: "/MoneyTrackingApp",
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
};

export default nextConfig;
