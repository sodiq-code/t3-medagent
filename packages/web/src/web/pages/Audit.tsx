import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Activity, FileText, RefreshCw, AlertCircle, Info, Bug, ExternalLink, ChevronLeft } from "lucide-react";
import { hc } from "hono/client";
import type { AppType } from "../../api";

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

export default function Audit() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [summary, setSummary] = useState<{ total: number; byLevel: Record<string, number> } | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

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
      setEvents((evData as { events: AuditEvent[] }).events || []);
      setSummary(sumData as typeof summary);
    } catch {
      // show empty state
    } finally {
      setLoading(false);
    }
  }

  const levelIcon = (level: string) => {
    if (level === "error") return <AlertCircle className="w-3.5 h-3.5 text-[#EF4444]" />;
    if (level === "debug") return <Bug className="w-3.5 h-3.5 text-[#7C3AED]" />;
    return <Info className="w-3.5 h-3.5 text-[#00D4FF]" />;
  };

  const levelColor = (level: string) => {
    if (level === "error") return "text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/20";
    if (level === "debug") return "text-[#7C3AED] bg-[#7C3AED]/10 border-[#7C3AED]/20";
    return "text-[#00D4FF] bg-[#00D4FF]/10 border-[#00D4FF]/20";
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
          <span className="text-sm text-[#9CA3AF]">On-Chain Audit Log</span>
          <button onClick={loadEvents} disabled={loading} className="p-2 text-[#9CA3AF] hover:text-white transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Events", value: summary?.total || 0, color: "#00D4FF" },
            { label: "Info", value: summary?.byLevel?.info || 0, color: "#00D4FF" },
            { label: "Debug", value: summary?.byLevel?.debug || 0, color: "#7C3AED" },
            { label: "Errors", value: summary?.byLevel?.error || 0, color: "#EF4444" },
          ].map((s) => (
            <div key={s.label} className="bg-[#111827] border border-[#1E2A3A] rounded-xl p-4">
              <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-[#9CA3AF] mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Source info */}
        <div className="bg-[#111827] border border-[#1E2A3A] rounded-xl p-4 mb-6 flex items-start gap-3">
          <FileText className="w-4 h-4 text-[#00D4FF] mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-[#F9FAFB] font-medium">Live from Terminal 3 TEE</p>
            <p className="text-xs text-[#9CA3AF] mt-0.5">
              Fetched via <code className="text-[#00D4FF]">tenant.contracts.logs("health-check")</code> — 
              immutable audit trail of every AI analysis executed inside the TEE.
            </p>
          </div>
        </div>

        {/* Events Table */}
        {events.length === 0 ? (
          <div className="bg-[#111827] border border-[#1E2A3A] rounded-xl p-12 text-center">
            <FileText className="w-10 h-10 text-[#1F2937] mx-auto mb-3" />
            <p className="text-[#9CA3AF] text-sm">No audit events yet.</p>
            <p className="text-[#4B5563] text-xs mt-1">Run a health analysis to generate contract logs.</p>
            <Link href="/dashboard">
              <button className="mt-4 text-sm text-[#00D4FF] hover:underline">Open Dashboard →</button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {events.map((event) => (
              <div key={event.id} className="bg-[#111827] border border-[#1E2A3A] rounded-xl overflow-hidden">
                <button
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[#1F2937]/50 transition-colors text-left"
                  onClick={() => setExpanded(expanded === event.id ? null : event.id)}
                >
                  {levelIcon(event.level)}
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${levelColor(event.level)}`}>
                    {event.level}
                  </span>
                  <span className="text-xs font-mono text-[#9CA3AF]">{event.contractTail}</span>
                  <span className="text-xs text-[#4B5563]">→</span>
                  <span className="text-xs font-mono text-[#7C3AED]">{event.functionName}</span>
                  <span className="flex-1 text-sm text-[#F9FAFB] truncate">{event.message}</span>
                  <span className="text-xs text-[#4B5563] font-mono whitespace-nowrap">
                    {new Date(event.tsMs).toLocaleTimeString()}
                  </span>
                </button>
                {expanded === event.id && (
                  <div className="px-4 pb-3 border-t border-[#1E2A3A]">
                    <pre className="text-xs font-mono text-[#9CA3AF] bg-[#0A0F1E] rounded-lg p-3 mt-2 overflow-x-auto">
{JSON.stringify(event, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
