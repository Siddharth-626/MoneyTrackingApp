import path from "path";
import type { NextConfig } from "next";

// NEXT_PUBLIC_DEPLOY_TARGET options:
//   ghpages – static export for GitHub Pages
//   (unset) – standard Next.js server
const deployTarget = (process.env.NEXT_PUBLIC_DEPLOY_TARGET as
  | "ghpages"
  | undefined) ?? undefined;
const isGhPages = deployTarget === "ghpages";

const nextConfig: NextConfig = {
  // Static export only for GitHub Pages.
  ...(isGhPages && { output: "export" }),
  basePath: isGhPages ? "/MoneyTrackingApp" : "",
  assetPrefix: isGhPages ? "/MoneyTrackingApp" : "",
  images: {
    // Unoptimized images only for static exports.
    unoptimized: isGhPages,
  },
  reactStrictMode: true,
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
