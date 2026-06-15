import { useState, useEffect } from "react";
import {
  FileText, RefreshCw, AlertCircle, Info, Bug,
  ChevronDown, ChevronUp, Hash, Clock, Download, Filter
} from "lucide-react";
import { hc } from "hono/client";
import type { AppType } from "../../api";
import AppShell from "../components/AppShell";

const client = hc<AppType>("/");

interface AuditEvent {
  id: string;
  contractTail: string;
  functionName: string;
  level: "info" | "debug" | "error";
  message: string;
  tsMs: number;
  spanId: number | null;
}

const LEVEL_CONFIG = {
  info:  { icon: Info,         color: "#00D4FF", bg: "#00D4FF/10", border: "#00D4FF/20", label: "INFO" },
  debug: { icon: Bug,          color: "#7C3AED", bg: "#7C3AED/10", border: "#7C3AED/20", label: "DEBUG" },
  error: { icon: AlertCircle,  color: "#EF4444", bg: "#EF4444/10", border: "#EF4444/20", label: "ERROR" },
};

export default function Audit() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [summary, setSummary] = useState<{ total: number; byLevel: Record<string, number> } | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => { loadEvents(); }, []);

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

  const filtered = filter === "all" ? events : events.filter(e => e.level === filter);

  return (
    <AppShell>
      <div className="min-h-screen bg-[#050A14] text-white">
        {/* Page header */}
        <div className="border-b border-[#0F1E30] bg-[#080E1A]/80 backdrop-blur-xl px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white mb-1">On-Chain Audit Log</h1>
              <p className="text-sm text-[#374151]">
                Immutable trail via <span className="font-mono text-[#00D4FF]/70">contracts.logs()</span> · Terminal 3 TEE
              </p>
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
              <button className="flex items-center gap-2 px-4 py-2 bg-[#0F1E30] border border-[#1A2940] rounded-xl text-sm text-[#9CA3AF] hover:text-white transition-all">
                <Download className="w-3.5 h-3.5" />
                Export
              </button>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Events", value: summary?.total || 0, color: "#00D4FF" },
              { label: "Info", value: summary?.byLevel?.info || 0, color: "#00D4FF" },
              { label: "Debug", value: summary?.byLevel?.debug || 0, color: "#7C3AED" },
              { label: "Errors", value: summary?.byLevel?.error || 0, color: "#EF4444" },
            ].map(s => (
              <div key={s.label} className="bg-[#080E1A] border border-[#0F1E30] rounded-2xl p-5 hover:border-opacity-60 transition-all"
                style={{ borderColor: `${s.color}10` }}
              >
                <div className="text-3xl font-bold mb-1" style={{ color: s.color }}>{s.value}</div>
                <div className="text-xs text-[#374151] uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Source banner */}
          <div className="bg-[#080E1A] border border-[#00D4FF]/10 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#00D4FF]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <FileText className="w-4 h-4 text-[#00D4FF]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Live from Terminal 3 TEE</p>
              <p className="text-xs text-[#374151] mt-0.5">
                Fetched via <code className="text-[#00D4FF]/70 font-mono">tenant.contracts.logs("health-check")</code> — 
                every AI analysis executed inside the TEE creates an immutable audit entry.
              </p>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-2">
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
                {lvl} {lvl !== "all" && summary?.byLevel?.[lvl] ? `(${summary.byLevel[lvl]})` : ""}
              </button>
            ))}
          </div>

          {/* Events table */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex items-center gap-3 text-[#374151]">
                <RefreshCw className="w-5 h-5 animate-spin text-[#00D4FF]" />
                <span className="text-sm">Loading audit trail...</span>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-[#080E1A] border border-[#0F1E30] rounded-2xl p-16 text-center">
              <div className="w-14 h-14 bg-[#0F1E30] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 text-[#1F2937]" />
              </div>
              <p className="text-[#6B7280] font-medium mb-1">No audit events yet</p>
              <p className="text-[#374151] text-sm">Run a health analysis to generate TEE contract logs.</p>
            </div>
          ) : (
            <div className="bg-[#080E1A] border border-[#0F1E30] rounded-2xl overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-[80px_1fr_150px_100px_100px] gap-4 px-5 py-3 border-b border-[#0F1E30] text-[10px] font-semibold text-[#374151] uppercase tracking-wider">
                <div>Level</div>
                <div>Message</div>
                <div>Function</div>
                <div>Contract</div>
                <div>Time</div>
              </div>

              {filtered.map((event, i) => {
                const cfg = LEVEL_CONFIG[event.level] || LEVEL_CONFIG.info;
                const LvlIcon = cfg.icon;
                return (
                  <div key={event.id} className={`border-b border-[#0F1E30] last:border-0 ${i % 2 === 0 ? "" : "bg-[#0A1020]/30"}`}>
                    <button
                      className="w-full grid grid-cols-[80px_1fr_150px_100px_100px] gap-4 px-5 py-3.5 hover:bg-[#0F1E30]/50 transition-colors text-left items-center"
                      onClick={() => setExpanded(expanded === event.id ? null : event.id)}
                    >
                      <div>
                        <span className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-lg border font-semibold`}
                          style={{ color: cfg.color, background: `${cfg.color}15`, borderColor: `${cfg.color}20` }}
                        >
                          <LvlIcon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                      </div>
                      <div className="text-sm text-[#D1D5DB] truncate pr-4">{event.message}</div>
                      <div className="text-xs font-mono text-[#7C3AED] truncate">{event.functionName}</div>
                      <div className="text-xs font-mono text-[#374151] truncate">{event.contractTail}</div>
                      <div className="flex items-center gap-2 text-xs text-[#374151]">
                        <Clock className="w-3 h-3" />
                        {new Date(event.tsMs).toLocaleTimeString()}
                        {expanded === event.id ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
                      </div>
                    </button>

                    {expanded === event.id && (
                      <div className="px-5 pb-4 pt-1">
                        <pre className="text-xs font-mono text-[#6B7280] bg-[#050A14] border border-[#0F1E30] rounded-xl p-4 overflow-x-auto">
                          {JSON.stringify(event, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
