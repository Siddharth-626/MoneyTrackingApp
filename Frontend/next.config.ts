import type { NextConfig } from "next";

// Set NEXT_PUBLIC_DEPLOY_TARGET=ghpages when deploying to GitHub Pages.
const isGhPages = process.env.NEXT_PUBLIC_DEPLOY_TARGET === "ghpages";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isGhPages ? "/MoneyTrackingApp" : "",
  assetPrefix: isGhPages ? "/MoneyTrackingApp" : "",
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
};

export default nextConfig;
