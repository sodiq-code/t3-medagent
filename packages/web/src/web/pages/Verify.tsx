import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Activity, Shield, CheckCircle, XCircle, Loader2, RefreshCw, ChevronLeft, AlertTriangle, Lock } from "lucide-react";
import { hc } from "hono/client";
import type { AppType } from "../../api";

const client = hc<AppType>("/");

interface VerifyResult {
  valid: boolean;
  result?: {
    overall_valid: boolean;
    valid_count: number;
    expected_count: number;
    peers: Record<string, {
      valid: boolean;
      error?: string;
    }>;
  };
  error?: string;
}

export default function Verify() {
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { runVerify(); }, []);

  async function runVerify() {
    setLoading(true);
    try {
      const res = await client.api.health.verify.$get();
      const data = await res.json() as VerifyResult;
      setResult(data);
    } catch (e) {
      setResult({ valid: false, error: String(e) });
    } finally {
      setLoading(false);
    }
  }

  const peers = result?.result?.peers
    ? Object.entries(result.result.peers)
    : [];

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-[#F9FAFB]">
      <nav className="border-b border-[#1E2A3A] px-6 h-16 flex items-center justify-between sticky top-0 bg-[#0A0F1E]/80 backdrop-blur-xl z-10">
        <Link href="/dashboard" className="flex items-center gap-2 text-[#9CA3AF] hover:text-white transition-colors">
          <ChevronLeft className="w-4 h-4" />
          <Activity className="w-5 h-5 text-[#00D4FF]" />
          <span className="font-bold text-white">T3 MedAgent</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#9CA3AF]">TEE Attestation</span>
          <button onClick={runVerify} disabled={loading} className="p-2 text-[#9CA3AF] hover:text-white transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-3" style={{ fontFamily: "Syne, sans-serif" }}>
            DKG Attestation Verification
          </h1>
          <p className="text-[#9CA3AF]">
            Verify that the Terminal 3 TEE cluster is genuine hardware using{" "}
            <code className="text-[#00D4FF]">verifyDkgAttestation()</code>
          </p>
        </div>

        {/* Main Status Card */}
        <div className={`rounded-2xl border p-8 mb-6 text-center transition-all ${
          loading ? "border-[#1E2A3A] bg-[#111827]" :
          result?.valid ? "border-[#10B981]/30 bg-[#10B981]/5" :
          "border-[#F59E0B]/30 bg-[#F59E0B]/5"
        }`}>
          {loading ? (
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-[#00D4FF]/10 border border-[#00D4FF]/30 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-[#00D4FF] animate-spin" />
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-[#00D4FF]/30 animate-ping" />
              </div>
              <p className="text-[#9CA3AF]">Verifying TDX quotes from T3 cluster...</p>
            </div>
          ) : result?.valid ? (
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-[#10B981]/20 border border-[#10B981]/30 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-[#10B981]" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#10B981] rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#10B981] mb-1">Attestation Valid</h2>
                <p className="text-[#9CA3AF] text-sm">
                  {result.result?.valid_count}/{result.result?.expected_count} peers verified
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-[#F59E0B]/10 border border-[#F59E0B]/30 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-[#F59E0B]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#F59E0B] mb-2">Testnet Mode</h2>
                <p className="text-[#9CA3AF] text-sm max-w-sm mx-auto">
                  {result?.error || "DKG attestation unavailable — testnet nodes may use mock signers without full TDX hardware."}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* How it works */}
        <div className="bg-[#111827] border border-[#1E2A3A] rounded-xl p-6 mb-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#00D4FF]" />
            How DKG Attestation Works
          </h3>
          <div className="space-y-3">
            {[
              { step: "1", text: "Fetch ML-KEM encapsulation key from /status endpoint" },
              { step: "2", text: "Retrieve DKG attestation bundle (peer IDs + TDX quotes)" },
              { step: "3", text: "Call verifyDkgAttestation() — validates each peer's TDX quote" },
              { step: "4", text: "RTMR3 measurement confirms the correct WASM runtime is running" },
              { step: "5", text: "overall_valid = true only if all peers pass quote verification" },
            ].map((item) => (
              <div key={item.step} className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-[#00D4FF]/10 border border-[#00D4FF]/30 flex items-center justify-center text-xs text-[#00D4FF] flex-shrink-0">
                  {item.step}
                </div>
                <p className="text-sm text-[#9CA3AF]">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Peer Results */}
        {peers.length > 0 && (
          <div className="bg-[#111827] border border-[#1E2A3A] rounded-xl p-6">
            <h3 className="font-semibold mb-4">Peer Verification Results</h3>
            <div className="space-y-2">
              {peers.map(([peerId, peer]) => (
                <div key={peerId} className={`flex items-center gap-3 p-3 rounded-lg border ${
                  peer.valid ? "border-[#10B981]/20 bg-[#10B981]/5" : "border-[#EF4444]/20 bg-[#EF4444]/5"
                }`}>
                  {peer.valid ? (
                    <CheckCircle className="w-4 h-4 text-[#10B981] flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-[#EF4444] flex-shrink-0" />
                  )}
                  <span className="text-xs font-mono text-[#9CA3AF] truncate">{peerId}</span>
                  {peer.error && <span className="text-xs text-[#EF4444] ml-auto">{peer.error}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SDK note */}
        <div className="text-center mt-8">
          <p className="text-xs text-[#4B5563]">
            Powered by <code className="text-[#00D4FF]">@terminal3/t3n-sdk</code> v3.5.2 ·{" "}
            <code className="text-[#00D4FF]">verifyDkgAttestation</code> + <code className="text-[#00D4FF]">fetchDkgAttestation</code>
          </p>
        </div>
      </div>
    </div>
  );
}
