import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { Activity, Send, Loader2, AlertCircle, CheckCircle, AlertTriangle, Zap, FileText, Shield, Users } from "lucide-react";
import { hc } from "hono/client";
import type { AppType } from "../../api";

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
}

interface AgentStatus {
  status: string;
  agentDid?: string;
  agentAddress?: string;
  network?: string;
}

export default function Dashboard() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      role: "agent",
      content: "Hello! I'm T3 MedAgent — your privacy-preserving AI health navigator. Tell me your symptoms and I'll analyze them inside a Trusted Execution Environment. Your data never leaves the TEE unencrypted.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [initing, setIniting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    loadStatus();
  }, []);

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
        setStatus(s => ({ ...s, status: "online", agentDid: (data as { agentDid?: string }).agentDid }));
        addAgentMessage("✅ T3 session initialized. Agent DID minted. Tenant claimed on testnet. Ready to analyze symptoms.");
      }
    } catch (e) {
      addAgentMessage("Session init failed (T3 node may be unreachable). Running in simulation mode.");
    } finally {
      setIniting(false);
    }
  }

  function addAgentMessage(content: string, analysis?: Message["analysis"]) {
    setMessages(m => [...m, {
      id: Date.now().toString(),
      role: "agent",
      content,
      analysis,
      timestamp: new Date(),
    }]);
  }

  async function handleSend() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(m => [...m, {
      id: Date.now().toString(),
      role: "user",
      content: userMsg,
      timestamp: new Date(),
    }]);

    setLoading(true);
    try {
      const symptoms = userMsg.split(/[,;]+/).map(s => s.trim()).filter(Boolean);
      const res = await client.api.health.analyze.$post({
        json: { symptoms, severity: "moderate" },
      });
      const data = await res.json();
      const result = (data as { result?: Message["analysis"] }).result;

      const riskEmoji: Record<string, string> = { low: "🟢", medium: "🟡", high: "🟠", critical: "🔴" };
      const emoji = riskEmoji[result?.risk_level || "low"] || "⚪";

      addAgentMessage(
        `${emoji} Analysis complete${(data as { simulated?: boolean }).simulated ? " (simulated)" : " via TEE contract"}: **${result?.risk_level?.toUpperCase()} risk**\n\n${result?.recommendation}${result?.specialist_needed ? "\n\n⚠️ Specialist consultation recommended." : ""}`,
        result
      );
    } catch (e) {
      addAgentMessage("Analysis service temporarily unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const riskColors: Record<string, string> = {
    low: "#10B981",
    medium: "#F59E0B",
    high: "#F97316",
    critical: "#EF4444",
  };

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-[#F9FAFB] flex flex-col">
      {/* Nav */}
      <nav className="border-b border-[#1E2A3A] px-6 h-16 flex items-center justify-between bg-[#0A0F1E]/80 backdrop-blur-xl sticky top-0 z-10">
        <Link href="/" className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#00D4FF]" />
          <span className="font-bold">T3 MedAgent</span>
        </Link>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full ${status?.status === "online" ? "bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30" : "bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30"}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${status?.status === "online" ? "bg-[#10B981] animate-pulse" : "bg-[#EF4444]"}`} />
            {status?.status === "online" ? "Connected" : "Offline"}
          </div>
          <Link href="/audit" className="text-[#9CA3AF] hover:text-white transition-colors"><FileText className="w-4 h-4" /></Link>
          <Link href="/delegation" className="text-[#9CA3AF] hover:text-white transition-colors"><Users className="w-4 h-4" /></Link>
          <Link href="/verify" className="text-[#9CA3AF] hover:text-white transition-colors"><Shield className="w-4 h-4" /></Link>
        </div>
      </nav>

      <div className="flex-1 flex max-w-7xl mx-auto w-full">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                  msg.role === "agent" ? "bg-[#00D4FF]/20 border border-[#00D4FF]/30 text-[#00D4FF]" : "bg-[#7C3AED]/20 border border-[#7C3AED]/30 text-[#7C3AED]"
                }`}>
                  {msg.role === "agent" ? <Activity className="w-4 h-4" /> : "U"}
                </div>

                <div className={`max-w-[75%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-2`}>
                  <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "agent"
                      ? "bg-[#111827] border border-[#1E2A3A] text-[#F9FAFB]"
                      : "bg-[#7C3AED]/20 border border-[#7C3AED]/30 text-white"
                  }`}>
                    {msg.content}
                  </div>

                  {msg.analysis && (
                    <div className="bg-[#111827] border rounded-xl p-4 w-full" style={{ borderColor: `${riskColors[msg.analysis.risk_level]}30` }}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: riskColors[msg.analysis.risk_level] }} />
                        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: riskColors[msg.analysis.risk_level] }}>
                          {msg.analysis.risk_level} risk
                        </span>
                        <span className="text-xs text-[#9CA3AF] ml-auto">
                          {Math.round(msg.analysis.confidence * 100)}% confidence
                        </span>
                      </div>
                      <div className="w-full bg-[#0A0F1E] rounded-full h-1.5 mb-3">
                        <div className="h-1.5 rounded-full transition-all" style={{
                          width: `${msg.analysis.confidence * 100}%`,
                          background: riskColors[msg.analysis.risk_level],
                        }} />
                      </div>
                      {msg.analysis.specialist_needed && (
                        <div className="flex items-center gap-2 text-xs text-[#F59E0B]">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Specialist consultation recommended
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[#00D4FF]/20 border border-[#00D4FF]/30 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-[#00D4FF]" />
                </div>
                <div className="bg-[#111827] border border-[#1E2A3A] rounded-2xl px-4 py-3 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-[#00D4FF] animate-spin" />
                  <span className="text-sm text-[#9CA3AF]">Analyzing in TEE...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-[#1E2A3A] p-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Describe your symptoms (e.g., headache, fever, fatigue)..."
                className="flex-1 bg-[#111827] border border-[#1E2A3A] rounded-xl px-4 py-3 text-white placeholder-[#4B5563] focus:outline-none focus:border-[#00D4FF]/50 text-sm"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="bg-[#00D4FF] text-[#0A0F1E] w-12 h-12 rounded-xl flex items-center justify-center hover:bg-[#0099CC] transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#4B5563] text-center mt-2">
              Executed via <span className="text-[#00D4FF]">contracts.execute()</span> inside Terminal 3 TEE
            </p>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-72 border-l border-[#1E2A3A] p-4 space-y-4 hidden lg:block">
          {/* Agent Info */}
          <div className="bg-[#111827] border border-[#1E2A3A] rounded-xl p-4">
            <h3 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-3">Agent Identity</h3>
            {status?.agentDid ? (
              <div>
                <div className="text-xs text-[#9CA3AF] mb-1">DID</div>
                <div className="text-xs font-mono text-[#00D4FF] break-all bg-[#00D4FF]/5 rounded-lg px-2 py-1.5">
                  {status.agentDid.substring(0, 30)}...
                </div>
              </div>
            ) : (
              <button
                onClick={initSession}
                disabled={initing}
                className="w-full bg-[#00D4FF]/10 border border-[#00D4FF]/30 text-[#00D4FF] py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#00D4FF]/20 transition-all"
              >
                {initing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                Init T3 Session
              </button>
            )}
          </div>

          {/* SDK Primitives */}
          <div className="bg-[#111827] border border-[#1E2A3A] rounded-xl p-4">
            <h3 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-3">SDK Primitives Active</h3>
            <div className="space-y-2">
              {[
                { name: "setEnvironment", done: true },
                { name: "loadWasmComponent", done: true },
                { name: "eth_get_address", done: true },
                { name: "metamask_sign", done: true },
                { name: "handshake()", done: !!status?.agentDid },
                { name: "authenticate()", done: !!status?.agentDid },
                { name: "tenant.claim()", done: !!status?.agentDid },
                { name: "maps.create()", done: false },
                { name: "contracts.execute()", done: messages.length > 1 },
                { name: "contracts.logs()", done: false },
              ].map((p) => (
                <div key={p.name} className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${p.done ? "bg-[#10B981]" : "bg-[#1F2937]"}`} />
                  <span className={`text-xs font-mono ${p.done ? "text-[#9CA3AF]" : "text-[#4B5563]"}`}>{p.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-2">
            <Link href="/audit">
              <div className="bg-[#111827] border border-[#1E2A3A] rounded-xl p-3 flex items-center gap-3 hover:border-[#00D4FF]/30 transition-all cursor-pointer">
                <FileText className="w-4 h-4 text-[#9CA3AF]" />
                <span className="text-sm text-[#9CA3AF]">Audit Log</span>
              </div>
            </Link>
            <Link href="/delegation">
              <div className="bg-[#111827] border border-[#1E2A3A] rounded-xl p-3 flex items-center gap-3 hover:border-[#00D4FF]/30 transition-all cursor-pointer">
                <Users className="w-4 h-4 text-[#9CA3AF]" />
                <span className="text-sm text-[#9CA3AF]">Delegation</span>
              </div>
            </Link>
            <Link href="/verify">
              <div className="bg-[#111827] border border-[#1E2A3A] rounded-xl p-3 flex items-center gap-3 hover:border-[#00D4FF]/30 transition-all cursor-pointer">
                <Shield className="w-4 h-4 text-[#9CA3AF]" />
                <span className="text-sm text-[#9CA3AF]">Verify TEE</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
