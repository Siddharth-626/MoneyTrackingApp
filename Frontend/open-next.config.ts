import type { OpenNextConfig } from "@opennextjs/cloudflare";

// OpenNext configuration for Cloudflare Workers.
// See: https://opennext.js.org/cloudflare
const config: OpenNextConfig = {
  default: {
    override: {
      wrapper: "cloudflare-node",
      converter: "edge",
      proxyExternalRequest: "fetch",
      // Use Cloudflare KV for incremental cache (ISR).
      // Requires a KV namespace binding named "NEXT_CACHE_WORKERS_KV" in wrangler.jsonc.
      incrementalCache: "dummy",
      tagCache: "dummy",
      queue: "dummy",
    },
  },
  edgeExternals: ["node:crypto"],
  middleware: {
    external: true,
    override: {
      wrapper: "cloudflare-edge",
      converter: "edge",
      proxyExternalRequest: "fetch",
      incrementalCache: "dummy",
      tagCache: "dummy",
      queue: "dummy",
    },
  },
};

export default config;
