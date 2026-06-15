import { useState, useEffect } from "react";
import { Shield, CheckCircle, XCircle, Loader2, RefreshCw, AlertTriangle, Lock, Cpu, Network, Hash } from "lucide-react";
import { hc } from "hono/client";
import type { AppType } from "../../api";
import AppShell from "../components/AppShell";

const client = hc<AppType>("/");

interface VerifyResult {
  valid: boolean;
  result?: {
    overall_valid: boolean;
    valid_count: number;
    expected_count: number;
    peers: Record<string, { valid: boolean; error?: string }>;
  };
  error?: string;
}

const STEPS = [
  { n: "01", title: "Fetch ML-KEM Key", desc: "Retrieve encapsulation key from /status endpoint", primitive: "fetchDkgAttestation" },
  { n: "02", title: "Retrieve DKG Bundle", desc: "Get attestation bundle with peer IDs and TDX quotes", primitive: "fetchDkgAttestation" },
  { n: "03", title: "Verify TDX Quotes", desc: "Call verifyDkgAttestation() — validates each peer TDX quote", primitive: "verifyDkgAttestation" },
  { n: "04", title: "Check RTMR3 Measurements", desc: "Confirm correct WASM runtime is running in hardware TEE", primitive: "verifyDkgAttestation" },
  { n: "05", title: "Consensus Result", desc: "overall_valid = true only when all peers pass verification", primitive: "verifyDkgAttestation" },
];

export default function Verify() {
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);

  useEffect(() => { runVerify(); }, []);

  async function runVerify() {
    setLoading(true);
    setActiveStep(-1);
    // Simulate step-by-step progress
    for (let i = 0; i < STEPS.length; i++) {
      setActiveStep(i);
      await new Promise(r => setTimeout(r, 400));
    }
    try {
      const res = await client.api.health.verify.$get();
      const data = await res.json() as VerifyResult;
      setResult(data);
    } catch (e) {
      setResult({ valid: false, error: String(e) });
    } finally {
      setLoading(false);
      setActiveStep(-1);
    }
  }

  const peers = result?.result?.peers ? Object.entries(result.result.peers) : [];

  return (
    <AppShell>
      <div className="min-h-screen bg-[#050A14] text-white">
        {/* Header */}
        <div className="border-b border-[#0F1E30] bg-[#080E1A]/80 backdrop-blur-xl px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white mb-1">DKG Attestation Verification</h1>
              <p className="text-sm text-[#374151]">
                Hardware TEE verification via <span className="font-mono text-[#00D4FF]/70">verifyDkgAttestation()</span>
              </p>
            </div>
            <button
              onClick={runVerify}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#0F1E30] border border-[#1A2940] rounded-xl text-sm text-[#9CA3AF] hover:text-white hover:border-[#00D4FF]/30 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#00D4FF]" : ""}`} />
              Re-verify
            </button>
          </div>
        </div>

        <div className="px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Status + Steps */}
            <div className="space-y-5">
              {/* Main status */}
              <div className={`rounded-2xl border p-8 text-center transition-all
                ${loading ? "border-[#0F1E30] bg-[#080E1A]" :
                  result?.valid ? "border-[#10B981]/20 bg-[#10B981]/5" :
                  "border-[#F59E0B]/20 bg-[#F59E0B]/5"
                }`}
              >
                {loading ? (
                  <div className="flex flex-col items-center gap-5">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full bg-[#00D4FF]/10 border border-[#00D4FF]/20 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-[#00D4FF] animate-spin" />
                      </div>
                      <div className="absolute inset-0 rounded-full border-2 border-[#00D4FF]/20 animate-ping" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">Verifying TDX Quotes</p>
                      <p className="text-sm text-[#374151] mt-1">Querying T3 cluster nodes...</p>
                    </div>
                  </div>
                ) : result?.valid ? (
                  <div className="flex flex-col items-center gap-5">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full bg-[#10B981]/20 border border-[#10B981]/30 flex items-center justify-center">
                        <Shield className="w-9 h-9 text-[#10B981]" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-7 h-7 bg-[#10B981] rounded-full flex items-center justify-center border-2 border-[#050A14]">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-[#10B981] mb-1">Attestation Valid</h2>
                      <p className="text-sm text-[#6B7280]">
                        {result.result?.valid_count}/{result.result?.expected_count} peers verified
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-5">
                    <div className="w-20 h-20 rounded-full bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center">
                      <AlertTriangle className="w-9 h-9 text-[#F59E0B]" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-[#F59E0B] mb-2">Testnet Mode</h2>
                      <p className="text-sm text-[#6B7280] max-w-xs mx-auto">
                        {result?.error || "Testnet nodes use mock signers — full TDX hardware attestation available on mainnet."}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Verification steps */}
              <div className="bg-[#080E1A] border border-[#0F1E30] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Lock className="w-4 h-4 text-[#00D4FF]" />
                  <span className="text-sm font-semibold text-white">Verification Pipeline</span>
                </div>
                <div className="relative">
                  <div className="absolute left-[18px] top-5 bottom-5 w-px bg-[#0F1E30]" />
                  <div className="space-y-4">
                    {STEPS.map((step, i) => {
                      const done = !loading && result !== null && i <= activeStep;
                      const active = loading && i === activeStep;
                      const completed = !loading && result !== null;
                      return (
                        <div key={step.n} className="flex gap-4 items-start">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold border transition-all z-10
                            ${active ? "bg-[#00D4FF]/20 border-[#00D4FF]/40 text-[#00D4FF]" :
                              completed ? "bg-[#10B981]/15 border-[#10B981]/30 text-[#10B981]" :
                              "bg-[#0F1E30] border-[#1A2940] text-[#374151]"
                            }`}
                          >
                            {completed ? <CheckCircle className="w-4 h-4" /> : active ? <Loader2 className="w-4 h-4 animate-spin" /> : step.n}
                          </div>
                          <div className="flex-1 pt-1.5">
                            <div className={`text-sm font-medium ${active || completed ? "text-white" : "text-[#374151]"}`}>
                              {step.title}
                            </div>
                            <div className="text-xs text-[#374151] mt-0.5">{step.desc}</div>
                            <div className="text-[10px] font-mono text-[#7C3AED]/60 mt-1">{step.primitive}()</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Peer results + network info */}
            <div className="space-y-5">
              {/* Peer Results */}
              <div className="bg-[#080E1A] border border-[#0F1E30] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Network className="w-4 h-4 text-[#7C3AED]" />
                  <span className="text-sm font-semibold text-white">Peer Verification</span>
                  {peers.length > 0 && (
                    <span className="ml-auto text-xs text-[#374151]">{peers.filter(([,p]) => p.valid).length}/{peers.length} valid</span>
                  )}
                </div>
                {peers.length === 0 ? (
                  <div className="text-center py-8">
                    <Cpu className="w-8 h-8 text-[#1F2937] mx-auto mb-2" />
                    <p className="text-sm text-[#374151]">
                      {loading ? "Querying cluster nodes..." : "No peer data available — testnet mode"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {peers.map(([peerId, peer]) => (
                      <div key={peerId} className={`flex items-center gap-3 p-3 rounded-xl border transition-all
                        ${peer.valid ? "border-[#10B981]/15 bg-[#10B981]/5" : "border-[#EF4444]/15 bg-[#EF4444]/5"}`}
                      >
                        {peer.valid
                          ? <CheckCircle className="w-4 h-4 text-[#10B981] flex-shrink-0" />
                          : <XCircle className="w-4 h-4 text-[#EF4444] flex-shrink-0" />
                        }
                        <span className="text-xs font-mono text-[#6B7280] truncate flex-1">{peerId}</span>
                        {peer.error && <span className="text-xs text-[#EF4444] ml-auto">{peer.error}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Security props */}
              <div className="bg-[#080E1A] border border-[#0F1E30] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-4 h-4 text-[#10B981]" />
                  <span className="text-sm font-semibold text-white">Security Properties</span>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Enclave Type", value: "Intel TDX", color: "#00D4FF" },
                    { label: "Measurement", value: "RTMR3", color: "#7C3AED" },
                    { label: "Key Scheme", value: "ML-KEM", color: "#10B981" },
                    { label: "SDK", value: "t3n-sdk v3.5.2", color: "#F59E0B" },
                    { label: "Primitive", value: "verifyDkgAttestation()", color: "#00D4FF" },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between py-2 border-b border-[#0F1E30] last:border-0">
                      <span className="text-xs text-[#374151]">{row.label}</span>
                      <span className="text-xs font-mono" style={{ color: row.color }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* What is TEE */}
              <div className="bg-gradient-to-br from-[#7C3AED]/10 to-[#00D4FF]/5 border border-[#7C3AED]/20 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Hash className="w-4 h-4 text-[#7C3AED]" />
                  <span className="text-sm font-semibold text-white">What is T3 TEE?</span>
                </div>
                <p className="text-xs text-[#6B7280] leading-relaxed">
                  Terminal 3's TEE uses Intel TDX (Trust Domain Extensions) to create an isolated hardware enclave.
                  Code and data inside the TEE are protected from the host OS and cloud provider.
                  DKG attestation proves that a valid T3 WASM runtime is running inside genuine Intel hardware.
                </p>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-6 text-center">
            <p className="text-xs text-[#1F2937]">
              Powered by <span className="font-mono text-[#00D4FF]/40">@terminal3/t3n-sdk</span> ·{" "}
              <span className="font-mono text-[#7C3AED]/40">verifyDkgAttestation</span> +{" "}
              <span className="font-mono text-[#7C3AED]/40">fetchDkgAttestation</span>
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
