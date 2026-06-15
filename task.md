# Vercel Deploy Debug

## Status
- Frontend: WORKING (HTML serves fine)  
- API function: FUNCTION_INVOCATION_FAILED on every call

## Root cause candidates (most likely first)
1. **t3n-sdk top-level await** — dist/wasm/generated/session.js has `await $init` at top level. ESM top-level await in a dependency can crash Node.js 22 serverless if not handled.
2. **@libsql/client native binary** — uses libsql (Rust/neon native addon). Vercel must support this but it needs the right native binary for Linux x64.
3. **hono/vercel adapter** — might need edge runtime, not nodejs22.x

## What we've tried
- Lazy DB init ✓
- Hoist deps to root ✓  
- Switch model from gpt-4o-mini to llama ✓

## Next steps
1. Try a minimal api/index.ts that doesn't import t3-agent or db — just returns JSON
   → If this works, the issue is in a specific import
2. If minimal works, add imports one by one to find the crash
3. OR: switch to edge runtime (hono/vercel supports both)
