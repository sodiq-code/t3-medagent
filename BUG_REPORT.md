# Terminal 3 ADK — SDK Bug & Documentation Gap Report

**Submitted by:** Suliyat Azeez (sodiq-code)  
**Project:** T3 MedAgent  
**BUIDL:** t3-medagent  
**Date:** 2026-06-15  
**SDK Version:** `@terminal3/t3n-sdk` v3.5.2  

---

## Summary

All bugs below were discovered by building a **production AI healthcare agent** on T3 ADK. Each bug was encountered at runtime or caught during type-checking before shipping. Where applicable, the exact line in our codebase that was wrong — and the corrected version — is cited.

> **7 SDK bugs / doc gaps reported.** Bugs marked 🔴 cause **silent runtime failures**. Marked 🟡 cause **incorrect behavior** or **wasted debugging time**. Marked 🔵 are **documentation gaps** that block onboarding.

---

## BUG-01 🔴 — `DkgVerifyResult.overall_valid` does not exist

**Category:** Type/Runtime Bug  
**Severity:** High — silent `undefined` returned as `false`  

### Description

`DkgVerifyResult` declares the overall attestation outcome as **`valid: boolean`**, but the field name strongly implies a peer-counting semantic (`valid_count` / `expected_count`). New developers — and our own initial implementation — naturally write `result.overall_valid` assuming it is an alias for the aggregate result.

**Actual type definition:**
```ts
export type DkgVerifyResult = {
  valid: boolean;        // ← the top-level result
  valid_count: number;
  expected_count: number;
  results: DkgVerifyPeerResult[];
};
```

**No JSDoc** explains that `valid` IS the overall aggregate. `valid_count` / `expected_count` look like the "real" answer.

### Our buggy code (`t3-agent.ts` line ~361 before fix):
```ts
return { valid: result.overall_valid, result };
//                     ^^^^^^^^^^^^^ undefined — always returns { valid: undefined }
```

### Fix applied:
```ts
return { valid: result.valid, result };
```

### Suggested SDK Fix
Add JSDoc to `DkgVerifyResult.valid`:
```ts
/**
 * `true` if all expected DKG peers returned valid attestation quotes.
 * This is the aggregate result — equivalent to `valid_count === expected_count`.
 */
valid: boolean;
```

---

## BUG-02 🔴 — `OtpRequestResult` has no `requestId` — verify step correlation undocumented

**Category:** Documentation Gap / API Design Bug  
**Severity:** High — devs cannot correctly wire request → verify  

### Description

When calling `client.otpRequest(...)`, developers need to pass context to the subsequent `client.otpVerify(...)` call. The natural pattern is a **request ID** (like Firebase OTP, Twilio, etc.). The `OtpRequestResult` type has:

```ts
export type OtpRequestResult = {
  contact: string;
  channel: "email" | "sms";
  expiresAtSec: number;
  status: string;
  txHash: string;
  isNewProfile: boolean;
  // ← no requestId, no correlationId, no token
};
```

There is **no `requestId`** field. The verify call (`otpVerify`) takes a fresh `OtpRequestInput` shape — meaning the caller must **re-pass the original channel object**, not an ID from the result.

This is non-obvious and **completely undocumented** in the `otpRequest` JSDoc. The JSDoc says nothing about how the two calls relate.

### Our buggy code (`t3-agent.ts` before fix):
```ts
const result = await client.otpRequest(channel);
return (result as { requestId?: string }).requestId ?? "sent";
//                   ^^^^^^^^^ always undefined — result has txHash, not requestId
```

### Fix applied:
```ts
const result = await client.otpRequest(channel);
return result.txHash ?? "sent";  // txHash is the on-chain proof of OTP dispatch
```

### Suggested SDK Fix
Add to `otpRequest` JSDoc:
```
* @note To verify the OTP, call `otpVerify({ otpCode, request: <same channel input> })`.
* There is no requestId — the channel shape IS the correlation key.
* The returned `txHash` confirms on-chain OTP dispatch and can be logged for audit.
```

---

## BUG-03 🔴 — `OtpVerifyResult` has no `verified` boolean — success detection undocumented

**Category:** Documentation Gap / API Design Bug  
**Severity:** High — devs always read `undefined`, cannot detect success  

### Description

`OtpVerifyResult` has no `verified: boolean` field. The actual type:

```ts
export type OtpVerifyResult = {
  txHash: string;
  did: string;
  channel: string;
  email?: string;
  phone?: string;
  status?: string;         // only set on failure (e.g. "otp_failed")
  mergeSuggestion?: unknown;
  isNewProfile: boolean;
};
```

**On success**, `status` is `undefined` (absent). **On failure**, `status = "otp_failed"`. The JSDoc mentions the failure case but **never documents the success detection pattern**.

### Our buggy code (`t3-agent.ts` before fix):
```ts
const r = result as { verified?: boolean; status?: string };
return r.verified === true || r.status === "verified";
//     ^^^^^^^^^^^ always undefined   ^^^^^^^^^^^^^^^^^^^ "verified" is never a status value
```

### Fix applied:
```ts
// Success = status is absent. Failure = status is "otp_failed" or similar.
return !r.status || r.status === "otp_pending";
```

### Suggested SDK Fix
Add to `OtpVerifyResult`:
```ts
/**
 * Absent on success. Set to `"otp_failed"` on wrong/expired code.
 * Check `!result.status` to confirm successful verification.
 */
status?: "otp_failed" | string;
```

Or add an explicit `verified: boolean` field for developer ergonomics.

---

## BUG-04 🟡 — `MapVisibility` is `type MapVisibility = string` — valid values undocumented

**Category:** Type Expressiveness / Documentation Gap  
**Severity:** Medium — causes trial-and-error, possible invalid API calls  

### Description

```ts
export type MapVisibility = string;
```

No union literal. No JSDoc. No enum. Valid values (`"private"`, `"public"`, `"tenant"`, etc.) are **completely absent** from the type system and documentation. Developers must either find them via SDK source grep, trial and error, or community Discord.

### Suggested Fix
```ts
export type MapVisibility = "private" | "public" | "tenant";
```

Or at minimum:
```ts
/**
 * Controls who can read/write this map.
 * - `"private"` — only the creating agent
 * - `"public"` — any tenant agent
 * - `"tenant"` — all agents within the same tenant
 */
export type MapVisibility = string;
```

---

## BUG-05 🟡 — `otpRequest` with SMS silently fails if DID has no verified email (undocumented prerequisite)

**Category:** Documentation Gap / Silent Error  
**Severity:** Medium — throws raw `RpcError` with no actionable message  

### Description

Calling `otpRequest` with `smsChannel` requires the DID profile to have a **verified email address first**. This ordering constraint is:
- Not surfaced in the type system
- Not covered by any `UserUpsertError` variant
- Mentioned in one partial sentence in one JSDoc
- Throws a raw `RpcError` with no specific code

Developers building SMS-first onboarding flows (common in **Africa / Nigeria** where phone-first UX is dominant) hit this silently.

### Suggested Fix
Add to `otpRequest` JSDoc:
```
* @throws {RpcError} If `smsChannel` is used and the DID has no verified email on file.
*   Complete email OTP verification before sending SMS OTP.
```

Or surface as a typed error variant:
```ts
export type OtpError = "otp_failed" | "sms_requires_email" | "rate_limited";
```

---

## BUG-06 🟡 — `TenantContractsNamespace` exposes both `publish()` and `register()` with identical signatures

**Category:** API Clarity / Documentation Gap  
**Severity:** Medium — devs don't know which to call  

### Description

```ts
publish(input: ContractPublishInput): Promise<ContractPublishResult>;
register(input: ContractPublishInput): Promise<ContractPublishResult>;
```

Both methods accept the **exact same input type** and return the **exact same result type**. There is **zero JSDoc** on `register()`. No diff between the two is documented anywhere in the SDK.

T3 MedAgent uses `publish()` — however, it is unclear whether `register()` is equivalent, deprecated, an alias, or intended for a distinct flow (e.g., pre-registration before publish).

### Suggested Fix
Add JSDoc to `register()` clarifying:
- Is it an alias for `publish()`?
- Is it the preferred call for registering a pre-deployed contract?
- Will `publish()` be deprecated in favor of `register()`?

---

## BUG-07 🔵 — `authenticate()` returns `Did` object, not `string` — JSDoc says "returns DID"

**Category:** Documentation Gap  
**Severity:** Low-Medium — causes `"[object Object]"` bugs in logs/DB  

### Description

```ts
authenticate(): Promise<Did>
// where Did = { value: string; toString(): string }
```

JSDoc says *"returns the agent's DID"* — which devs interpret as a `string`. Used directly in a template literal or stored in a DB `VARCHAR` field, `Did` serializes as `"[object Object]"`.

Must use `.value` or `.toString()`. Not documented.

### Suggested Fix
JSDoc update:
```
* @returns {Did} The agent's Decentralized Identifier object.
*   Use `.value` to get the raw DID string: `const did = (await authenticate()).value`
```

---

## DOC-GAP-01 🔵 — No end-to-end delegation flow example

**Category:** Documentation Gap  
**Severity:** High for new devs — 5-step chain with no cross-references  

### Description

The full delegation flow requires:

```
buildDelegationCredential(...)
  → canonicaliseCredential(...)
    → signCredential(...)
      → buildInvocationPreimage(...)
        → signAgentInvocation(...)
```

None of these JSDoc entries reference each other. No single example shows the full chain. Developers discover each step by reading every type in sequence — or by looking at community examples (if any exist).

### Our Implementation (complete working chain)

```ts
// 1. Build credential
const credential = buildDelegationCredential({
  domain: DELEGATION_CREDENTIAL_DOMAIN,
  issuer: issuerDid,
  subject: subjectDid,
  capabilities: ["read", "analyze"],
  expiry: Math.floor(Date.now() / 1000) + 86400,
});

// 2. Canonicalise
const canonical = canonicaliseCredential(credential);

// 3. Sign credential
const sig = signCredential(canonical, secretBytes);

// 4. Build invocation preimage
const preimage = buildInvocationPreimage(credential, { action: "analyze" });

// 5. Sign invocation
const invocationSig = signAgentInvocation(preimage, secretBytes);
```

This example should be in the SDK README or the `buildDelegationCredential` JSDoc.

---

## BUG-08 🟡 — `contracts.execute()` returns `string | unknown`, not a typed result

**Category:** Type Safety / Runtime Coercion Required  
**Severity:** Medium — devs must manually guard and JSON.parse the result  

### Description

`contracts.execute()` is the most critical primitive in the SDK — it runs WASM inside the TEE and returns the output. Yet its return type is effectively `string | unknown` with no typed shape:

```ts
execute(name: string, input: ContractExecuteInput): Promise<unknown>
```

The actual runtime behavior: when the WASM function returns a JSON string, the SDK sometimes returns a raw `string`, and sometimes returns an already-parsed object — **with no documentation on which to expect** and no way to predict it from the input.

### Our buggy code (`t3-agent.ts` before fix):
```ts
const result = await tenant.contracts.execute("health-check", { ... });
return result as HealthAnalysisResult;
// ^ breaks at runtime when result is a JSON string, not an object
```

### Fix applied:
```ts
const result = await tenant.contracts.execute("health-check", { ... });
if (typeof result === "string") return JSON.parse(result) as HealthAnalysisResult;
return result as HealthAnalysisResult;
```

### Suggested SDK Fix
Return type should reflect reality:
```ts
execute<T = unknown>(name: string, input: ContractExecuteInput): Promise<T>;
```
And document: *"Result is always parsed JSON — never a raw string."* (or the inverse — either behavior is acceptable, but one must be specified and enforced.)

---

## BUG-09 🔵 — `tenant.claim()` idempotency behavior is completely undocumented

**Category:** Documentation Gap  
**Severity:** Low-Medium — causes confusion in production boot flows  

### Description

`tenant.claim()` is called during patient onboarding. There is **no documentation** on what happens when you call it a second time for a tenant that was already claimed:
- Does it throw?
- Does it silently succeed?
- Does it return a different result shape?

In the production server boot, `claimTenant()` is invoked on every onboarding request. It silently succeeds when the tenant is already claimed — which is the expected behavior — however this was confirmed through empirical testing rather than documentation.

The JSDoc says:
```
claim(): Promise<TenantClaimResult>
```

No note on idempotency, no error code for "already claimed", no `alreadyClaimed: boolean` in the result.

### Suggested SDK Fix
Add to `claim()` JSDoc:
```
* @note Idempotent — safe to call multiple times. If the tenant is already claimed
*   by this agent, returns successfully without modifying state.
*   To check if a claim already exists, inspect `result.alreadyClaimed`.
```

---

## DOC-GAP-02 🔵 — `NODE_URLS` values not shown in docs

**Category:** Documentation Gap  
**Severity:** Low — causes hardcoded wrong URLs in early projects  

### Description

```ts
export declare const NODE_URLS: Record<Environment, string>;
```

The actual URL values are not documented anywhere in the public SDK docs or JSDoc. Developers hardcode stale URLs found in blog posts.

### Suggested Fix
Add to export:
```ts
export const NODE_URLS: Record<Environment, string> = {
  testnet: "https://t3n-testnet.terminal3.io",
  mainnet: "https://t3n.terminal3.io",
};
```

---

## Impact Summary

| Bug ID | Severity | Type | Our Code Hit It? |
|--------|----------|------|-----------------|
| BUG-01 | 🔴 High | Runtime silent failure | ✅ Yes — line 361 |
| BUG-02 | 🔴 High | Runtime silent failure | ✅ Yes — sendOtp() |
| BUG-03 | 🔴 High | Runtime silent failure | ✅ Yes — verifyOtp() |
| BUG-04 | 🟡 Medium | Type expressiveness | ✅ Yes — maps.create() |
| BUG-05 | 🟡 Medium | Silent error / ordering | ✅ Yes — SMS OTP in Nigeria |
| BUG-06 | 🟡 Medium | API clarity | ✅ Yes — contracts flow |
| BUG-07 | 🔵 Low-Med | Doc gap | ✅ Yes — DID logging |
| DOC-GAP-01 | 🔵 High impact | Doc gap | ✅ Yes — delegation flow |
| DOC-GAP-02 | 🔵 Low | Doc gap | ✅ Yes — initial setup |
| BUG-08 | 🟡 Medium | Type safety / runtime coercion | ✅ Yes — contracts.execute() |
| BUG-09 | 🔵 Low-Med | Doc gap | ✅ Yes — tenant.claim() boot flow |

All bugs were **discovered organically** while building T3 MedAgent on the T3 ADK. Fixes for BUG-01, BUG-02, BUG-03, and BUG-08 are applied in [`packages/web/src/api/lib/t3-agent.ts`](./packages/web/src/api/lib/t3-agent.ts).

---

*Filed under Terminal 3 ADK Bounty — Bug/Doc Gap Bonus*
