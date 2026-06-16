import app from "./api";
import { publishHealthContract } from "./api/lib/t3-agent";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

// ─── Guard: prevent Worker/WASM shim crashes from killing the server ──────────
// @bytecodealliance/preview2-shim spawns a worker that calls process.binding("tcp_wrap")
// which is not implemented in Bun. We catch it here to keep the server alive.
process.on("uncaughtException", (err: Error) => {
  if (String(err.message).includes("tcp_wrap") || String(err.message).includes("not implemented in Bun")) {
    console.warn("[T3] Worker shim error (non-fatal, server continues):", err.message);
    return;
  }
  // Re-throw anything else that's genuinely fatal
  console.error("[FATAL] Uncaught exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason: unknown) => {
  const msg = String(reason);
  if (msg.includes("tcp_wrap") || msg.includes("not implemented in Bun")) {
    console.warn("[T3] Worker shim rejection (non-fatal):", msg);
    return;
  }
  console.error("[WARN] Unhandled rejection:", reason);
});

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
  hostname: "0.0.0.0",
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
// Disabled in production: loadWasmComponent spawns a Worker that calls
// process.binding("tcp_wrap") which is not implemented in Bun — crashes the machine.
// The app works fine without it (simulation fallback in t3-agent.ts).
if (process.env.NODE_ENV !== "production") {
  bootPublishContract().catch(() => {});
}

function getStaticFilePath(pathname: string) {
  const cleanPath = decodeURIComponent(pathname)
    .replace(/^\/+/, "")
    .replaceAll("..", "");

  return cleanPath ? `${distDir}/${cleanPath}` : indexPath;
}
