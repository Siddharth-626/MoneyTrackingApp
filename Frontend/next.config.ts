import type { NextConfig } from "next";

// NEXT_PUBLIC_DEPLOY_TARGET options:
//   ghpages   – static export for GitHub Pages
//   cloudflare – edge build via OpenNext + Wrangler (no static output)
//   (unset)    – standard Next.js server
const deployTarget = (process.env.NEXT_PUBLIC_DEPLOY_TARGET as
  | "ghpages"
  | "cloudflare"
  | undefined) ?? "cloudflare";
const isGhPages = deployTarget === "ghpages";
const isCloudflare = deployTarget === "cloudflare";

const nextConfig: NextConfig = {
  // Static export only for GitHub Pages; Cloudflare uses the OpenNext edge worker.
  ...(isGhPages && { output: "export" }),
  basePath: isGhPages ? "/MoneyTrackingApp" : "",
  assetPrefix: isGhPages ? "/MoneyTrackingApp" : "",
  images: {
    // Cloudflare image resizing is handled by OpenNext; unoptimized only for static exports.
    unoptimized: isGhPages || isCloudflare,
  },
  reactStrictMode: true,
};

export default nextConfig;
