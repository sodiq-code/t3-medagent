# T3 MedAgent — Build Progress

## Status: CORE WORKING ✅

### Completed
- [x] T3 SDK installed (workspace package)
- [x] `t3-agent.ts` — all 17 SDK primitives, lazy env readers, correct signatures
  - `buildInvocationPreimage(vcId: Uint8Array, nonce: Uint8Array, reqHash: Uint8Array)` ✅
  - `signAgentInvocation(preimage, secret)` ✅
  - `canonicaliseCredential` — static import ✅
  - NONCE_LEN=16, REQUEST_HASH_LEN=32, VC_ID_LEN=16, AGENT_PUBKEY_LEN=33 ✅
  - Lazy env readers (privKey, nodeUrl, scriptName) — fixes Vite SSR init-time issue ✅
  - DID unwrap: `d.did ?? d.value` ✅
- [x] DB schema pushed to Turso ✅
- [x] Correct T3 testnet URL: `https://cn-api.sg.testnet.t3n.terminal3.io` ✅
- [x] TypeScript: 0 errors ✅
- [x] Dev server: port 4200 ✅
- [x] API endpoints verified:
  - GET  /api/health/status  → agentAddress populated ✅
  - POST /api/health/init    → DID = did:t3n:189f... ✅
  - POST /api/health/analyze → simulation result ✅
  - POST /api/delegate/create → credential + DB insert ✅
- [x] BigInt JSON serialization fix in delegate route ✅

### In Progress
- [ ] Test /api/onboard/*, /api/audit/* endpoints
- [ ] Verify all 6 frontend pages render correctly
- [ ] Write README.md for DoraHacks submission
- [ ] Push to GitHub (sodiq-code/t3-medagent)
- [ ] Optional: Rust WASM health contract

### Known Issues
- DelegationCredential `user_did` shows agent address DID (not post-auth DID) 
  because delegation is called before /health/init — acceptable for demo
- tenant.claim() returns "already-claimed" — tenant exists, not an error
- contracts.execute() falls back to simulation (testnet TEE may not have contract deployed)

### Key Constants (SDK)
- NONCE_LEN = 16
- VC_ID_LEN = 16  
- REQUEST_HASH_LEN = 32
- AGENT_PUBKEY_LEN = 33
- buildInvocationPreimage(vcId, nonce, reqHash) — 3 positional args
- signAgentInvocation(preimage, secret) — 2 args

### T3 Testnet
- URL: https://cn-api.sg.testnet.t3n.terminal3.io
- Agent DID: did:t3n:189f1ffd70bbf6123ee091b0e0679602ff6219d3
- Agent ETH: 0x171a19881db8bc543752abb94047a894e957f350
