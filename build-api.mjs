// Build script for Vercel — pre-bundles api/index.ts to api/index.mjs
// Avoids Vercel's default bundler hitting top-level await in @terminal3/t3n-sdk
import { build } from "esbuild";

await build({
  entryPoints: ["api/index.ts"],
  bundle: true,
  platform: "node",
  target: "node22",
  format: "esm",
  outfile: "api/index.mjs",
  external: [
    "node:*",
    "path", "fs", "os", "crypto", "http", "https", "stream",
    "util", "events", "buffer", "url", "zlib", "net", "tls",
    "assert", "child_process", "worker_threads", "perf_hooks", "v8",
    "@libsql/client", "@libsql/*",
  ],
  banner: {
    js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);",
  },
  logLevel: "info",
});
