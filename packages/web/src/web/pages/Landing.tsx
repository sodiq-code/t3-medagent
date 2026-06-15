import { Link } from "wouter";
import { Shield, Brain, Lock, Activity, ChevronRight, Zap, CheckCircle } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#0A0F1E] text-[#F9FAFB] overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#1E2A3A] bg-[#0A0F1E]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#00D4FF]/20 border border-[#00D4FF]/30 flex items-center justify-center">
              <Activity className="w-4 h-4 text-[#00D4FF]" />
            </div>
            <span className="font-bold text-lg tracking-tight">T3 MedAgent</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/audit" className="text-[#9CA3AF] hover:text-white text-sm transition-colors">Audit Log</Link>
            <Link href="/verify" className="text-[#9CA3AF] hover:text-white text-sm transition-colors">Verify TEE</Link>
            <Link href="/onboard">
              <button className="bg-[#00D4FF] text-[#0A0F1E] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#0099CC] transition-colors">
                Start Session
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6">
        {/* Hex grid background */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5 L55 20 L55 50 L30 65 L5 50 L5 20 Z' fill='none' stroke='%2300D4FF' stroke-width='1'/%3E%3C/svg%3E")`,
          backgroundSize: "60px 60px",
        }} />

        {/* Gradient blobs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-[#00D4FF]/10 rounded-full blur-3xl" />
        <div className="absolute top-40 right-1/4 w-64 h-64 bg-[#7C3AED]/10 rounded-full blur-3xl" />

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[#00D4FF]/10 border border-[#00D4FF]/20 rounded-full px-4 py-2 text-sm text-[#00D4FF] mb-8">
            <Zap className="w-3.5 h-3.5" />
            Powered by Terminal 3 TEE Network
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight mb-6" style={{ fontFamily: "Syne, sans-serif" }}>
            AI Health Agent
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D4FF] to-[#7C3AED]">
              with On-Chain Privacy
            </span>
          </h1>

          <p className="text-xl text-[#9CA3AF] max-w-2xl mx-auto mb-10 leading-relaxed">
            Your medical data analyzed by an autonomous AI agent inside a Trusted Execution Environment.
            Zero-knowledge identity. Every action verifiable on-chain.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/onboard">
              <button className="bg-[#00D4FF] text-[#0A0F1E] px-8 py-4 rounded-xl font-semibold text-lg hover:bg-[#0099CC] transition-all hover:scale-105 flex items-center gap-2">
                Start Health Session <ChevronRight className="w-5 h-5" />
              </button>
            </Link>
            <Link href="/dashboard">
              <button className="border border-[#1E2A3A] text-white px-8 py-4 rounded-xl font-semibold text-lg hover:border-[#00D4FF]/50 transition-all">
                Open Dashboard
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-[#1E2A3A] py-6 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { label: "SDK Primitives Used", value: "16" },
            { label: "TEE Execution", value: "100%" },
            { label: "On-Chain Audit", value: "✓" },
            { label: "Network", value: "Testnet" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-2xl font-bold text-[#00D4FF]">{s.value}</div>
              <div className="text-sm text-[#9CA3AF] mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4" style={{ fontFamily: "Syne, sans-serif" }}>
            How T3 MedAgent Works
          </h2>
          <p className="text-[#9CA3AF] text-center mb-14 max-w-xl mx-auto">
            Every step of your health session is cryptographically verified and auditable.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Lock className="w-6 h-6 text-[#00D4FF]" />,
                title: "OTP Identity Verification",
                desc: "Verify your identity via email or SMS using Terminal 3's on-chain OTP protocol. Your DID is minted on the T3 network.",
                primitives: ["otpRequest", "otpVerify", "submitUserInput"],
                color: "#00D4FF",
              },
              {
                icon: <Brain className="w-6 h-6 text-[#7C3AED]" />,
                title: "TEE Health Analysis",
                desc: "Your symptoms are analyzed inside a Trusted Execution Environment. The AI agent runs inside a confidential WASM contract.",
                primitives: ["contracts.execute", "contracts.logs", "maps.create"],
                color: "#7C3AED",
              },
              {
                icon: <Shield className="w-6 h-6 text-[#10B981]" />,
                title: "Agent Delegation",
                desc: "Grant specialist AI agents permission to access your health data with cryptographically signed delegation credentials.",
                primitives: ["buildDelegationCredential", "signAgentInvocation", "verifyDkgAttestation"],
                color: "#10B981",
              },
            ].map((f) => (
              <div key={f.title} className="bg-[#111827] border border-[#1E2A3A] rounded-xl p-6 hover:border-opacity-60 transition-all" style={{ "--glow": f.color } as React.CSSProperties}>
                <div className="w-12 h-12 rounded-xl mb-5 flex items-center justify-center" style={{ background: `${f.color}15`, border: `1px solid ${f.color}30` }}>
                  {f.icon}
                </div>
                <h3 className="font-semibold text-lg mb-3">{f.title}</h3>
                <p className="text-[#9CA3AF] text-sm leading-relaxed mb-4">{f.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {f.primitives.map((p) => (
                    <span key={p} className="text-xs px-2 py-1 rounded-md font-mono" style={{ background: `${f.color}15`, color: f.color }}>
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SDK Coverage */}
      <section className="py-16 px-6 bg-[#111827]/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10" style={{ fontFamily: "Syne, sans-serif" }}>
            Full SDK Coverage — 16 Primitives
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              "setEnvironment", "loadWasmComponent", "eth_get_address", "metamask_sign",
              "handshake()", "authenticate()", "tenant.claim()", "maps.create()",
              "contracts.publish()", "contracts.execute()", "contracts.logs()", "buildDelegationCredential",
              "signAgentInvocation", "otpRequest", "otpVerify", "verifyDkgAttestation",
            ].map((p, i) => (
              <div key={p} className="flex items-center gap-2 bg-[#0A0F1E] border border-[#1E2A3A] rounded-lg px-3 py-2.5">
                <CheckCircle className="w-3.5 h-3.5 text-[#10B981] flex-shrink-0" />
                <span className="text-xs font-mono text-[#9CA3AF] truncate">{p}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-20 px-6 text-center">
        <h2 className="text-4xl font-bold mb-6" style={{ fontFamily: "Syne, sans-serif" }}>
          Your health. <span className="text-[#00D4FF]">Verified.</span>
        </h2>
        <p className="text-[#9CA3AF] mb-8">Start your privacy-preserving health session in seconds.</p>
        <Link href="/onboard">
          <button className="bg-[#00D4FF] text-[#0A0F1E] px-10 py-4 rounded-xl font-bold text-lg hover:bg-[#0099CC] transition-all hover:scale-105">
            Begin Onboarding →
          </button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1E2A3A] py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-[#9CA3AF]">
            <Activity className="w-4 h-4 text-[#00D4FF]" />
            T3 MedAgent · Terminal 3 ADK Bounty 2026
          </div>
          <div className="flex gap-6 text-sm text-[#9CA3AF]">
            <Link href="/audit" className="hover:text-white transition-colors">Audit Log</Link>
            <Link href="/delegation" className="hover:text-white transition-colors">Delegation</Link>
            <Link href="/verify" className="hover:text-white transition-colors">Verify TEE</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
