import { Link } from "wouter";
import { Shield, Brain, Lock, Activity, ChevronRight, Zap, CheckCircle, ArrowRight, Cpu, Network, Key } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#050A14] text-white overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#0F1E30]/60 bg-[#050A14]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#00D4FF]/20 to-[#7C3AED]/20 border border-[#00D4FF]/20 flex items-center justify-center">
              <Activity className="w-4 h-4 text-[#00D4FF]" />
            </div>
            <div>
              <span className="font-bold tracking-tight">T3 MedAgent</span>
              <span className="text-[10px] text-[#374151] ml-2 font-mono hidden sm:inline">Terminal 3 ADK</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="hidden md:block text-sm text-[#6B7280] hover:text-white px-3 py-2 rounded-lg hover:bg-[#0F1E30] transition-all">Dashboard</Link>
            <Link href="/delegation" className="hidden md:block text-sm text-[#6B7280] hover:text-white px-3 py-2 rounded-lg hover:bg-[#0F1E30] transition-all">Delegation</Link>
            <Link href="/audit" className="hidden md:block text-sm text-[#6B7280] hover:text-white px-3 py-2 rounded-lg hover:bg-[#0F1E30] transition-all">Audit Log</Link>
            <Link href="/verify" className="hidden md:block text-sm text-[#6B7280] hover:text-white px-3 py-2 rounded-lg hover:bg-[#0F1E30] transition-all">Verify TEE</Link>
            <Link href="/onboard">
              <button className="bg-[#00D4FF] text-[#050A14] px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#00BBDF] transition-all">
                Start Session
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-36 pb-24 px-6">
        {/* Grid bg */}
        <div className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #0F1E30 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
        {/* Glow orbs */}
        <div className="absolute top-32 left-1/3 w-[500px] h-[500px] bg-[#00D4FF]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-48 right-1/4 w-80 h-80 bg-[#7C3AED]/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[#00D4FF]/10 border border-[#00D4FF]/20 rounded-full px-5 py-2 text-sm text-[#00D4FF] mb-4">
            <Zap className="w-3.5 h-3.5" />
            Terminal 3 ADK Bounty · Turing Hackathon 2026
          </div>
          <div className="flex items-center justify-center gap-3 mb-10">
            <span className="inline-flex items-center gap-1.5 bg-[#7C3AED]/10 border border-[#7C3AED]/30 rounded-full px-4 py-1.5 text-xs font-semibold text-[#A78BFA]">
              <CheckCircle className="w-3 h-3" /> Terminal 3 ADK
            </span>
            <span className="inline-flex items-center gap-1.5 bg-[#10B981]/10 border border-[#10B981]/30 rounded-full px-4 py-1.5 text-xs font-semibold text-[#34D399]">
              <Shield className="w-3 h-3" /> Healthcare Vertical
            </span>
            <span className="inline-flex items-center gap-1.5 bg-[#00D4FF]/10 border border-[#00D4FF]/30 rounded-full px-4 py-1.5 text-xs font-semibold text-[#00D4FF]">
              <Cpu className="w-3 h-3" /> 17 Primitives
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.05] mb-7">
            AI Health Agent
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D4FF] via-[#6366F1] to-[#7C3AED]">
              with On-Chain Privacy
            </span>
          </h1>

          <p className="text-lg md:text-xl text-[#6B7280] max-w-2xl mx-auto mb-12 leading-relaxed">
            Your medical data analyzed inside a Trusted Execution Environment.
            Zero-knowledge identity. Every action cryptographically verifiable.
            Powered by <strong className="text-[#9CA3AF]">17 T3 SDK primitives</strong>.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/onboard">
              <button className="flex items-center gap-2 bg-[#00D4FF] text-[#050A14] px-8 py-4 rounded-2xl font-bold text-lg hover:bg-[#00BBDF] transition-all hover:scale-[1.02] shadow-lg shadow-[#00D4FF]/10">
                Start Health Session <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
            <Link href="/dashboard">
              <button className="flex items-center gap-2 border border-[#1A2940] text-[#9CA3AF] px-8 py-4 rounded-2xl font-semibold text-lg hover:border-[#00D4FF]/30 hover:text-white transition-all">
                Open Dashboard <ChevronRight className="w-5 h-5" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-[#0F1E30] bg-[#080E1A]">
        <div className="max-w-5xl mx-auto px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: "17", label: "SDK Primitives Used" },
            { value: "100%", label: "TEE Execution" },
            { value: "163+", label: "On-Chain Audit Txns" },
            { value: "ERC-8004", label: "Agent NFT Standard" },
          ].map(s => (
            <div key={s.label}>
              <div className="text-2xl font-extrabold text-[#00D4FF]">{s.value}</div>
              <div className="text-xs text-[#374151] mt-1.5 uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How T3 MedAgent Works</h2>
            <p className="text-[#6B7280] max-w-xl mx-auto">
              Every step of your health session is cryptographically secured and on-chain auditable.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                icon: Lock, color: "#00D4FF", step: "01",
                title: "OTP Identity Verification",
                desc: "Verify your identity via email or SMS using Terminal 3's on-chain OTP protocol. A DID is minted on the T3 network — your identity stays on-chain.",
                primitives: ["otpRequest", "otpVerify", "submitUserInput"],
              },
              {
                icon: Brain, color: "#7C3AED", step: "02",
                title: "TEE Health Analysis",
                desc: "Symptoms analyzed inside a Trusted Execution Environment. The AI agent runs inside a confidential WASM contract — zero data leakage.",
                primitives: ["contracts.execute", "contracts.logs", "maps.create"],
              },
              {
                icon: Shield, color: "#10B981", step: "03",
                title: "Agent Delegation",
                desc: "Grant specialist AI agents permission to access health data with cryptographically signed, time-bounded delegation credentials.",
                primitives: ["buildDelegationCredential", "signAgentInvocation", "verifyDkgAttestation"],
              },
            ].map(({ icon: Icon, color, step, title, desc, primitives }) => (
              <div key={title} className="bg-[#080E1A] border border-[#0F1E30] rounded-2xl p-6 hover:border-opacity-60 transition-all relative overflow-hidden group"
                style={{ borderColor: `${color}10` }}
              >
                <div className="absolute top-4 right-4 text-5xl font-black opacity-5" style={{ color }}>{step}</div>
                <div className="w-12 h-12 rounded-2xl mb-5 flex items-center justify-center"
                  style={{ background: `${color}15`, border: `1px solid ${color}20` }}
                >
                  <Icon className="w-5.5 h-5.5" style={{ color }} />
                </div>
                <h3 className="font-bold text-base mb-3">{title}</h3>
                <p className="text-sm text-[#6B7280] leading-relaxed mb-5">{desc}</p>
                <div className="flex flex-wrap gap-2">
                  {primitives.map(p => (
                    <span key={p} className="text-[11px] px-2.5 py-1 rounded-lg font-mono"
                      style={{ background: `${color}12`, color, border: `1px solid ${color}20` }}
                    >
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
      <section className="py-20 px-6 bg-[#080E1A]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Full SDK Coverage</h2>
            <p className="text-[#6B7280] text-sm">17 Terminal 3 primitives integrated across the full agent lifecycle</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { name: "setEnvironment", done: true },
              { name: "loadWasmComponent", done: true },
              { name: "eth_get_address", done: true },
              { name: "metamask_sign", done: true },
              { name: "handshake()", done: true },
              { name: "authenticate()", done: true },
              { name: "tenant.claim()", done: true },
              { name: "maps.create()", done: true },
              { name: "contracts.publish()", done: true },
              { name: "contracts.execute()", done: true },
              { name: "contracts.logs()", done: true },
              { name: "buildDelegationCredential", done: true },
              { name: "signAgentInvocation", done: true },
              { name: "otpRequest", done: true },
              { name: "otpVerify", done: true },
              { name: "submitUserInput", done: true },
              { name: "verifyDkgAttestation", done: true },
            ].map(p => (
              <div key={p.name} className="flex items-center gap-2 bg-[#050A14] border border-[#0F1E30] rounded-xl px-3.5 py-3 hover:border-[#00D4FF]/10 transition-all">
                <CheckCircle className="w-3.5 h-3.5 text-[#10B981] flex-shrink-0" />
                <span className="text-xs font-mono text-[#6B7280] truncate">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Architecture</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: Cpu, color: "#00D4FF", title: "TEE Layer", items: ["Intel TDX Hardware", "WASM Runtime", "Confidential Compute", "RTMR3 Measurement"] },
              { icon: Network, color: "#7C3AED", title: "T3 Protocol", items: ["DID Registry", "DKG Key Management", "Tenant Network", "On-Chain Audit"] },
              { icon: Key, color: "#10B981", title: "Agent Layer", items: ["Health Analysis AI", "ERC-8004 Agent NFT", "Delegation System", "OTP Identity"] },
            ].map(({ icon: Icon, color, title, items }) => (
              <div key={title} className="bg-[#080E1A] border border-[#0F1E30] rounded-2xl p-5"
                style={{ borderColor: `${color}10` }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}15`, border: `1px solid ${color}20` }}>
                    <Icon className="w-4.5 h-4.5" style={{ color }} />
                  </div>
                  <span className="font-semibold text-sm">{title}</span>
                </div>
                <div className="space-y-2">
                  {items.map(item => (
                    <div key={item} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
                      <span className="text-xs text-[#6B7280]">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[600px] h-[300px] bg-[#00D4FF]/3 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-5">
            Your health.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D4FF] to-[#7C3AED]">Verified.</span>
          </h2>
          <p className="text-[#6B7280] mb-10 text-lg">
            Privacy-preserving health analysis. On-chain audit trail. TEE-backed trust.
          </p>
          <Link href="/onboard">
            <button className="inline-flex items-center gap-2 bg-gradient-to-r from-[#00D4FF] to-[#0099CC] text-[#050A14] px-12 py-5 rounded-2xl font-bold text-xl hover:opacity-90 transition-all hover:scale-[1.02] shadow-xl shadow-[#00D4FF]/15">
              Begin Onboarding <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#0F1E30] py-8 px-6 bg-[#080E1A]">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-[#374151]">
            <Activity className="w-4 h-4 text-[#00D4FF]" />
            T3 MedAgent · Terminal 3 ADK Bounty 2026
          </div>
          <div className="flex gap-6 text-sm text-[#374151]">
            <Link href="/audit" className="hover:text-[#9CA3AF] transition-colors">Audit Log</Link>
            <Link href="/delegation" className="hover:text-[#9CA3AF] transition-colors">Delegation</Link>
            <Link href="/verify" className="hover:text-[#9CA3AF] transition-colors">Verify TEE</Link>
            <Link href="/dashboard" className="hover:text-[#9CA3AF] transition-colors">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
