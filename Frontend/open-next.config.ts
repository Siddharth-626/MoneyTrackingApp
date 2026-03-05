import type { OpenNextConfig } from "@opennextjs/cloudflare";

// OpenNext configuration for Cloudflare Workers.
// See: https://opennext.js.org/cloudflare
const config: OpenNextConfig = {
  default: {
    override: {
      // Use Cloudflare KV for incremental cache (ISR).
      // Requires a KV namespace binding named "NEXT_CACHE_WORKERS_KV" in wrangler.jsonc.
      incrementalCache: "dummy",
      tagCache: "dummy",
      queue: "dummy",
    },
  },
};

export default config;
