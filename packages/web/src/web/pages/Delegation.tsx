import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Activity, Users, Plus, Trash2, CheckCircle, XCircle, ChevronLeft, Loader2, Key, Shield } from "lucide-react";
import { hc } from "hono/client";
import type { AppType } from "../../api";

const client = hc<AppType>("/");

interface Delegation {
  id: string;
  issuerDid: string;
  agentPublicKey: string;
  functions: string;
  status: string;
  createdAt: string;
}

const HEALTH_FUNCTIONS = [
  "analyze-symptoms",
  "request-specialist",
  "retrieve-history",
  "update-profile",
  "generate-report",
];

export default function Delegation() {
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [pubKey, setPubKey] = useState("");
  const [selectedFns, setSelectedFns] = useState<string[]>(["analyze-symptoms"]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { loadDelegations(); }, []);

  async function loadDelegations() {
    setLoading(true);
    try {
      const res = await client.api.delegate.list.$get();
      const data = await res.json();
      setDelegations((data as { delegations: Delegation[] }).delegations || []);
    } catch { } finally { setLoading(false); }
  }

  async function createDelegation() {
    if (!pubKey) return;
    setCreating(true);
    setError("");
    try {
      const res = await client.api.delegate.create.$post({
        json: { agentPublicKey: pubKey, functions: selectedFns },
      });
      const data = await res.json();
      if (data.success) {
        setShowCreate(false);
        setPubKey("");
        await loadDelegations();
      } else {
        setError((data as { error?: string }).error || "Creation failed");
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setCreating(false);
    }
  }

  async function revoke(id: string) {
    await client.api.delegate[":id"].$delete({ param: { id } });
    await loadDelegations();
  }

  const toggleFn = (fn: string) => {
    setSelectedFns(fns => fns.includes(fn) ? fns.filter(f => f !== fn) : [...fns, fn]);
  };

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-[#F9FAFB]">
      <nav className="border-b border-[#1E2A3A] px-6 h-16 flex items-center justify-between sticky top-0 bg-[#0A0F1E]/80 backdrop-blur-xl z-10">
        <Link href="/dashboard" className="flex items-center gap-2 text-[#9CA3AF] hover:text-white transition-colors">
          <ChevronLeft className="w-4 h-4" />
          <Activity className="w-5 h-5 text-[#00D4FF]" />
          <span className="font-bold text-white">T3 MedAgent</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#9CA3AF]">Agent Delegation</span>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-[#00D4FF] text-[#0A0F1E] px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-[#0099CC] transition-all"
          >
            <Plus className="w-4 h-4" /> Grant Delegation
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Info Banner */}
        <div className="bg-[#7C3AED]/10 border border-[#7C3AED]/20 rounded-xl p-4 mb-8 flex gap-3">
          <Shield className="w-5 h-5 text-[#7C3AED] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-[#F9FAFB]">Cryptographic Agent Delegation</p>
            <p className="text-xs text-[#9CA3AF] mt-1">
              Uses <code className="text-[#00D4FF]">buildDelegationCredential</code> + <code className="text-[#00D4FF]">signAgentInvocation</code> from Terminal 3 SDK.
              Delegate specific health functions to specialist AI agents with time-bounded, revocable credentials.
            </p>
          </div>
        </div>

        {/* Create Modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#111827] border border-[#1E2A3A] rounded-2xl p-6 w-full max-w-md">
              <h3 className="font-bold text-lg mb-4" style={{ fontFamily: "Syne, sans-serif" }}>Grant Agent Delegation</h3>

              <div className="mb-4">
                <label className="block text-sm text-[#9CA3AF] mb-2">Agent Public Key (hex)</label>
                <input
                  type="text"
                  placeholder="02a3b4c5d6e7f8..."
                  value={pubKey}
                  onChange={(e) => setPubKey(e.target.value)}
                  className="w-full bg-[#0A0F1E] border border-[#1E2A3A] rounded-xl px-4 py-3 text-white font-mono text-sm placeholder-[#4B5563] focus:outline-none focus:border-[#00D4FF]/50"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm text-[#9CA3AF] mb-2">Permitted Functions</label>
                <div className="space-y-2">
                  {HEALTH_FUNCTIONS.map((fn) => (
                    <label key={fn} className="flex items-center gap-3 cursor-pointer group">
                      <div
                        onClick={() => toggleFn(fn)}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                          selectedFns.includes(fn) ? "bg-[#00D4FF]/20 border-[#00D4FF]/50" : "border-[#1E2A3A] group-hover:border-[#9CA3AF]"
                        }`}
                      >
                        {selectedFns.includes(fn) && <CheckCircle className="w-3.5 h-3.5 text-[#00D4FF]" />}
                      </div>
                      <span className="text-sm font-mono text-[#9CA3AF]">{fn}</span>
                    </label>
                  ))}
                </div>
              </div>

              {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex-1 border border-[#1E2A3A] text-[#9CA3AF] py-3 rounded-xl text-sm hover:border-[#9CA3AF]/30 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={createDelegation}
                  disabled={!pubKey || selectedFns.length === 0 || creating}
                  className="flex-1 bg-[#00D4FF] text-[#0A0F1E] py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#0099CC] disabled:opacity-50"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                  Sign & Delegate
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delegations List */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 text-[#00D4FF] animate-spin" />
          </div>
        ) : delegations.length === 0 ? (
          <div className="bg-[#111827] border border-[#1E2A3A] rounded-xl p-12 text-center">
            <Users className="w-10 h-10 text-[#1F2937] mx-auto mb-3" />
            <p className="text-[#9CA3AF] text-sm">No active delegations</p>
            <p className="text-[#4B5563] text-xs mt-1">Grant a specialist agent access to health functions.</p>
            <button onClick={() => setShowCreate(true)} className="mt-4 text-sm text-[#00D4FF] hover:underline">
              + Create first delegation
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {delegations.map((d) => {
              const fns: string[] = JSON.parse(d.functions || "[]");
              return (
                <div key={d.id} className="bg-[#111827] border border-[#1E2A3A] rounded-xl p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          d.status === "active" ? "bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20" : "bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20"
                        }`}>
                          {d.status}
                        </div>
                        <span className="text-xs text-[#4B5563]">{d.id.substring(0, 8)}...</span>
                      </div>

                      <div className="text-xs font-mono text-[#9CA3AF] truncate mb-3">
                        <span className="text-[#4B5563]">key:</span> {d.agentPublicKey.substring(0, 20)}...
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {fns.map((fn) => (
                          <span key={fn} className="text-xs font-mono px-2 py-1 bg-[#7C3AED]/10 text-[#7C3AED] border border-[#7C3AED]/20 rounded-md">
                            {fn}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => revoke(d.id)}
                      className="text-[#EF4444] hover:bg-[#EF4444]/10 p-2 rounded-lg transition-all"
                      title="Revoke"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
