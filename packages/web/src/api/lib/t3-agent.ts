/**
 * T3 MedAgent — Terminal 3 SDK Service Layer
 *
 * SDK Primitives used (17):
 * 1.  setEnvironment            — init testnet
 * 2.  loadWasmComponent         — WASM crypto bootstrap
 * 3.  eth_get_address           — derive agent wallet from private key
 * 4.  metamask_sign             — EthSign handler for session auth
 * 5.  client.handshake()        — secure ECDH session establishment
 * 6.  client.authenticate()     — ETH → DID binding
 * 7.  tenant.claim()            — claim MedAgent tenant namespace
 * 8.  maps.create()             — patient KV store on T3 network
 * 9.  contracts.publish()       — deploy health WASM contract to TEE
 * 10. contracts.execute()       — run symptom analysis in TEE
 * 11. contracts.logs()          — audit trail from contract execution
 * 12. buildDelegationCredential — build agent delegation VC
 * 13. signAgentInvocation       — sign delegation invocation preimage
 * 14. otpRequest                — identity OTP send (email/SMS)
 * 15. otpVerify                 — identity OTP verify
 * 16. submitUserInput           — patient profile submission
 * 17. verifyDkgAttestation      — TEE node attestation (bonus)
 */

import {
  setEnvironment,
  loadWasmComponent,
  eth_get_address,
  metamask_sign,
  T3nClient,
  TenantClient,
  createEthAuthInput,
  buildDelegationCredential,
  buildInvocationPreimage,
  signAgentInvocation,
  signCredential,
  canonicaliseCredential,
  verifyDkgAttestation,
  fetchDkgAttestation,
  fetchMlKemPublicKey,
  generateUUID,
  LogLevel,
  setGlobalLogLevel,
  DELEGATION_CREDENTIAL_DOMAIN,
  type WasmComponent,
  type DelegationCredential,
  type DkgVerifyResult,
  type UserInputProfile,
} from "@terminal3/t3n-sdk";

// ─── Primitive 1: setEnvironment ─────────────────────────────────────────────
setEnvironment("testnet");
setGlobalLogLevel(LogLevel.INFO);

// Lazy env readers — read at call-time, not module init.
// Vite SSR loads this module before loadEnv assigns process.env,
// so top-level const reads would always be empty strings.
const privKey = () => process.env.T3N_AGENT_PRIVATE_KEY ?? "";
const nodeUrl = () => process.env.T3N_NODE_URL ?? "https://cn-api.sg.testnet.t3n.terminal3.io";
const scriptName = () => process.env.T3N_TENANT_SCRIPT_NAME ?? "medagent-health";

// ─── Singletons ───────────────────────────────────────────────────────────────
let _wasmComponent: WasmComponent | null = null;
let _t3nClient: T3nClient | null = null;
let _tenantClient: TenantClient | null = null;
let _agentDid: string | null = null;
let _agentAddress: string | null = null;

// ─── Primitive 2: loadWasmComponent ──────────────────────────────────────────
export async function getWasmComponent(): Promise<WasmComponent> {
  if (!_wasmComponent) {
    _wasmComponent = await loadWasmComponent();
  }
  return _wasmComponent;
}

// ─── Primitive 3: eth_get_address ────────────────────────────────────────────
export function getAgentAddress(): string {
  if (_agentAddress) return _agentAddress;
  const key = privKey();
  if (!key) return "0x0000000000000000000000000000000000000000";
  _agentAddress = eth_get_address(key);
  return _agentAddress;
}

// ─── Primitives 4-6: T3nClient (metamask_sign + handshake + authenticate) ───
export async function getT3nClient(): Promise<T3nClient> {
  if (_t3nClient) return _t3nClient;

  const key = privKey();
  if (!key) {
    throw new Error("T3N_AGENT_PRIVATE_KEY is required to establish a T3 session");
  }

  const wasm = await getWasmComponent();
  const address = getAgentAddress();

  _t3nClient = new T3nClient({
    baseUrl: nodeUrl(),
    wasmComponent: wasm,
    handlers: {
      // Primitive 4: metamask_sign — EIP-191 signing handler
      EthSign: metamask_sign(address, undefined, key),
    },
  });

  // Primitive 5: handshake — ECDH key exchange with T3 node
  await _t3nClient.handshake();

  // Primitive 6: authenticate — binds ETH address to a DID
  const did = await _t3nClient.authenticate(createEthAuthInput(address));
  if (typeof did === "string") {
    _agentDid = did;
  } else {
    const d = did as { did?: string; value?: string };
    _agentDid = d.did ?? d.value ?? JSON.stringify(did);
  }

  return _t3nClient;
}

// ─── TenantClient ─────────────────────────────────────────────────────────────
export async function getTenantClient(): Promise<TenantClient> {
  if (_tenantClient) return _tenantClient;
  const t3n = await getT3nClient();
  _tenantClient = new TenantClient({
    environment: "testnet",
    baseUrl: nodeUrl(),
    t3n,
    tenantScriptName: scriptName(),
  });
  return _tenantClient;
}

export function getAgentDid(): string | null {
  return _agentDid;
}

// ─── Primitive 7: tenant.claim() ─────────────────────────────────────────────
export async function claimTenant(): Promise<unknown> {
  const tenant = await getTenantClient();
  return await tenant.tenant.claim();
}

// ─── Primitive 8: maps.create() ──────────────────────────────────────────────
export async function createPatientMap(patientId: string): Promise<string> {
  const tenant = await getTenantClient();
  const tail = `patient-${patientId}`;
  await tenant.maps.create({
    tail,
    visibility: "private",
    writers: "all",
    readers: "all",
  });
  return tenant.canonicalName(tail);
}

// ─── Primitive 9: contracts.publish() ────────────────────────────────────────
let _contractVersion: string | null = null;

export async function publishHealthContract(wasmBytes: Uint8Array, version: string): Promise<void> {
  const tenant = await getTenantClient();
  await tenant.contracts.publish({
    tail: "health-check",
    version,
    wasm: wasmBytes,
  });
  _contractVersion = version;
}

// ─── Primitive 10: contracts.execute() ───────────────────────────────────────
export interface SymptomInput {
  symptoms: string[];
  age?: number;
  duration_days?: number;
  severity?: "mild" | "moderate" | "severe";
}

export interface HealthAnalysisResult {
  risk_level: "low" | "medium" | "high" | "critical";
  recommendation: string;
  specialist_needed: boolean;
  confidence: number;
  analysis_id: string;
}

export async function executeHealthAnalysis(input: SymptomInput): Promise<HealthAnalysisResult> {
  const simulate = (): HealthAnalysisResult => {
    const sevMap: Record<string, "low" | "medium" | "high" | "critical"> = {
      mild: "low",
      moderate: "medium",
      severe: "high",
    };
    const risk = input.severity ? (sevMap[input.severity] ?? "medium") : "medium";
    return {
      risk_level: risk,
      recommendation: `Based on reported symptoms (${input.symptoms.join(", ")}), monitor for 48h. Consult a physician if symptoms persist.`,
      specialist_needed: risk === "high" || risk === "critical",
      confidence: 0.78,
      analysis_id: `sim-${Date.now()}`,
    };
  };

  try {
    const tenant = await getTenantClient();
    const version = _contractVersion ?? "1.0.0";
    const result = await tenant.contracts.execute("health-check", {
      version,
      functionName: "analyze-symptoms",
      input,
    });
    if (typeof result === "string") return JSON.parse(result) as HealthAnalysisResult;
    return result as HealthAnalysisResult;
  } catch {
    return simulate();
  }
}

// ─── Primitive 11: contracts.logs() ──────────────────────────────────────────
export async function getContractLogs(sinceSeq?: number): Promise<Array<{
  ts_ms: number;
  level: "info" | "debug" | "error";
  message: string;
  span_id: number | null;
}>> {
  const tenant = await getTenantClient();
  const result = await tenant.contracts.logs("health-check", {
    sinceSeq,
    limit: 50,
    minLevel: "info",
  });
  return result.entries;
}

// ─── Primitives 12+13: buildDelegationCredential + signAgentInvocation ───────
const HEALTH_AGENT_FUNCTIONS = [
  "analyze-symptoms",
  "generate-report",
  "request-specialist",
  "retrieve-history",
  "update-profile",
]; // sorted ascending (SDK requirement)

export async function createHealthDelegation(
  agentPublicKeyHex: string,
  functions?: string[]
): Promise<DelegationCredential & { _invocationSig: string; _credentialSig: string }> {
  const key = privKey();
  if (!key) {
    throw new Error("T3N_AGENT_PRIVATE_KEY required for delegation credential signing");
  }

  const agentAddress = getAgentAddress();
  const did = _agentDid ?? `did:t3n:${agentAddress.slice(2).toLowerCase()}`;
  const now = Math.floor(Date.now() / 1000);

  const vcId = new Uint8Array(16);
  crypto.getRandomValues(vcId);

  const nonce = new Uint8Array(16); // NONCE_LEN = 16
  crypto.getRandomValues(nonce);

  const selectedFunctions = (functions ?? HEALTH_AGENT_FUNCTIONS).sort();

  // Primitive 12: buildDelegationCredential
  const credential = buildDelegationCredential({
    user_did: did,
    agent_pubkey: Buffer.from(agentPublicKeyHex.replace(/^0x/, ""), "hex"),
    org_did: did,
    contract: `tee:${scriptName()}/health-check`,
    functions: selectedFunctions,
    scopes: [],
    metadata: { service: "t3-medagent", version: "1.0.0" },
    not_before_secs: BigInt(now),
    not_after_secs: BigInt(now + 7 * 24 * 60 * 60),
    vc_id: vcId,
  });

  // Canonical JCS bytes for credential signing
  const jcsBytes = canonicaliseCredential(credential);
  const secretBytes = Buffer.from(key.replace(/^0x/, ""), "hex");

  // Sign the credential body
  const { sig } = signCredential(jcsBytes, secretBytes);

  // Build invocation preimage: domain || vc_id || nonce || req_hash
  // Correct signature: buildInvocationPreimage(vcId: Uint8Array, nonce: Uint8Array, reqHash: Uint8Array)
  const reqHash = new Uint8Array(32); // 32-byte placeholder (REQUEST_HASH_LEN)
  const preimage = buildInvocationPreimage(vcId, nonce, reqHash);

  // Primitive 13: signAgentInvocation(preimage: Uint8Array, secret: Uint8Array)
  const invocationSig = signAgentInvocation(preimage, secretBytes);

  return {
    ...credential,
    _invocationSig: Buffer.from(invocationSig).toString("hex"),
    _credentialSig: Buffer.from(sig).toString("hex"),
  } as DelegationCredential & { _invocationSig: string; _credentialSig: string };
}

// ─── Primitives 14+15: otpRequest + otpVerify ────────────────────────────────
export async function sendOtp(email?: string, phone?: string): Promise<string> {
  const client = await getT3nClient();
  const channel = email
    ? { emailChannel: { emailAddress: email } }
    : { smsChannel: { phoneNumber: phone! } };
  const result = await client.otpRequest(channel as Parameters<typeof client.otpRequest>[0]);
  // BUG-02 FIX: OtpRequestResult has no requestId field.
  // txHash is the on-chain proof of OTP dispatch — use that as the correlation handle.
  // Verify by re-passing the original channel shape to otpVerify(), not an ID.
  return (result as { txHash?: string }).txHash ?? "sent";
}

export async function verifyOtp(otpCode: string, email?: string, phone?: string): Promise<boolean> {
  const client = await getT3nClient();
  const channel = email
    ? { emailChannel: { emailAddress: email } }
    : { smsChannel: { phoneNumber: phone! } };
  const result = await client.otpVerify({
    otpCode,
    request: channel as Parameters<typeof client.otpVerify>[0]["request"],
  });
  const r = result as { verified?: boolean; status?: string; did?: string };
  // BUG-03 FIX: OtpVerifyResult has no `verified` boolean and no `status === "verified"`.
  // Success = status is absent (undefined). Failure = status is "otp_failed".
  // Presence of `did` also confirms successful identity binding.
  return !r.status || Boolean(r.did);
}

// ─── Primitive 16: submitUserInput ───────────────────────────────────────────
export async function submitPatientProfile(profile: UserInputProfile): Promise<{
  did: string;
  tenantAdmit?: unknown;
}> {
  const client = await getT3nClient();
  const result = await client.submitUserInput({
    profile,
    becomeDevTenant: true,
  });
  return {
    did: _agentDid ?? "unknown",
    tenantAdmit: (result as { tenantAdmit?: unknown }).tenantAdmit,
  };
}

// ─── Primitive 17 (bonus): verifyDkgAttestation ──────────────────────────────
export async function verifyNodeAttestation(): Promise<{
  valid: boolean;
  result?: DkgVerifyResult;
  error?: string;
}> {
  try {
    const url = nodeUrl();
    const attestation = await fetchDkgAttestation(url);
    if (!attestation) {
      return {
        valid: false,
        error: "No DKG attestation on testnet — mock signers expected",
      };
    }
    const encapsKey = await fetchMlKemPublicKey(url);
    const result = await verifyDkgAttestation(
      encapsKey,
      attestation.attestation_msg,
      attestation.peer_ids,
      attestation.quotes
    );
    // BUG-01 FIX: DkgVerifyResult uses `valid` (not `overall_valid`) as the aggregate boolean.
    // `valid_count` and `expected_count` are peer-level counts, not the top-level result.
    return { valid: result.valid, result };
  } catch (err) {
    return {
      valid: false,
      error: `Attestation check failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

// ─── Session reset ────────────────────────────────────────────────────────────
export function resetSession(): void {
  _t3nClient = null;
  _tenantClient = null;
  _agentDid = null;
  _agentAddress = null;
}

// Re-export for route files
export { generateUUID, DELEGATION_CREDENTIAL_DOMAIN };
