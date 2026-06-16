import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send, Loader2, AlertTriangle, Zap, Activity,
  Brain, CheckCircle, Shield, TrendingUp, Hash,
  Clock, ChevronDown, Copy, RefreshCw, Cpu,
  MapPin, Stethoscope, ChevronRight, FileText,
  Sparkles, X, Plus, MoreHorizontal
} from "lucide-react";
import { hc } from "hono/client";
import type { AppType } from "../../api";
import AppShell from "../components/AppShell";
import { Link } from "wouter";

const client = hc<AppType>("/");

const STORAGE_KEY = "t3_chat_messages";

interface AnalysisResult {
  risk_level: "low" | "medium" | "high" | "critical";
  recommendation: string;
  specialist_needed: boolean;
  specialist_type?: string;
  confidence: number;
  analysis_id: string;
  differential_diagnoses?: string[];
  red_flags?: string[];
  home_care?: string[];
  follow_up?: string;
  powered_by?: "ai" | "rule-engine";
  tee_verified?: boolean;
}

interface HospitalResult {
  id: string;
  name: string;
  city: string;
  country: string;
  specialties: string[];
  tier: string;
  rating: number;
  emergency: boolean;
  address: string;
}

interface Message {
  id: string;
  role: "user" | "agent";
  content: string;
  analysis?: AnalysisResult;
  hospitals?: HospitalResult[];
  timestamp: string;
  executionTime?: number;
  ai_powered?: boolean;
}

interface AgentStatus {
  status: string;
  agentDid?: string;
  agentAddress?: string;
  network?: string;
}

const RISK_CONFIG: Record<string, { color: string; label: string; glow: string }> = {
  low:      { color: "#10B981", label: "LOW RISK",     glow: "shadow-[0_0_12px_#10B98130]" },
  medium:   { color: "#F59E0B", label: "MEDIUM RISK",  glow: "shadow-[0_0_12px_#F59E0B30]" },
  high:     { color: "#F97316", label: "HIGH RISK",    glow: "shadow-[0_0_12px_#F9731630]" },
  critical: { color: "#EF4444", label: "CRITICAL",     glow: "shadow-[0_0_12px_#EF444430]" },
};

const QUICK_PROMPTS = [
  "Headache and fever for 2 days",
  "Chest pain and shortness of breath",
  "Persistent cough with fatigue",
  "Severe abdominal pain",
];

const INIT_MESSAGE: Message = {
  id: "init",
  role: "agent",
  content: "Hello! I'm **T3 MedAgent** — your AI-powered, privacy-preserving health navigator.\n\nI run inside a Terminal 3 Trusted Execution Environment (TEE). Describe your symptoms and I'll give you a detailed assessment with differential diagnoses, care advice, and hospital recommendations.\n\nYour data never leaves the TEE unencrypted.",
  timestamp: new Date().toISOString(),
};

function TypingIndicator() {
  return (
    <div className="flex gap-3 items-end">
      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#00D4FF]/20 to-[#7C3AED]/20 border border-[#00D4FF]/20 flex items-center justify-center flex-shrink-0">
        <Activity className="w-3.5 h-3.5 text-[#00D4FF]" />
      </div>
      <div className="bg-[#0D1525] border border-[#1A2940] rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
        <Loader2 className="w-3.5 h-3.5 text-[#00D4FF] animate-spin" />
        <span className="text-xs text-[#6B7280]">Analyzing</span>
        <div className="flex gap-1">
          {[0,1,2].map(i => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#00D4FF]/50 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function AnalysisCard({ analysis, hospitals, execTime }: {
  analysis: AnalysisResult;
  hospitals?: HospitalResult[];
  execTime?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = RISK_CONFIG[analysis.risk_level] || RISK_CONFIG.medium;

  return (
    <div className={`w-full bg-[#0D1525] border rounded-2xl overflow-hidden ${cfg.glow}`}
      style={{ borderColor: `${cfg.color}30` }}
    >
      {/* Risk banner */}
      <div className="px-4 py-3 flex items-center gap-3" style={{ background: `${cfg.color}10` }}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-2 h-2 rounded-full animate-pulse flex-shrink-0" style={{ background: cfg.color }} />
          <span className="text-sm font-bold tracking-wide" style={{ color: cfg.color }}>{cfg.label}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {analysis.tee_verified && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/20 font-semibold">TEE</span>
          )}
          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: `${cfg.color}15`, color: cfg.color }}>
            {Math.round(analysis.confidence * 100)}% conf.
          </span>
          {execTime && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#7C3AED]/10 text-[#7C3AED] border border-[#7C3AED]/20 font-mono">
              {execTime}ms
            </span>
          )}
        </div>
      </div>

      {/* Confidence bar */}
      <div className="h-0.5 bg-[#0F1E30]">
        <div className="h-full transition-all duration-1000" style={{ width: `${analysis.confidence * 100}%`, background: `linear-gradient(to right, ${cfg.color}, ${cfg.color}99)` }} />
      </div>

      {/* Recommendation */}
      <div className="px-4 py-3.5">
        <p className="text-sm text-[#D1D5DB] leading-relaxed">{analysis.recommendation}</p>
      </div>

      {/* Tags */}
      {(analysis.specialist_needed || analysis.follow_up) && (
        <div className="px-4 pb-3 flex flex-wrap gap-1.5">
          {analysis.specialist_needed && (
            <span className="text-[11px] px-2.5 py-1 rounded-lg bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20 flex items-center gap-1.5">
              <Stethoscope className="w-3 h-3" />
              {analysis.specialist_type || "Specialist needed"}
            </span>
          )}
          {analysis.follow_up && (
            <span className="text-[11px] px-2.5 py-1 rounded-lg bg-[#0F1E30] text-[#6B7280] border border-[#1A2940] flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              {analysis.follow_up}
            </span>
          )}
        </div>
      )}

      {/* Expand toggle */}
      {(analysis.differential_diagnoses?.length || analysis.red_flags?.length || analysis.home_care?.length) && (
        <>
          <div className="border-t border-[#0F1E30]">
            <button
              onClick={() => setExpanded(e => !e)}
              className="w-full px-4 py-2.5 flex items-center justify-between text-xs text-[#4B5563] hover:text-[#9CA3AF] hover:bg-[#0A1020] transition-all"
            >
              <span>{expanded ? "Hide details" : "View full analysis"}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
            </button>
          </div>

          {expanded && (
            <div className="px-4 pb-4 space-y-4 border-t border-[#0F1E30] pt-4">
              {analysis.differential_diagnoses?.length ? (
                <div>
                  <div className="text-[10px] font-semibold text-[#374151] uppercase tracking-wider mb-2">Possible conditions</div>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.differential_diagnoses.map((d, i) => (
                      <span key={i} className="text-[11px] px-2.5 py-1 rounded-lg bg-[#0F1E30] text-[#9CA3AF] border border-[#1A2940]">{d}</span>
                    ))}
                  </div>
                </div>
              ) : null}
              {analysis.red_flags?.length ? (
                <div>
                  <div className="text-[10px] font-semibold text-[#EF4444]/60 uppercase tracking-wider mb-2">Red flags — seek help immediately if any occur</div>
                  <ul className="space-y-1.5">
                    {analysis.red_flags.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-[11px] text-[#EF4444]/80">
                        <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {analysis.home_care?.length ? (
                <div>
                  <div className="text-[10px] font-semibold text-[#10B981]/60 uppercase tracking-wider mb-2">Self-care steps</div>
                  <ul className="space-y-1.5">
                    {analysis.home_care.map((c, i) => (
                      <li key={i} className="flex items-start gap-2 text-[11px] text-[#6B7280]">
                        <CheckCircle className="w-3 h-3 flex-shrink-0 mt-0.5 text-[#10B981]/60" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}
        </>
      )}

      {/* Hospitals */}
      {hospitals && hospitals.length > 0 && (
        <div className="border-t border-[#0F1E30] px-4 pt-3 pb-4">
          <div className="text-[10px] font-semibold text-[#374151] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <MapPin className="w-3 h-3" /> Recommended hospitals
          </div>
          <div className="space-y-2">
            {hospitals.slice(0, 2).map((h) => (
              <div key={h.id} className="bg-[#080E1A] rounded-xl p-3 border border-[#0F1E30] hover:border-[#1A2940] transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white truncate">{h.name}</div>
                    <div className="text-[11px] text-[#6B7280] flex items-center gap-1 mt-0.5">
                      <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                      {h.city}, {h.country}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-[11px] text-[#F59E0B] font-semibold">★ {h.rating}</span>
                    {h.emergency && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20">24/7</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {h.specialties.slice(0, 3).map(s => (
                    <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-[#0F1E30] text-[#4B5563]">{s}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div className={`w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-[11px] font-bold self-end mb-1
        ${isUser
          ? "bg-[#7C3AED]/20 border border-[#7C3AED]/30 text-[#7C3AED]"
          : "bg-gradient-to-br from-[#00D4FF]/20 to-[#7C3AED]/20 border border-[#00D4FF]/20 text-[#00D4FF]"
        }`}>
        {isUser ? "U" : <Activity className="w-3.5 h-3.5" />}
      </div>

      <div className={`flex flex-col gap-2 max-w-[82%] ${isUser ? "items-end" : "items-start"}`}>
        {msg.content && (
          <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
            ${isUser
              ? "bg-gradient-to-br from-[#7C3AED]/25 to-[#5B21B6]/20 border border-[#7C3AED]/25 text-white rounded-br-sm"
              : "bg-[#0D1525] border border-[#1A2940] text-[#D1D5DB] rounded-bl-sm"
            }`}>
            {msg.content.replace(/\*\*(.*?)\*\*/g, '$1')}
          </div>
        )}
        {msg.analysis && (
          <AnalysisCard analysis={msg.analysis} hospitals={msg.hospitals} execTime={msg.executionTime} />
        )}
        <div className="text-[10px] text-[#2D3748] px-1">
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [INIT_MESSAGE];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [initing, setIniting] = useState(false);
  const [copied, setCopied] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const analysisMessages = messages.filter(m => m.analysis);
  const sessionCount = analysisMessages.length;
  const avgConfidence = sessionCount > 0
    ? Math.round(analysisMessages.reduce((s, m) => s + (m.analysis?.confidence ?? 0), 0) / sessionCount * 100)
    : 0;
  const lastRisk = analysisMessages[analysisMessages.length - 1]?.analysis?.risk_level;
  const sdkActive = 7 + (sessionCount > 0 ? 2 : 0);

  // Persist messages to localStorage
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages)); } catch {}
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

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
        addAgentMessage("✅ T3 session initialized. DID minted. Tenant claimed. TEE ready for encrypted analysis.");
      }
    } catch {
      addAgentMessage("Session init attempted — running in AI + TEE simulation mode.");
    } finally { setIniting(false); }
  }

  function addAgentMessage(content: string, extra?: {
    analysis?: AnalysisResult; hospitals?: HospitalResult[];
    execTime?: number; ai_powered?: boolean;
  }) {
    const msg: Message = {
      id: Date.now().toString(),
      role: "agent",
      content,
      analysis: extra?.analysis,
      hospitals: extra?.hospitals,
      timestamp: new Date().toISOString(),
      executionTime: extra?.execTime,
      ai_powered: extra?.ai_powered,
    };
    setMessages(m => [...m, msg]);
  }

  function buildContext() {
    return messages.slice(-6)
      .map(m => `${m.role === "user" ? "Patient" : "Agent"}: ${m.content.slice(0, 200)}`)
      .join("\n");
  }

  async function handleSend(text?: string) {
    const userMsg = (text || input).trim();
    if (!userMsg || loading) return;
    setInput("");

    const userMsgObj: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userMsg,
      timestamp: new Date().toISOString(),
    };
    setMessages(m => [...m, userMsgObj]);
    setLoading(true);
    const t0 = Date.now();

    try {
      const symptoms = userMsg.split(/[,;.]+/).map(s => s.trim()).filter(s => s.length > 2);
      if (symptoms.length === 0) symptoms.push(userMsg);

      const lowerMsg = userMsg.toLowerCase();
      const severity = lowerMsg.includes("severe") || lowerMsg.includes("extreme") ? "severe"
        : lowerMsg.includes("mild") || lowerMsg.includes("slight") ? "mild" : "moderate";

      const durationMatch = userMsg.match(/(\d+)\s*day/i);
      const duration_days = durationMatch ? parseInt(durationMatch[1]) : undefined;

      const res = await (client.api.health.analyze as any).$post({
        json: { symptoms, severity, duration_days, context: buildContext() }
      });

      const data = await res.json() as any;
      addAgentMessage("", {
        analysis: data.result,
        hospitals: data.hospitals ?? [],
        execTime: Date.now() - t0,
        ai_powered: data.ai_powered,
      });
    } catch {
      addAgentMessage("Analysis service temporarily unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function clearHistory() {
    setMessages([INIT_MESSAGE]);
  }

  function copyDid() {
    if (status?.agentDid) {
      navigator.clipboard.writeText(status.agentDid);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <AppShell>
      <div className="flex h-screen overflow-hidden bg-[#050A14]">

        {/* ── CENTER: Chat ─────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Header */}
          <div className="h-14 border-b border-[#0F1E30] flex items-center px-5 gap-3 bg-[#080E1A]/90 backdrop-blur-xl flex-shrink-0">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse flex-shrink-0" />
              <span className="text-sm font-semibold text-white">Health Console</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/20 font-semibold hidden sm:inline">AI + TEE</span>
              <span className="text-[10px] text-[#2D3748] font-mono hidden lg:block ml-1">GPT-4o-mini · contracts.execute()</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Link href="/audit">
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#6B7280] hover:text-[#00D4FF] hover:bg-[#00D4FF]/5 border border-transparent hover:border-[#00D4FF]/20 rounded-lg transition-all">
                  <FileText className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Audit Log</span>
                </button>
              </Link>
              <button onClick={clearHistory} className="p-1.5 text-[#374151] hover:text-[#EF4444]/70 hover:bg-[#EF4444]/5 rounded-lg transition-all" title="Clear chat">
                <X className="w-3.5 h-3.5" />
              </button>
              <button onClick={loadStatus} className="p-1.5 text-[#374151] hover:text-[#9CA3AF] rounded-lg hover:bg-[#0F1E30] transition-all" title="Refresh status">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
            {loading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          {/* Quick prompts */}
          <div className="px-5 pb-2 flex gap-2 flex-wrap flex-shrink-0">
            {QUICK_PROMPTS.map(p => (
              <button key={p} onClick={() => handleSend(p)} disabled={loading}
                className="text-[11px] px-3 py-1.5 rounded-full bg-[#0D1525] text-[#4B5563] border border-[#1A2940] hover:border-[#00D4FF]/30 hover:text-[#9CA3AF] hover:bg-[#0D1525] transition-all disabled:opacity-30"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="border-t border-[#0F1E30] px-5 py-4 bg-[#080E1A]/90 backdrop-blur-xl flex-shrink-0">
            <div className="flex gap-3 items-center">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                  placeholder="Describe your symptoms in detail..."
                  className="w-full bg-[#0D1525] border border-[#1A2940] rounded-xl px-4 py-3 text-white placeholder-[#2D3748] focus:outline-none focus:border-[#00D4FF]/40 focus:bg-[#0F1E30] text-sm transition-all pr-10"
                  disabled={loading}
                />
                {input && (
                  <button onClick={() => setInput("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#374151] hover:text-[#6B7280]">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className="w-11 h-11 rounded-xl flex items-center justify-center bg-[#00D4FF] text-[#050A14] hover:bg-[#00BBDF] active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0 font-bold"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-[#1F2937] text-center mt-2.5">
              Secured inside <span className="text-[#00D4FF]/40 font-mono">Terminal 3 TEE</span> · AI-powered via GPT-4o-mini
            </p>
          </div>
        </div>

        {/* ── RIGHT PANEL ──────────────────────────────────────────────── */}
        <div className="w-72 border-l border-[#0F1E30] flex-col bg-[#080E1A] hidden xl:flex flex-shrink-0">
          {/* Panel header */}
          <div className="h-14 border-b border-[#0F1E30] flex items-center px-5 gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#00D4FF]/60" />
            <span className="text-xs font-semibold text-[#374151] uppercase tracking-wider">Agent Identity</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Analyses", value: sessionCount, color: "#00D4FF", icon: Brain },
                { label: "Avg Conf.", value: avgConfidence ? `${avgConfidence}%` : "—", color: "#7C3AED", icon: Cpu },
                {
                  label: "Last Risk",
                  value: lastRisk ? lastRisk.toUpperCase() : "—",
                  color: lastRisk ? RISK_CONFIG[lastRisk]?.color : "#374151",
                  icon: Shield
                },
                { label: "Primitives", value: `${sdkActive}/16`, color: "#10B981", icon: Zap },
              ].map(m => (
                <div key={m.label} className="bg-[#0A1020] border rounded-xl p-3 hover:border-opacity-50 transition-all"
                  style={{ borderColor: `${m.color}15` }}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <m.icon className="w-3.5 h-3.5" style={{ color: m.color }} />
                  </div>
                  <div className="text-lg font-bold leading-none mb-1" style={{ color: m.color }}>{m.value}</div>
                  <div className="text-[10px] text-[#374151] uppercase tracking-wider">{m.label}</div>
                </div>
              ))}
            </div>

            {/* DID Card */}
            <div className="bg-[#0A1020] border border-[#0F1E30] rounded-2xl p-4">
              {status?.agentDid ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-[#374151] uppercase tracking-wider font-semibold">Agent DID</span>
                    <button onClick={copyDid} className="text-[#374151] hover:text-[#00D4FF] transition-colors p-1 rounded">
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
                  <div className="mt-2.5 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                    <span className="text-[11px] text-[#10B981]">Session active · TEE ready</span>
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
                    className="w-full bg-gradient-to-r from-[#00D4FF]/15 to-[#7C3AED]/15 border border-[#00D4FF]/20 text-[#00D4FF] py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 hover:from-[#00D4FF]/25 hover:to-[#7C3AED]/25 transition-all active:scale-98"
                  >
                    {initing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                    Initialize T3 Session
                  </button>
                </div>
              )}
            </div>

            {/* SDK Primitives */}
            <div className="bg-[#0A1020] border border-[#0F1E30] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[10px] font-semibold text-[#374151] uppercase tracking-wider">SDK Coverage</div>
                <div className="text-[10px] font-mono text-[#374151]">{sdkActive}/16</div>
              </div>
              <div className="w-full bg-[#0F1E30] rounded-full h-1 mb-3">
                <div className="h-1 rounded-full bg-gradient-to-r from-[#00D4FF] to-[#7C3AED] transition-all duration-500"
                  style={{ width: `${Math.round((sdkActive / 16) * 100)}%` }} />
              </div>
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
                    <span className={`text-[11px] font-mono flex-1 ${p.done ? "text-[#6B7280]" : "text-[#2D3748]"}`}>{p.name}</span>
                    {p.done && <CheckCircle className="w-3 h-3 text-[#10B981]/40 flex-shrink-0" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Quick links */}
            <div className="bg-[#0A1020] border border-[#0F1E30] rounded-2xl overflow-hidden">
              {[
                { href: "/audit", icon: FileText, label: "View Audit Log", color: "#00D4FF" },
                { href: "/delegation", icon: Shield, label: "Manage Delegation", color: "#7C3AED" },
                { href: "/verify", icon: CheckCircle, label: "Verify TEE Node", color: "#10B981" },
                { href: "/onboard", icon: Zap, label: "Onboarding", color: "#F59E0B" },
              ].map((item, i) => (
                <Link key={item.href} href={item.href}>
                  <div className={`flex items-center gap-3 px-4 py-3 hover:bg-[#0F1E30] transition-colors cursor-pointer ${i > 0 ? "border-t border-[#0F1E30]" : ""}`}>
                    <item.icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: item.color }} />
                    <span className="text-xs text-[#6B7280] hover:text-[#9CA3AF] flex-1">{item.label}</span>
                    <ChevronRight className="w-3 h-3 text-[#2D3748]" />
                  </div>
                </Link>
              ))}
            </div>

            {/* Stack info */}
            <div className="bg-[#0A1020] border border-[#0F1E30] rounded-2xl p-4">
              <div className="text-[10px] font-semibold text-[#374151] uppercase tracking-wider mb-3">Stack</div>
              <div className="space-y-2">
                {[
                  { label: "AI Engine", value: "GPT-4o-mini" },
                  { label: "TEE", value: "Terminal 3" },
                  { label: "SDK", value: "t3n-sdk v3.5.2" },
                  { label: "Contract", value: "health-check v1.0" },
                  { label: "Network", value: status?.network || "testnet" },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center">
                    <span className="text-[11px] text-[#374151]">{row.label}</span>
                    <span className="text-[11px] font-mono text-[#4B5563] truncate max-w-[110px]">{row.value}</span>
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
