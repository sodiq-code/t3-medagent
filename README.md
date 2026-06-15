# T3 MedAgent — Privacy-Preserving AI Health Navigator

> **Built for the Terminal 3 ADK Bounty Challenge (Launch Ed)**  
> Track: Healthcare / Privacy-First AI Agents

---

## Overview

T3 MedAgent is a full-stack AI health agent that runs symptom analysis inside a **Trusted Execution Environment (TEE)** using the Terminal 3 network. Patient data is cryptographically sealed — the agent never exposes raw health inputs outside the TEE.

**Live Demo:** https://t3medag-q6kyvag-preview-4200.runable.site/

---

## Architecture

```
User Browser
     │
     ▼
React Frontend (Vite + Tailwind)
     │
     ▼ /api/*
Hono API Server (Node.js / Bun)
     │
     ├──► Terminal 3 TEE Node  (handshake → authenticate → contracts.execute)
     ├──► T3 Maps              (patient KV store, private visibility)
     ├──► T3 Tenant            (claimed: medagent-health)
     ├──► T3 Delegation VC     (buildDelegationCredential + signAgentInvocation)
     └──► Turso (libSQL)       (audit trail, delegation records)
```

---

## Terminal 3 SDK Integration — All 17 Primitives

| # | Primitive | Usage in T3 MedAgent |
|---|-----------|----------------------|
| 1 | `setEnvironment("testnet")` | Boot-time network selection |
| 2 | `loadWasmComponent()` | WASM crypto bootstrap for secp256k1 |
| 3 | `eth_get_address(privateKey)` | Derive agent wallet `0x171a...f350` |
| 4 | `metamask_sign(addr, _, key)` | EIP-191 signing handler for session auth |
| 5 | `client.handshake()` | ECDH key exchange with T3 testnet node |
| 6 | `client.authenticate(createEthAuthInput)` | ETH → DID binding → `did:t3n:189f...` |
| 7 | `tenant.claim()` | Claim `medagent-health` tenant namespace |
| 8 | `maps.create({ tail, visibility:"private" })` | Per-patient encrypted KV store |
| 9 | `contracts.publish({ tail, version, wasm })` | Deploy health-check WASM to TEE |
| 10 | `contracts.execute("health-check", { functionName, input })` | TEE symptom analysis |
| 11 | `contracts.logs("health-check", { sinceSeq, limit })` | Immutable audit trail |
| 12 | `buildDelegationCredential({ user_did, agent_pubkey, functions, ... })` | Issue delegation VC |
| 13 | `signAgentInvocation(preimage, secretBytes)` | Sign invocation preimage |
| 14 | `client.otpRequest({ emailChannel })` | Identity OTP via email/SMS |
| 15 | `client.otpVerify({ otpCode, request })` | OTP verification gate |
| 16 | `client.submitUserInput({ profile, becomeDevTenant })` | Patient profile submission |
| 17 | `verifyDkgAttestation(key, msg, peerIds, quotes)` | TEE node attestation verification |

**Supporting primitives also used:**
- `canonicaliseCredential(credential)` — JCS canonical bytes for VC signing
- `signCredential(jcsBytes, secretKey)` — agent credential self-signing
- `buildInvocationPreimage(vcId, nonce, reqHash)` — delegation preimage construction
- `fetchDkgAttestation(nodeUrl)` + `fetchMlKemPublicKey(nodeUrl)` — attestation fetch
- `createEthAuthInput(address)` — ETH auth input builder
- `DELEGATION_CREDENTIAL_DOMAIN`, `generateUUID`, `setGlobalLogLevel` — utilities

---

## Features

### 1. AI Symptom Analysis in TEE
- Submit symptoms → `contracts.execute()` runs analysis inside TEE
- Risk levels: `low / medium / high / critical`
- Graceful simulation fallback when TEE unavailable
- Results persisted to Turso audit DB

### 2. Patient Onboarding with T3 Identity
- OTP-gated identity verification (`otpRequest` + `otpVerify`)
- Patient profile submitted via `submitUserInput`
- Per-patient T3 Map created (`maps.create`, private visibility)
- DID issued on authentication

### 3. Agent Delegation Credentials
- Full delegation VC flow: `buildDelegationCredential` → `canonicaliseCredential` → `signCredential` → `signAgentInvocation`
- Correct SDK constants enforced: `NONCE_LEN=16`, `VC_ID_LEN=16`, `REQUEST_HASH_LEN=32`, `AGENT_PUBKEY_LEN=33`
- Function-scoped: agent authorized for specific health functions only
- Delegation records stored on-chain (Turso) with revocation support

### 4. Immutable Audit Trail
- All contract executions logged via `contracts.logs()`
- Audit events synced to DB and surfaced in UI
- Filterable by level (info / debug / error)

### 5. TEE Node Attestation Verification
- Calls `fetchDkgAttestation` + `fetchMlKemPublicKey` + `verifyDkgAttestation`
- Verifies T3 node is running genuine TEE hardware
- Exposed in `/verify` page with live verification flow

---

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing — value prop, SDK features, CTA |
| `/onboard` | Patient identity flow (OTP + profile) |
| `/dashboard` | AI health agent chat interface |
| `/audit` | Contract execution audit log |
| `/delegation` | Delegation VC management |
| `/verify` | TEE node attestation verification |

---

## Tech Stack

- **Frontend:** React 19, Vite 7, Tailwind CSS 4, Wouter, TanStack Query
- **Backend:** Hono (Node.js/Bun), Drizzle ORM, Turso/libSQL
- **T3 SDK:** `@terminal3/t3n-sdk` v3.5.2 — 17+ primitives used
- **Fonts:** Syne (headings), Inter (body), JetBrains Mono (code)
- **Design:** Dark navy `#0A0F1E`, Cyan `#00D4FF`, Violet `#7C3AED`

---

## Running Locally

```bash
git clone https://github.com/sodiq-code/t3-medagent
cd t3-medagent
bun install

# Set environment variables
cat > .env << EOF
T3N_AGENT_PRIVATE_KEY=<your-secp256k1-private-key>
T3N_NODE_URL=https://cn-api.sg.testnet.t3n.terminal3.io
T3N_TENANT_SCRIPT_NAME=medagent-health
DATABASE_URL=<your-turso-url>
DATABASE_AUTH_TOKEN=<your-turso-token>
EOF

# Push DB schema
cd packages/web && bun --env-file=../../.env run db:push

# Start dev server
bun --env-file=../../.env run dev --port 4200
```

---

## Agent DID

```
Agent ETH Address: 0x171a19881db8bc543752abb94047a894e957f350
Agent DID:         did:t3n:189f1ffd70bbf6123ee091b0e0679602ff6219d3
Network:           testnet (cn-api.sg.testnet.t3n.terminal3.io)
Tenant:            medagent-health
```

---

## SDK Bug Report (Bonus)

While building T3 MedAgent we hit **7 real SDK bugs and documentation gaps** — three of which caused silent runtime failures in our production code. All have been documented with type-level proof, real code examples showing the wrong pattern, and the correct fix applied.

**→ [Read the full bug report: BUG_REPORT.md](./BUG_REPORT.md)**

| Bug | Severity | Description |
|-----|----------|-------------|
| BUG-01 | 🔴 High | `DkgVerifyResult.overall_valid` doesn't exist — should be `.valid` |
| BUG-02 | 🔴 High | `OtpRequestResult` has no `requestId` — verify correlation undocumented |
| BUG-03 | 🔴 High | `OtpVerifyResult` has no `verified` field — success detection undocumented |
| BUG-04 | 🟡 Medium | `MapVisibility` is untyped `string` — valid values undocumented |
| BUG-05 | 🟡 Medium | SMS OTP silently fails without prior email verification (critical for Africa) |
| BUG-06 | 🟡 Medium | `contracts.publish()` vs `contracts.register()` — identical signatures, zero docs |
| BUG-07 | 🔵 Low | `authenticate()` returns `Did` object not `string` — causes `[object Object]` bugs |
| DOC-GAP-01 | 🔵 High | No end-to-end delegation flow example across 5 chained functions |
| DOC-GAP-02 | 🔵 Low | `NODE_URLS` values not shown anywhere in docs |

---

## Why T3 MedAgent Wins

1. **Highest SDK depth** — 17 primitives + 6 supporting functions, all exercised in real flows
2. **Domain fit** — healthcare is the #1 use case for TEE privacy: HIPAA-adjacent data stays encrypted
3. **Complete product** — not a demo script; a full web app with DB, auth, audit, delegation
4. **Delegation flow** — one of the hardest SDK paths implemented correctly with proper byte-length constants
5. **Graceful fallbacks** — TEE unavailable? Simulation mode. OTP down? Clear error. Node unreachable? Fallback URL from `NODE_URLS`.
6. **Attestation verification** — bonus primitive (#17) implemented and surfaced in UI

---

*Built with Terminal 3 SDK v3.5.2 | June 2026*
