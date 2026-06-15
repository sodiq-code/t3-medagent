# Vercel Deployment — Status

## ✅ DONE

1. **`vercel.json`** — created at repo root
   - buildCommand: `cd packages/web && vite build && cp wasm || true`
   - outputDirectory: `packages/web/dist`
   - installCommand: `bun install`
   - rewrites: `/api/*` → `api/index` serverless function
   - runtime: nodejs22.x

2. **`api/index.ts`** — Vercel serverless entry point
   - Uses `hono/vercel` adapter (`handle(app)`)
   - Imports Hono app from `packages/web/src/api/index.ts`

3. **`@terminal3/t3n-sdk` workspace stub → npm `^3.6.0`**
   - Was: `workspace:../t3n-sdk` (no dist, broken)
   - Now: real npm v3.6.0 with dist/
   - Fixed in: `packages/web/package.json`

4. **Vite build passes** — 2.62s, 1829 modules, no errors

---

## ⚠️ REQUIRED: Vercel Environment Variables

Set these in Vercel Dashboard → Project → Settings → Environment Variables:

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | ✅ CRITICAL | Must be `libsql://...turso.io` remote URL, NOT `file:./dev.db` |
| `DATABASE_AUTH_TOKEN` | ✅ CRITICAL | Turso auth token |
| `T3N_AGENT_PRIVATE_KEY` | ✅ CRITICAL | Hex private key for T3 agent wallet |
| `T3N_NODE_URL` | Optional | Defaults to `https://cn-api.sg.testnet.t3n.terminal3.io` |
| `T3N_TENANT_SCRIPT_NAME` | Optional | Defaults to `medagent-health` |
| `AI_GATEWAY_BASE_URL` | Optional | AI proxy base URL |
| `AI_GATEWAY_API_KEY` | Optional | AI proxy key |

---

## ℹ️ KNOWN RUNTIME BEHAVIORS ON VERCEL

- **WASM contract boot** (`bootPublishContract`) — only ran in `server.ts` (Bun),
  which is NOT used on Vercel. The serverless entry goes directly to the Hono app.
  The WASM contract will NOT auto-publish on cold start. Routes gracefully fall back
  to simulation mode if contract hasn't been published.

- **Singleton clients** (`_t3nClient`, `_tenantClient`) — reset on every cold start
  (serverless is stateless). This is fine; they re-initialize on demand.

- **DB connection** — `@libsql/client` works with Turso remote URLs in Node.js.
  Will fail if `DATABASE_URL` is unset or points to a local file.

---

## DEPLOYMENT STEPS

1. Push to GitHub
2. Connect repo to Vercel (or `vercel --prod` CLI)
3. Set all env vars above in Vercel dashboard
4. Deploy — Vercel will run `bun install` then the build command
5. Run DB migrations on Turso:
   ```
   cd packages/web && bun run db:migrate
   ```
