import app from "./api";
import { publishHealthContract } from "./api/lib/t3-agent";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

// ─── Boot: auto-publish WASM health contract to T3 TEE ───────────────────────
// Runs once after server starts. Failures are non-fatal (simulation fallback).
async function bootPublishContract() {
  const wasmPaths = [
    // Deployed alongside server (copied by build)
    resolve(import.meta.dir, "health-contract.wasm"),
    // Compiled Rust target (cargo build --target wasm32-wasip2 --release)
    resolve(import.meta.dir, "../../health-contract/target/wasm32-wasip2/release/health_contract.wasm"),
    // Monorepo sibling package (pre-built fallback)
    resolve(import.meta.dir, "../../../health-contract/health-contract.wasm"),
    resolve(import.meta.dir, "../../health-contract/health-contract.wasm"),
    // Contracts dir (development copy)
    resolve(import.meta.dir, "api/contracts/health_contract.wasm"),
  ];

  let wasmBytes: Uint8Array | null = null;
  for (const p of wasmPaths) {
    if (existsSync(p)) {
      wasmBytes = new Uint8Array(readFileSync(p));
      console.log(`[T3] Loaded WASM contract from ${p} (${wasmBytes.length} bytes)`);
      break;
    }
  }

  if (!wasmBytes) {
    console.warn("[T3] WASM contract file not found — using simulation fallback");
    return;
  }

  try {
    await publishHealthContract(wasmBytes, "1.0.0");
    console.log("[T3] ✅ Health contract published to TEE (health-check v1.0.0)");
  } catch (err) {
    console.warn("[T3] Contract publish failed (T3N_AGENT_PRIVATE_KEY not set or network unavailable):", String(err));
  }
}

const port = Number(process.env.PORT ?? 3000);
const distDir = `${import.meta.dir}/../dist`;
const indexPath = `${distDir}/index.html`;

const server = Bun.serve({
  port,
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api")) {
      return app.fetch(request);
    }

    const filePath = getStaticFilePath(url.pathname);
    const file = Bun.file(filePath);

    if (await file.exists()) {
      return new Response(file);
    }

    const index = Bun.file(indexPath);
    if (await index.exists()) {
      return new Response(index, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    return new Response("Build output not found. Run `bun run build` first.", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  },
});

console.log(`Web server listening on http://localhost:${server.port}`);

// Kick off WASM contract publish in background (non-blocking)
bootPublishContract().catch(() => {});

function getStaticFilePath(pathname: string) {
  const cleanPath = decodeURIComponent(pathname)
    .replace(/^\/+/, "")
    .replaceAll("..", "");

  return cleanPath ? `${distDir}/${cleanPath}` : indexPath;
}
