# T3 MedAgent — Vercel Deploy Fix

## Root Cause
- `hono/vercel` `handle()` = Edge-only `(req: Request) => Response`
- Edge runtime has 1MB limit; t3n-sdk is ~1.1MB → instant crash
- Must use `nodejs22.x` runtime
- Node.js Vercel functions expect `(req: IncomingMessage, res: ServerResponse) => void`

## Fix Plan
1. Rewrite `api/index.ts` as Node.js handler (raw req/res → Web Request/Response bridge)
2. Update `vercel.json`: nodejs22.x, no edge config
3. Pre-bundle with esbuild in buildCommand so Vercel doesn't fail resolving the dep graph

## Status
- [ ] api/index.ts rewritten
- [ ] vercel.json updated
- [ ] buildCommand updated
- [ ] pushed + tested
