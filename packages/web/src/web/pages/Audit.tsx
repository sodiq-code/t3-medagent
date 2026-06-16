import { useState, useEffect } from "react";
import {
  FileText, RefreshCw, AlertCircle, Info, Bug,
  ChevronDown, ChevronUp, Clock, Download, Filter,
  ArrowLeft, Activity, Brain, Shield, Zap,
  MessageSquare, CheckCircle, AlertTriangle, TrendingUp
} from "lucide-react";
import { hc } from "hono/client";
import type { AppType } from "../../api";
import AppShell from "../components/AppShell";
import { Link } from "wouter";

const client = hc<AppType>("/");

const STORAGE_KEY = "t3_chat_messages";

interface AuditEvent {
  id: string;
  contractTail: string;
  functionName: string;
  level: "info" | "debug" | "error";
  message: string;
  tsMs: number;
  spanId: number | null;
}

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
}

interface ChatMessage {
  id: string;
  role: "user" | "agent";
  content: string;
  analysis?: AnalysisResult;
  timestamp: string;
  executionTime?: number;
}

const LEVEL_CONFIG = {
  info:  { icon: Info,         color: "#00D4FF", label: "INFO" },
  debug: { icon: Bug,          color: "#7C3AED", label: "DEBUG" },
  error: { icon: AlertCircle,  color: "#EF4444", label: "ERROR" },
};

const RISK_CONFIG: Record<string, { color: string; label: string; bg: string }> = {
  low:      { color: "#10B981", label: "LOW",      bg: "#10B981" },
  medium:   { color: "#F59E0B", label: "MEDIUM",   bg: "#F59E0B" },
  high:     { color: "#F97316", label: "HIGH",     bg: "#F97316" },
  critical: { color: "#EF4444", label: "CRITICAL", bg: "#EF4444" },
};

function RecentAnalysisCard({ msg, userMsg }: { msg: ChatMessage; userMsg?: ChatMessage }) {
  const [expanded, setExpanded] = useState(false);
  const analysis = msg.analysis!;
  const cfg = RISK_CONFIG[analysis.risk_level] || RISK_CONFIG.medium;

  return (
    <div
      className="bg-[#080E1A] border rounded-2xl overflow-hidden transition-all hover:border-opacity-60"
      style={{ borderColor: `${cfg.color}20` }}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3" style={{ background: `${cfg.color}08` }}>
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
        <span className="text-xs font-bold tracking-wide flex-1" style={{ color: cfg.color }}>
          {cfg.label} RISK
        </span>
        <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
          style={{ background: `${cfg.color}15`, color: cfg.color }}>
          {Math.round(analysis.confidence * 100)}%
        </span>
        {msg.executionTime && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#7C3AED]/10 text-[#7C3AED] border border-[#7C3AED]/20 font-mono">
            {msg.executionTime}ms
          </span>
        )}
        <span className="text-[10px] text-[#2D3748]">
          {new Date(msg.timestamp).toLocaleString([], {
            month: "short", day: "numeric",
            hour: "2-digit", minute: "2-digit"
          })}
        </span>
      </div>

      {/* Symptoms */}
      {userMsg && (
        <div className="px-4 pt-3 pb-1">
          <div className="text-[10px] text-[#374151] uppercase tracking-wider mb-1 font-semibold">Symptoms</div>
          <p className="text-xs text-[#6B7280] leading-relaxed">{userMsg.content}</p>
        </div>
      )}

      {/* Recommendation */}
      <div className="px-4 py-3">
        <p className="text-sm text-[#D1D5DB] leading-relaxed">{analysis.recommendation}</p>
      </div>

      {/* Tags */}
      <div className="px-4 pb-3 flex flex-wrap gap-1.5">
        {analysis.specialist_needed && (
          <span className="text-[11px] px-2.5 py-1 rounded-lg bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20">
            {analysis.specialist_type || "Specialist needed"}
          </span>
        )}
        {analysis.differential_diagnoses?.slice(0, 3).map((d, i) => (
          <span key={i} className="text-[11px] px-2.5 py-1 rounded-lg bg-[#0F1E30] text-[#4B5563] border border-[#1A2940]">{d}</span>
        ))}
      </div>

      {/* Expand */}
      {(analysis.red_flags?.length || analysis.home_care?.length) ? (
        <>
          <div className="border-t border-[#0F1E30]">
            <button
              onClick={() => setExpanded(e => !e)}
              className="w-full px-4 py-2 flex items-center justify-between text-xs text-[#4B5563] hover:text-[#9CA3AF] transition-all"
            >
              <span>{expanded ? "Less" : "Details"}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
            </button>
          </div>
          {expanded && (
            <div className="px-4 pb-4 pt-1 space-y-3 border-t border-[#0F1E30]">
              {analysis.red_flags?.length ? (
                <div>
                  <div className="text-[10px] font-semibold text-[#EF4444]/60 uppercase tracking-wider mb-1.5">Red flags</div>
                  <ul className="space-y-1">
                    {analysis.red_flags.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-[11px] text-[#EF4444]/70">
                        <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {analysis.home_care?.length ? (
                <div>
                  <div className="text-[10px] font-semibold text-[#10B981]/60 uppercase tracking-wider mb-1.5">Self-care</div>
                  <ul className="space-y-1">
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
      ) : null}
    </div>
  );
}

export default function Audit() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [summary, setSummary] = useState<{ total: number; byLevel: Record<string, number> } | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    loadEvents();
    // Load chat history from localStorage
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setChatMessages(JSON.parse(saved));
    } catch {}
  }, []);

  async function loadEvents() {
    setLoading(true);
    try {
      const [evRes, sumRes] = await Promise.all([
        client.api.audit.events.$get(),
        client.api.audit.summary.$get(),
      ]);
      const evData = await evRes.json();
      const sumData = await sumRes.json();
      setEvents((evData as any).events || []);
      setSummary(sumData as any);
    } catch {}
    finally { setLoading(false); }
  }

  function exportEvents() {
    const data = {
      exportedAt: new Date().toISOString(),
      summary,
      events,
      chatAnalyses: analysisMessages.map(m => ({
        timestamp: m.timestamp,
        risk_level: m.analysis?.risk_level,
        confidence: m.analysis?.confidence,
        recommendation: m.analysis?.recommendation,
      })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `t3-medagent-audit-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const filtered = filter === "all" ? events : events.filter(e => e.level === filter);

  // Extract analysis messages and pair with preceding user message
  const analysisMessages = chatMessages.filter(m => m.role === "agent" && m.analysis);
  const analysisWithContext = analysisMessages.map((msg) => {
    const idx = chatMessages.indexOf(msg);
    const userMsg = chatMessages.slice(0, idx).reverse().find(m => m.role === "user");
    return { msg, userMsg };
  }).reverse(); // newest first

  const totalAnalyses = analysisMessages.length;
  const criticalCount = analysisMessages.filter(m => m.analysis?.risk_level === "critical" || m.analysis?.risk_level === "high").length;

  return (
    <AppShell>
      <div className="min-h-screen bg-[#050A14] text-white">

        {/* Page header */}
        <div className="border-b border-[#0F1E30] bg-[#080E1A]/80 backdrop-blur-xl px-8 py-5 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <button className="flex items-center gap-2 px-3 py-1.5 bg-[#0F1E30] border border-[#1A2940] rounded-xl text-sm text-[#6B7280] hover:text-white hover:border-[#00D4FF]/30 hover:bg-[#00D4FF]/5 transition-all">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Chat
                </button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white">On-Chain Audit Log</h1>
                <p className="text-xs text-[#374151] mt-0.5">
                  Immutable trail via <span className="font-mono text-[#00D4FF]/60">contracts.logs()</span> · Terminal 3 TEE
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadEvents}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-[#0F1E30] border border-[#1A2940] rounded-xl text-sm text-[#9CA3AF] hover:text-white hover:border-[#00D4FF]/30 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#00D4FF]" : ""}`} />
                Refresh
              </button>
              <button
                onClick={exportEvents}
                className="flex items-center gap-2 px-4 py-2 bg-[#0F1E30] border border-[#1A2940] rounded-xl text-sm text-[#9CA3AF] hover:text-white hover:border-[#10B981]/30 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                Export JSON
              </button>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 space-y-8">

          {/* ── SECTION 1: Recent Analyses from Chat ──────────────── */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-xl bg-[#7C3AED]/15 border border-[#7C3AED]/20 flex items-center justify-center">
                  <Brain className="w-3.5 h-3.5 text-[#7C3AED]" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Recent Analyses</h2>
                  <p className="text-[11px] text-[#374151]">From your current session · stored locally</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-xs text-[#374151]">
                  <MessageSquare className="w-3.5 h-3.5" />
                  {totalAnalyses} total
                </div>
                {criticalCount > 0 && (
                  <span className="text-[11px] px-2.5 py-1 rounded-lg bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20">
                    {criticalCount} high/critical
                  </span>
                )}
                <Link href="/dashboard">
                  <button className="text-xs text-[#00D4FF] hover:text-[#00BBDF] transition-colors flex items-center gap-1.5">
                    Open Chat
                    <ArrowLeft className="w-3 h-3 rotate-180" />
                  </button>
                </Link>
              </div>
            </div>

            {analysisWithContext.length === 0 ? (
              <div className="bg-[#080E1A] border border-[#0F1E30] rounded-2xl p-10 text-center">
                <div className="w-12 h-12 bg-[#0F1E30] rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="w-5 h-5 text-[#1F2937]" />
                </div>
                <p className="text-[#6B7280] font-medium text-sm mb-1">No analyses yet</p>
                <p className="text-[#374151] text-xs">
                  Run a health analysis in the chat — results will appear here.
                </p>
                <Link href="/dashboard">
                  <button className="mt-4 px-4 py-2 bg-[#00D4FF]/10 border border-[#00D4FF]/20 text-[#00D4FF] rounded-xl text-xs hover:bg-[#00D4FF]/15 transition-all">
                    Go to Chat →
                  </button>
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {analysisWithContext.map(({ msg, userMsg }) => (
                  <RecentAnalysisCard key={msg.id} msg={msg} userMsg={userMsg} />
                ))}
              </div>
            )}
          </section>

          {/* ── SECTION 2: TEE Contract Audit Events ─────────────── */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-7 h-7 rounded-xl bg-[#00D4FF]/10 border border-[#00D4FF]/20 flex items-center justify-center">
                <FileText className="w-3.5 h-3.5 text-[#00D4FF]" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">TEE Contract Events</h2>
                <p className="text-[11px] text-[#374151]">On-chain via <code className="font-mono text-[#00D4FF]/60">tenant.contracts.logs("health-check")</code></p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {[
                { label: "Total Events", value: summary?.total ?? 0,              color: "#00D4FF", icon: Activity },
                { label: "Info",         value: summary?.byLevel?.info ?? 0,      color: "#00D4FF", icon: Info },
                { label: "Debug",        value: summary?.byLevel?.debug ?? 0,     color: "#7C3AED", icon: Bug },
                { label: "Errors",       value: summary?.byLevel?.error ?? 0,     color: "#EF4444", icon: AlertCircle },
              ].map(s => {
                const SIcon = s.icon;
                return (
                  <div key={s.label}
                    className="bg-[#080E1A] border rounded-2xl p-4 hover:border-opacity-40 transition-all"
                    style={{ borderColor: `${s.color}15` }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <SIcon className="w-3.5 h-3.5" style={{ color: s.color }} />
                    </div>
                    <div className="text-2xl font-bold mb-0.5" style={{ color: s.color }}>{s.value}</div>
                    <div className="text-[10px] text-[#374151] uppercase tracking-wider">{s.label}</div>
                  </div>
                );
              })}
            </div>

            {/* Source banner */}
            <div className="bg-[#080E1A] border border-[#00D4FF]/10 rounded-2xl p-4 flex items-start gap-3 mb-4">
              <div className="w-7 h-7 rounded-xl bg-[#00D4FF]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Shield className="w-3.5 h-3.5 text-[#00D4FF]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Live from Terminal 3 TEE</p>
                <p className="text-xs text-[#374151] mt-0.5 leading-relaxed">
                  Every AI analysis executed inside the TEE creates immutable audit entries via{" "}
                  <code className="text-[#00D4FF]/70 font-mono">tenant.contracts.logs("health-check")</code>.
                  These records are cryptographically sealed and cannot be altered.
                </p>
              </div>
            </div>

            {/* Filter tabs */}
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-3.5 h-3.5 text-[#374151]" />
              {["all", "info", "debug", "error"].map(lvl => (
                <button
                  key={lvl}
                  onClick={() => setFilter(lvl)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize
                    ${filter === lvl
                      ? "bg-[#00D4FF]/15 text-[#00D4FF] border border-[#00D4FF]/20"
                      : "text-[#374151] hover:text-[#9CA3AF] border border-transparent"
                    }`}
                >
                  {lvl}{lvl !== "all" && summary?.byLevel?.[lvl] ? ` (${summary.byLevel[lvl]})` : ""}
                </button>
              ))}
            </div>

            {/* Events table */}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="flex items-center gap-3 text-[#374151]">
                  <RefreshCw className="w-5 h-5 animate-spin text-[#00D4FF]" />
                  <span className="text-sm">Loading audit trail...</span>
                </div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-[#080E1A] border border-[#0F1E30] rounded-2xl p-14 text-center">
                <div className="w-12 h-12 bg-[#0F1E30] rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-5 h-5 text-[#1F2937]" />
                </div>
                <p className="text-[#6B7280] font-medium text-sm mb-1">No contract events</p>
                <p className="text-[#374151] text-xs">Run a health analysis to generate TEE contract logs.</p>
              </div>
            ) : (
              <div className="bg-[#080E1A] border border-[#0F1E30] rounded-2xl overflow-hidden">
                {/* Table header */}
                <div className="grid grid-cols-[90px_1fr_160px_110px_110px] gap-4 px-5 py-3 border-b border-[#0F1E30] text-[10px] font-semibold text-[#374151] uppercase tracking-wider">
                  <div>Level</div>
                  <div>Message</div>
                  <div>Function</div>
                  <div>Contract</div>
                  <div>Time</div>
                </div>

                {filtered.map((event, i) => {
                  const cfg = LEVEL_CONFIG[event.level] || LEVEL_CONFIG.info;
                  const LvlIcon = cfg.icon;
                  const isOpen = expanded === event.id;
                  return (
                    <div key={event.id}
                      className={`border-b border-[#0F1E30] last:border-0 ${i % 2 === 0 ? "" : "bg-[#0A1020]/20"}`}
                    >
                      <button
                        className="w-full grid grid-cols-[90px_1fr_160px_110px_110px] gap-4 px-5 py-3.5 hover:bg-[#0F1E30]/40 transition-colors text-left items-center"
                        onClick={() => setExpanded(isOpen ? null : event.id)}
                      >
                        <div>
                          <span className="inline-flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-lg border font-semibold"
                            style={{ color: cfg.color, background: `${cfg.color}12`, borderColor: `${cfg.color}20` }}
                          >
                            <LvlIcon className="w-3 h-3" />
                            {cfg.label}
                          </span>
                        </div>
                        <div className="text-sm text-[#D1D5DB] truncate pr-4">{event.message}</div>
                        <div className="text-xs font-mono text-[#7C3AED] truncate">{event.functionName}</div>
                        <div className="text-xs font-mono text-[#374151] truncate">{event.contractTail}</div>
                        <div className="flex items-center gap-2 text-xs text-[#374151]">
                          <Clock className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{new Date(event.tsMs).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
                          {isOpen
                            ? <ChevronUp className="w-3 h-3 ml-auto flex-shrink-0" />
                            : <ChevronDown className="w-3 h-3 ml-auto flex-shrink-0" />}
                        </div>
                      </button>

                      {isOpen && (
                        <div className="px-5 pb-4 pt-1 border-t border-[#0F1E30]/50">
                          <pre className="text-xs font-mono text-[#4B5563] bg-[#050A14] border border-[#0F1E30] rounded-xl p-4 overflow-x-auto">
                            {JSON.stringify(event, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Footer */}
          <div className="border-t border-[#0F1E30] pt-6 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-[#2D3748]">
              <Zap className="w-3.5 h-3.5 text-[#00D4FF]/30" />
              <span className="font-mono">T3 MedAgent · Terminal 3 ADK Bounty · June 2026</span>
            </div>
            <Link href="/dashboard">
              <button className="flex items-center gap-2 text-xs text-[#374151] hover:text-[#00D4FF] transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Chat
              </button>
            </Link>
          </div>

        </div>
      </div>
    </AppShell>
  );
}
