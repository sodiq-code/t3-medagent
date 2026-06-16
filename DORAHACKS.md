# T3 MedAgent — DoraHacks Submission

> **Terminal 3 ADK Bounty · Turing Hackathon 2026**  
> Healthcare vertical · On-chain privacy · 17 SDK primitives

---

## Problem

Healthcare data is broken:

- Patients have **no control** over who accesses their records
- Providers rely on **centralized, breach-prone** databases
- AI health agents run on **opaque, unverifiable** infrastructure
- There is **no cryptographic audit trail** when AI touches sensitive data

The result: patients cannot trust AI with their health — and they shouldn't, under current architectures.

---

## Solution

**T3 MedAgent** is a privacy-first AI health agent built entirely on Terminal 3 primitives.

Every action is:
- **Executed inside a TEE** (Intel TDX + WASM confidential runtime)
- **Anchored to an on-chain DID** — identity never lives on our servers
- **Cryptographically auditable** — every SDK call writes to the T3 audit log
- **Delegatable** — agents can be granted time-bounded, signed access credentials

Patients onboard once. Their identity is theirs — on the T3 network forever.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        USER (Browser)                        │
│   React SPA · Hono RPC Client · Wouter Routing              │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS / RPC
┌────────────────────────▼────────────────────────────────────┐
│                    HONO API SERVER (Bun)                      │
│   /api/onboard  /api/chat  /api/audit  /api/delegation       │
│   Drizzle ORM · Turso (libSQL) · Session management          │
└────────┬───────────────┬──────────────────┬─────────────────┘
         │               │                  │
┌────────▼──────┐ ┌──────▼──────┐ ┌────────▼──────────────────┐
│  T3 SDK Layer │ │  AI Gateway │ │  Turso Database (libSQL)   │
│               │ │             │ │                            │
│  t3n-sdk      │ │  Claude /   │ │  patients · sessions ·     │
│  workspace    │ │  Llama via  │ │  audit_logs · delegations  │
│  package      │ │  T3 Gateway │ │                            │
└────────┬──────┘ └─────────────┘ └────────────────────────────┘
         │
┌────────▼──────────────────────────────────────────────────────┐
│                   TERMINAL 3 NETWORK                           │
│                                                                │
│  DID Registry · DKG Key Management · Tenant Network           │
│  WASM Confidential Runtime · On-Chain Audit Log               │
│  OTP Protocol · Maps Storage · Agent NFT (ERC-8004)           │
└────────────────────────────────────────────────────────────────┘
```

---

## 17 SDK Primitives

| # | Primitive | Where Used | Description |
|---|-----------|-----------|-------------|
| 1 | `setEnvironment` | `t3-agent.ts` init | Bootstrap T3 SDK environment |
| 2 | `loadWasmComponent` | `t3-agent.ts` init | Load WASM confidential runtime |
| 3 | `eth_get_address` | `t3-agent.ts` init | Fetch agent wallet address |
| 4 | `metamask_sign` | `t3-agent.ts` init | Sign agent registration tx |
| 5 | `handshake()` | `t3-agent.ts` init | Establish secure T3 channel |
| 6 | `authenticate()` | `t3-agent.ts` init | Authenticate agent identity |
| 7 | `tenant.claim()` | `/api/onboard/profile` | Claim tenant slot on T3 network |
| 8 | `maps.create()` | `/api/onboard/profile` | Create patient data map on-chain |
| 9 | `contracts.publish()` | `t3-agent.ts` init | Publish confidential health contract |
| 10 | `contracts.execute()` | `/api/chat` | Run health analysis inside TEE |
| 11 | `contracts.logs()` | `/api/audit` | Retrieve on-chain execution logs |
| 12 | `buildDelegationCredential` | `/api/delegation` | Create signed access credential |
| 13 | `signAgentInvocation` | `/api/delegation` | Sign agent delegation request |
| 14 | `otpRequest` | `/api/onboard/otp-request` | Send OTP via T3 protocol |
| 15 | `otpVerify` | `/api/onboard/otp-verify` | Verify OTP on-chain |
| 16 | `submitUserInput` | `/api/onboard/profile` | Submit health profile to T3 |
| 17 | `verifyDkgAttestation` | `/api/verify` | Verify TEE DKG attestation |

---

## User Flow

```
1. Patient visits /onboard
   → otpRequest() — verification code sent via T3 OTP protocol

2. Patient enters code
   → otpVerify() — identity confirmed on-chain

3. Patient fills health profile
   → submitUserInput() — profile stored on T3 network
   → maps.create()     — patient-{id} map created
   → tenant.claim()    — tenant slot claimed

4. Patient opens /dashboard
   → contracts.execute() — symptoms analyzed inside TEE
   → contracts.logs()    — audit trail written on-chain

5. Patient grants delegation
   → buildDelegationCredential() — signed credential created
   → signAgentInvocation()       — specialist agent authorized

6. Anyone verifies at /verify
   → verifyDkgAttestation() — TEE proof publicly auditable
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Bun (monorepo) |
| Frontend | Vite + React + Tailwind |
| API | Hono (type-safe RPC) |
| Database | Drizzle ORM + Turso (libSQL) |
| Identity | Terminal 3 SDK (t3n-sdk) |
| AI | Claude via T3 AI Gateway |
| Deploy | Render |

---

## Live Demo

**App:** https://t3-medagent.onrender.com

**Demo Video:** https://youtu.be/M2V3KTzdauI

### Judge walkthrough:
1. Go to `/onboard` — complete 4-step identity flow (OTP → verify → profile → done)
2. Done screen shows Patient ID, T3 Map name, DID, and SDK checklist (5 calls)
3. Open `/dashboard` — run a health query, watch TEE stream
4. Go to `/audit` — see live on-chain transaction log
5. Go to `/delegation` — create a signed specialist delegation
6. Go to `/verify` — verify TEE DKG attestation

---

## Team

**Afsod** — Full-stack engineer, Terminal 3 ADK integration

---

## Why This Wins the Bounty

1. **Breadth**: 17 of the available SDK primitives — full lifecycle coverage
2. **Depth**: Not a toy — real OTP flow, real TEE execution, real on-chain maps
3. **Vertical fit**: Healthcare is the highest-stakes use case for privacy primitives
4. **Judge UX**: Every primitive is visible — Done screen shows a live SDK checklist
5. **Auditability**: `/audit` page shows every T3 transaction in real time

---

*Built for Terminal 3 ADK Bounty · Turing Hackathon 2026*
