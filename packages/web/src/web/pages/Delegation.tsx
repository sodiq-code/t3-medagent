import { useState, useEffect } from "react";
import {
  Users, Plus, Trash2, CheckCircle, XCircle, Loader2,
  Key, Shield, Lock, Clock, Hash, ChevronRight, Copy, AlertTriangle
} from "lucide-react";
import { hc } from "hono/client";
import type { AppType } from "../../api";
import AppShell from "../components/AppShell";

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
  { id: "analyze-symptoms", label: "Analyze Symptoms", desc: "Run AI health analysis on patient data", icon: "🧠" },
  { id: "request-specialist", label: "Request Specialist", desc: "Escalate to specialist AI agent", icon: "👨‍⚕️" },
  { id: "retrieve-history", label: "Retrieve History", desc: "Read patient medical history", icon: "📋" },
  { id: "update-profile", label: "Update Profile", desc: "Modify patient health profile", icon: "✏️" },
  { id: "generate-report", label: "Generate Report", desc: "Create diagnostic report", icon: "📊" },
];

export default function Delegation() {
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [pubKey, setPubKey] = useState("");
  const [selectedFns, setSelectedFns] = useState<string[]>(["analyze-symptoms"]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [revoking, setRevoking] = useState<string | null>(null);

  useEffect(() => { loadDelegations(); }, []);

  async function loadDelegations() {
    setLoading(true);
    try {
      const res = await client.api.delegate.list.$get();
      const data = await res.json();
      setDelegations((data as any).delegations || []);
    } catch {}
    finally { setLoading(false); }
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
        setSelectedFns(["analyze-symptoms"]);
        await loadDelegations();
      } else {
        setError((data as any).error || "Creation failed");
      }
    } catch (e) { setError(String(e)); }
    finally { setCreating(false); }
  }

  async function revoke(id: string) {
    setRevoking(id);
    try {
      await client.api.delegate[":id"].$delete({ param: { id } });
      await loadDelegations();
    } catch {}
    finally { setRevoking(null); }
  }

  const toggleFn = (fn: string) =>
    setSelectedFns(fns => fns.includes(fn) ? fns.filter(f => f !== fn) : [...fns, fn]);

  return (
    <AppShell>
      <div className="min-h-screen bg-[#050A14] text-white">
        {/* Header */}
        <div className="border-b border-[#0F1E30] bg-[#080E1A]/80 backdrop-blur-xl px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white mb-1">Agent Delegation</h1>
              <p className="text-sm text-[#374151]">
                Cryptographic credentials via <span className="font-mono text-[#00D4FF]/70">buildDelegationCredential</span> · <span className="font-mono text-[#7C3AED]/70">signAgentInvocation</span>
              </p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#00D4FF] to-[#0099CC] text-[#050A14] rounded-xl text-sm font-bold hover:opacity-90 transition-all"
            >
              <Plus className="w-4 h-4" />
              Grant Delegation
            </button>
          </div>
        </div>

        <div className="px-8 py-6 space-y-6">
          {/* How it works */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: Key, color: "#00D4FF", title: "Sign Credential", desc: "buildDelegationCredential() creates a time-bounded, signed authorization credential" },
              { icon: Shield, color: "#7C3AED", title: "Invoke Agent", desc: "signAgentInvocation() attaches cryptographic proof to every delegated action" },
              { icon: Lock, color: "#10B981", title: "Revoke Anytime", desc: "Full revocation control — remove delegation instantly with on-chain proof" },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="bg-[#080E1A] border border-[#0F1E30] rounded-2xl p-5 hover:border-opacity-60 transition-all"
                style={{ borderColor: `${color}10` }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${color}15`, border: `1px solid ${color}20` }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <div className="font-semibold text-white mb-1.5 text-sm">{title}</div>
                <div className="text-xs text-[#374151] leading-relaxed">{desc}</div>
              </div>
            ))}
          </div>

          {/* Stats bar */}
          <div className="flex items-center gap-6 bg-[#080E1A] border border-[#0F1E30] rounded-2xl px-6 py-4">
            <div>
              <div className="text-2xl font-bold text-[#00D4FF]">{delegations.length}</div>
              <div className="text-xs text-[#374151]">Total Delegations</div>
            </div>
            <div className="w-px h-8 bg-[#0F1E30]" />
            <div>
              <div className="text-2xl font-bold text-[#10B981]">{delegations.filter(d => d.status === "active").length}</div>
              <div className="text-xs text-[#374151]">Active</div>
            </div>
            <div className="w-px h-8 bg-[#0F1E30]" />
            <div>
              <div className="text-2xl font-bold text-[#EF4444]">{delegations.filter(d => d.status !== "active").length}</div>
              <div className="text-xs text-[#374151]">Revoked</div>
            </div>
          </div>

          {/* List */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 text-[#00D4FF] animate-spin" />
            </div>
          ) : delegations.length === 0 ? (
            <div className="bg-[#080E1A] border border-[#0F1E30] rounded-2xl p-16 text-center">
              <div className="w-14 h-14 bg-[#0F1E30] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-[#1F2937]" />
              </div>
              <p className="text-[#6B7280] font-medium mb-1">No active delegations</p>
              <p className="text-[#374151] text-sm mb-4">Grant a specialist agent access to health functions.</p>
              <button
                onClick={() => setShowCreate(true)}
                className="text-sm text-[#00D4FF] hover:underline"
              >
                + Create first delegation
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {delegations.map(d => {
                const fns: string[] = JSON.parse(d.functions || "[]");
                const isActive = d.status === "active";
                return (
                  <div key={d.id} className="bg-[#080E1A] border border-[#0F1E30] rounded-2xl p-5 hover:border-opacity-60 transition-all"
                    style={{ borderColor: isActive ? "#00D4FF10" : "#EF444410" }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0 space-y-3">
                        {/* Status + ID */}
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg font-semibold border
                            ${isActive
                              ? "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20"
                              : "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20"
                            }`}
                          >
                            {isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {d.status}
                          </span>
                          <span className="text-xs font-mono text-[#374151]">#{d.id.substring(0, 12)}...</span>
                          {d.createdAt && (
                            <span className="flex items-center gap-1 text-xs text-[#374151] ml-auto">
                              <Clock className="w-3 h-3" />
                              {new Date(d.createdAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        {/* Public key */}
                        <div className="flex items-center gap-2 bg-[#050A14] rounded-xl px-3 py-2 border border-[#0F1E30]">
                          <Hash className="w-3.5 h-3.5 text-[#374151] flex-shrink-0" />
                          <span className="text-xs font-mono text-[#6B7280] truncate">{d.agentPublicKey}</span>
                        </div>

                        {/* Functions */}
                        <div className="flex flex-wrap gap-2">
                          {fns.map(fn => {
                            const fnMeta = HEALTH_FUNCTIONS.find(f => f.id === fn);
                            return (
                              <span key={fn} className="flex items-center gap-1 text-xs px-2.5 py-1 bg-[#7C3AED]/10 text-[#7C3AED] border border-[#7C3AED]/20 rounded-lg font-mono">
                                {fnMeta?.icon} {fn}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      <button
                        onClick={() => revoke(d.id)}
                        disabled={revoking === d.id}
                        className="flex items-center gap-1.5 text-xs text-[#EF4444] hover:bg-[#EF4444]/10 px-3 py-2 rounded-xl transition-all border border-transparent hover:border-[#EF4444]/20 flex-shrink-0"
                      >
                        {revoking === d.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        Revoke
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Create Modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#080E1A] border border-[#1A2940] rounded-3xl p-7 w-full max-w-lg shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-[#00D4FF]/15 border border-[#00D4FF]/20 flex items-center justify-center">
                  <Key className="w-5 h-5 text-[#00D4FF]" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">Grant Agent Delegation</h3>
                  <p className="text-xs text-[#374151]">Signed credential via T3 SDK</p>
                </div>
                <button onClick={() => setShowCreate(false)} className="ml-auto text-[#374151] hover:text-[#9CA3AF] transition-colors">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-2">
                    Agent Public Key <span className="text-[#374151] normal-case font-normal">(compressed secp256k1 hex)</span>
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#374151]" />
                    <input
                      type="text"
                      placeholder="02a3b4c5d6e7f8..."
                      value={pubKey}
                      onChange={e => setPubKey(e.target.value)}
                      className="w-full bg-[#050A14] border border-[#1A2940] rounded-xl pl-10 pr-4 py-3 text-white font-mono text-sm placeholder-[#374151] focus:outline-none focus:border-[#00D4FF]/40 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-3">
                    Permitted Functions
                  </label>
                  <div className="space-y-2">
                    {HEALTH_FUNCTIONS.map(fn => (
                      <button
                        key={fn.id}
                        onClick={() => toggleFn(fn.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left
                          ${selectedFns.includes(fn.id)
                            ? "bg-[#00D4FF]/10 border-[#00D4FF]/30 text-white"
                            : "border-[#0F1E30] text-[#6B7280] hover:border-[#1A2940] hover:text-[#9CA3AF]"
                          }`}
                      >
                        <span className="text-lg">{fn.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium">{fn.label}</div>
                          <div className="text-xs text-[#374151] font-mono">{fn.id}</div>
                        </div>
                        {selectedFns.includes(fn.id) && (
                          <CheckCircle className="w-4 h-4 text-[#00D4FF] flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-sm text-[#EF4444] bg-[#EF4444]/10 rounded-xl px-4 py-3 border border-[#EF4444]/20">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowCreate(false)}
                    className="flex-1 border border-[#1A2940] text-[#6B7280] py-3 rounded-xl text-sm font-medium hover:border-[#374151] hover:text-[#9CA3AF] transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createDelegation}
                    disabled={!pubKey || selectedFns.length === 0 || creating}
                    className="flex-1 bg-gradient-to-r from-[#00D4FF] to-[#0099CC] text-[#050A14] py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                    Sign & Delegate
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
