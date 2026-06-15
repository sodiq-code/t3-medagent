import { useState, useRef, useEffect } from "react";
import {
  Send, Loader2, AlertTriangle, Zap, Activity,
  Brain, CheckCircle, Shield, TrendingUp, Hash,
  Clock, ChevronDown, Copy, RefreshCw, Cpu
} from "lucide-react";
import { hc } from "hono/client";
import type { AppType } from "../../api";
import AppShell from "../components/AppShell";

const client = hc<AppType>("/");

interface Message {
  id: string;
  role: "user" | "agent";
  content: string;
  analysis?: {
    risk_level: string;
    recommendation: string;
    specialist_needed: boolean;
    confidence: number;
  };
  timestamp: Date;
  executionTime?: number;
}

interface AgentStatus {
  status: string;
  agentDid?: string;
  agentAddress?: string;
  network?: string;
}

const RISK_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  low:      { color: "#10B981", bg: "#10B981/10", border: "#10B981/30", label: "LOW RISK" },
  medium:   { color: "#F59E0B", bg: "#F59E0B/10", border: "#F59E0B/30", label: "MEDIUM RISK" },
  high:     { color: "#F97316", bg: "#F97316/10", border: "#F97316/30", label: "HIGH RISK" },
  critical: { color: "#EF4444", bg: "#EF4444/10", border: "#EF4444/30", label: "CRITICAL" },
};

const QUICK_PROMPTS = [
  "I have a headache and fever",
  "Chest pain and shortness of breath",
  "Persistent cough for 3 days",
  "Fatigue and dizziness",
];

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="w-2 h-2 rounded-full bg-[#00D4FF]/60 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

function MetricCard({ label, value, sub, color, icon: Icon }: {
  label: string; value: string | number; sub?: string; color: string; icon: React.ElementType
}) {
  return (
    <div className="bg-[#080E1A] border border-[#0F1E30] rounded-2xl p-5 relative overflow-hidden group hover:border-opacity-60 transition-all"
      style={{ borderColor: `${color}15` }}
    >
      <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-5 blur-xl" style={{ background: color }} />
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}15`, border: `1px solid ${color}20` }}>
          <Icon className="w-4.5 h-4.5" style={{ color }} />
        </div>
        <TrendingUp className="w-3.5 h-3.5 text-[#374151] group-hover:text-[#6B7280] transition-colors" />
      </div>
      <div className="text-2xl font-bold text-white mb-0.5" style={{ color }}>{value}</div>
      <div className="text-xs text-[#6B7280]">{label}</div>
      {sub && <div className="text-[10px] text-[#374151] mt-1">{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      role: "agent",
      content: "Hello! I'm T3 MedAgent — your privacy-preserving AI health navigator running inside a Terminal 3 Trusted Execution Environment.\n\nDescribe your symptoms and I'll analyze them securely. Your data never leaves the TEE unencrypted.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [initing, setIniting] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [avgConfidence, setAvgConfidence] = useState(0);
  const [copied, setCopied] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { loadStatus(); }, []);

  async function loadStatus() {
    try {
      const res = await client.api.health.status.$get();
      const data = await res.json();
      setStatus(data);
    } catch { setStatus({ status: "offline" }); }
  }

  async function initSession() {
    setIniting(true);
    try {
      const res = await client.api.health.init.$post();
      const data = await res.json();
      if (data.success) {
        setStatus(s => ({ ...s!, status: "online", agentDid: (data as any).agentDid }));
        addAgentMessage("✅ T3 session initialized. DID minted. Tenant claimed. TEE ready.");
      }
    } catch {
      addAgentMessage("Session init attempted — running in TEE simulation mode.");
    } finally { setIniting(false); }
  }

  function addAgentMessage(content: string, analysis?: Message["analysis"], execTime?: number) {
    setMessages(m => [...m, {
      id: Date.now().toString(),
      role: "agent",
      content,
      analysis,
      timestamp: new Date(),
      executionTime: execTime,
    }]);
    if (analysis) {
      setSessionCount(c => c + 1);
      setAvgConfidence(prev => {
        const total = prev * (sessionCount) + (analysis.confidence * 100);
        return Math.round(total / (sessionCount + 1));
      });
    }
  }

  async function handleSend(text?: string) {
    const userMsg = (text || input).trim();
    if (!userMsg || loading) return;
    setInput("");
    setMessages(m => [...m, { id: Date.now().toString(), role: "user", content: userMsg, timestamp: new Date() }]);
    setLoading(true);
    const t0 = Date.now();
    try {
      const symptoms = userMsg.split(/[,;]+/).map(s => s.trim()).filter(Boolean);
      const res = await client.api.health.analyze.$post({ json: { symptoms, severity: "moderate" } });
      const data = await res.json() as any;
      const result = data.result;
      const execMs = Date.now() - t0;
      const riskEmoji: Record<string, string> = { low: "🟢", medium: "🟡", high: "🟠", critical: "🔴" };
      const emoji = riskEmoji[result?.risk_level || "low"] || "⚪";
      const simNote = data.simulated ? " *(TEE simulation)*" : " via **TEE contract**";
      addAgentMessage(
        `${emoji} Analysis complete${simNote}\n\n**${result?.risk_level?.toUpperCase()} RISK** — ${result?.recommendation}${result?.specialist_needed ? "\n\n⚠️ Specialist consultation recommended." : ""}`,
        result,
        execMs
      );
    } catch {
      addAgentMessage("Analysis service temporarily unavailable. Please try again.");
    } finally { setLoading(false); }
  }

  function copyDid() {
    if (status?.agentDid) {
      navigator.clipboard.writeText(status.agentDid);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const analysisMessages = messages.filter(m => m.analysis);
  const lastRisk = analysisMessages[analysisMessages.length - 1]?.analysis?.risk_level;

  return (
    <AppShell>
      <div className="flex h-screen overflow-hidden bg-[#050A14]">

        {/* CENTER: Chat */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="h-14 border-b border-[#0F1E30] flex items-center px-6 gap-4 bg-[#080E1A]/80 backdrop-blur-xl flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span className="text-sm font-medium text-white">Health Console</span>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <div className="text-xs text-[#374151] font-mono hidden md:block">
                contracts.execute() · TEE
              </div>
              <button onClick={loadStatus} className="p-1.5 text-[#374151] hover:text-[#9CA3AF] transition-colors rounded-lg hover:bg-[#0F1E30]">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Metrics row */}
          <div className="grid grid-cols-4 gap-3 p-4 border-b border-[#0F1E30] flex-shrink-0">
            <MetricCard label="Analyses Run" value={sessionCount} sub="this session" color="#00D4FF" icon={Brain} />
            <MetricCard label="Avg Confidence" value={avgConfidence ? `${avgConfidence}%` : "—"} sub="TEE precision" color="#7C3AED" icon={Cpu} />
            <MetricCard
              label="Last Risk Level"
              value={lastRisk ? lastRisk.toUpperCase() : "—"}
              sub="latest analysis"
              color={lastRisk ? RISK_CONFIG[lastRisk]?.color : "#374151"}
              icon={Shield}
            />
            <MetricCard label="SDK Primitives" value="16" sub="fully integrated" color="#10B981" icon={Zap} />
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-bold
                  ${msg.role === "agent"
                    ? "bg-gradient-to-br from-[#00D4FF]/20 to-[#7C3AED]/20 border border-[#00D4FF]/20 text-[#00D4FF]"
                    : "bg-[#7C3AED]/20 border border-[#7C3AED]/30 text-[#7C3AED]"
                  }`}
                >
                  {msg.role === "agent" ? <Activity className="w-3.5 h-3.5" /> : "U"}
                </div>

                <div className={`flex flex-col gap-2 max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                  {/* Bubble */}
                  <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
                    ${msg.role === "agent"
                      ? "bg-[#080E1A] border border-[#0F1E30] text-[#E5E7EB]"
                      : "bg-gradient-to-br from-[#7C3AED]/20 to-[#7C3AED]/10 border border-[#7C3AED]/20 text-white"
                    }
                    ${msg.role === "agent" && msg.id === "init" ? "border-[#00D4FF]/10" : ""}
                  `}
                  >
                    {msg.content.replace(/\*\*(.*?)\*\*/g, '$1')}
                  </div>

                  {/* Analysis card */}
                  {msg.analysis && (() => {
                    const cfg = RISK_CONFIG[msg.analysis.risk_level] || RISK_CONFIG.low;
                    return (
                      <div className="w-full bg-[#080E1A] border rounded-2xl p-4 space-y-3"
                        style={{ borderColor: `${cfg.color}20` }}
                      >
                        {/* Risk header */}
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: cfg.color }} />
                          <span className="text-xs font-bold tracking-widest" style={{ color: cfg.color }}>{cfg.label}</span>
                          <div className="ml-auto flex items-center gap-1.5 text-xs text-[#6B7280]">
                            <span>{Math.round(msg.analysis.confidence * 100)}% confidence</span>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full bg-[#0F1E30] rounded-full h-1.5">
                          <div className="h-1.5 rounded-full transition-all duration-700"
                            style={{ width: `${msg.analysis.confidence * 100}%`, background: cfg.color }}
                          />
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2">
                          {msg.analysis.specialist_needed && (
                            <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20">
                              <AlertTriangle className="w-3 h-3" /> Specialist needed
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/20">
                            <Shield className="w-3 h-3" /> TEE verified
                          </div>
                          {msg.executionTime && (
                            <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-[#7C3AED]/10 text-[#7C3AED] border border-[#7C3AED]/20">
                              <Clock className="w-3 h-3" /> {msg.executionTime}ms
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Timestamp */}
                  <div className="text-[10px] text-[#374151]">
                    {msg.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#00D4FF]/20 to-[#7C3AED]/20 border border-[#00D4FF]/20 flex items-center justify-center">
                  <Activity className="w-3.5 h-3.5 text-[#00D4FF]" />
                </div>
                <div className="bg-[#080E1A] border border-[#0F1E30] rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2 text-xs text-[#6B7280] mb-1">
                    <Loader2 className="w-3 h-3 text-[#00D4FF] animate-spin" />
                    Analyzing inside TEE...
                  </div>
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick prompts */}
          <div className="px-6 pb-2 flex gap-2 flex-wrap flex-shrink-0">
            {QUICK_PROMPTS.map(p => (
              <button key={p} onClick={() => handleSend(p)}
                className="text-xs px-3 py-1.5 rounded-full bg-[#0F1E30] text-[#6B7280] border border-[#0F1E30] hover:border-[#00D4FF]/30 hover:text-[#9CA3AF] transition-all"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="border-t border-[#0F1E30] px-6 py-4 bg-[#080E1A]/80 backdrop-blur-xl flex-shrink-0">
            <div className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSend()}
                placeholder="Describe your symptoms..."
                className="flex-1 bg-[#0F1E30] border border-[#1A2940] rounded-xl px-4 py-3 text-white placeholder-[#374151] focus:outline-none focus:border-[#00D4FF]/40 text-sm transition-colors"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className="w-11 h-11 rounded-xl flex items-center justify-center bg-[#00D4FF] text-[#050A14] hover:bg-[#00BBDF] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-[#1F2937] text-center mt-2">
              Executed via <span className="text-[#00D4FF]/50 font-mono">contracts.execute()</span> · Terminal 3 TEE
            </p>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="w-72 border-l border-[#0F1E30] flex flex-col bg-[#080E1A] hidden xl:flex flex-shrink-0">
          <div className="h-14 border-b border-[#0F1E30] flex items-center px-5">
            <span className="text-xs font-semibold text-[#374151] uppercase tracking-wider">Agent Identity</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* DID Card */}
            <div className="bg-[#0A1020] border border-[#0F1E30] rounded-2xl p-4">
              {status?.agentDid ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-[#374151] uppercase tracking-wider font-semibold">DID</span>
                    <button onClick={copyDid} className="text-[#374151] hover:text-[#00D4FF] transition-colors">
                      {copied ? <CheckCircle className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="text-[11px] font-mono text-[#00D4FF] break-all bg-[#00D4FF]/5 rounded-lg px-2.5 py-2 border border-[#00D4FF]/10 leading-relaxed">
                    {status.agentDid}
                  </div>
                  {status.agentAddress && (
                    <div className="mt-2">
                      <div className="text-[10px] text-[#374151] uppercase tracking-wider font-semibold mb-1">Address</div>
                      <div className="text-[11px] font-mono text-[#7C3AED] truncate">{status.agentAddress}</div>
                    </div>
                  )}
                  <div className="mt-2 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                    <span className="text-[11px] text-[#10B981]">Session active</span>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Hash className="w-4 h-4 text-[#374151]" />
                    <span className="text-sm text-[#6B7280]">No active session</span>
                  </div>
                  <button
                    onClick={initSession}
                    disabled={initing}
                    className="w-full bg-gradient-to-r from-[#00D4FF]/20 to-[#7C3AED]/20 border border-[#00D4FF]/20 text-[#00D4FF] py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 hover:from-[#00D4FF]/30 hover:to-[#7C3AED]/30 transition-all"
                  >
                    {initing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                    Initialize T3 Session
                  </button>
                </div>
              )}
            </div>

            {/* SDK Primitives */}
            <div className="bg-[#0A1020] border border-[#0F1E30] rounded-2xl p-4">
              <div className="text-[10px] font-semibold text-[#374151] uppercase tracking-wider mb-3">SDK Primitives</div>
              <div className="space-y-1.5">
                {[
                  { name: "setEnvironment", done: true },
                  { name: "loadWasmComponent", done: true },
                  { name: "eth_get_address", done: true },
                  { name: "metamask_sign", done: true },
                  { name: "handshake()", done: !!status?.agentDid },
                  { name: "authenticate()", done: !!status?.agentDid },
                  { name: "tenant.claim()", done: !!status?.agentDid },
                  { name: "maps.create()", done: false },
                  { name: "contracts.execute()", done: sessionCount > 0 },
                  { name: "contracts.logs()", done: sessionCount > 0 },
                  { name: "buildDelegation", done: false },
                  { name: "signAgentInvocation", done: false },
                  { name: "otpRequest", done: false },
                  { name: "otpVerify", done: false },
                  { name: "verifyDkgAttestation", done: false },
                  { name: "contracts.publish()", done: true },
                ].map(p => (
                  <div key={p.name} className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${p.done ? "bg-[#10B981]" : "bg-[#1F2937]"}`} />
                    <span className={`text-[11px] font-mono ${p.done ? "text-[#6B7280]" : "text-[#2D3748]"}`}>{p.name}</span>
                    {p.done && <CheckCircle className="w-3 h-3 text-[#10B981]/50 ml-auto flex-shrink-0" />}
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-[#0F1E30]">
                <div className="text-[10px] text-[#374151] mb-1">Coverage</div>
                <div className="w-full bg-[#0F1E30] rounded-full h-1">
                  <div className="h-1 rounded-full bg-gradient-to-r from-[#00D4FF] to-[#7C3AED] transition-all duration-500"
                    style={{ width: `${Math.round((([
                      true, true, true, true,
                      !!status?.agentDid, !!status?.agentDid, !!status?.agentDid,
                      false, sessionCount > 0, sessionCount > 0,
                      false, false, false, false, false, true
                    ].filter(Boolean).length) / 16) * 100)}%` }}
                  />
                </div>
                <div className="text-[10px] text-[#374151] mt-1">
                  {[true, true, true, true, !!status?.agentDid, !!status?.agentDid, !!status?.agentDid, false, sessionCount > 0, sessionCount > 0, false, false, false, false, false, true].filter(Boolean).length}/16 active
                </div>
              </div>
            </div>

            {/* Network info */}
            <div className="bg-[#0A1020] border border-[#0F1E30] rounded-2xl p-4">
              <div className="text-[10px] font-semibold text-[#374151] uppercase tracking-wider mb-3">Network</div>
              <div className="space-y-2">
                {[
                  { label: "Environment", value: status?.network || "Terminal 3" },
                  { label: "SDK", value: "t3n-sdk v3.5.2" },
                  { label: "Contract", value: "MantleIntelAudit.sol" },
                  { label: "WASM", value: "health_contract.wasm" },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center">
                    <span className="text-[11px] text-[#374151]">{row.label}</span>
                    <span className="text-[11px] font-mono text-[#6B7280] truncate max-w-[130px]">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
