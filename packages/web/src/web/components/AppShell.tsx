import { Link, useLocation } from "wouter";
import {
  Activity, LayoutDashboard, FileText, Users, Shield,
  ChevronRight, Zap, LogOut, Menu, X, Settings
} from "lucide-react";
import { useState } from "react";

const NAV = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", badge: null },
  { href: "/audit", icon: FileText, label: "Audit Log", badge: null },
  { href: "/delegation", icon: Users, label: "Delegation", badge: null },
  { href: "/verify", icon: Shield, label: "Verify TEE", badge: null },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#050A14] flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col w-64 bg-[#080E1A] border-r border-[#0F1E30] transition-transform duration-300
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-[#0F1E30]">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00D4FF]/30 to-[#7C3AED]/30 border border-[#00D4FF]/20 flex items-center justify-center mr-3">
            <Activity className="w-4 h-4 text-[#00D4FF]" />
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight text-white">T3 MedAgent</div>
            <div className="text-[10px] text-[#00D4FF]/60 font-mono">Terminal 3 ADK</div>
          </div>
          <button onClick={() => setMobileOpen(false)} className="ml-auto lg:hidden text-[#9CA3AF]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          <div className="text-[10px] font-semibold text-[#374151] uppercase tracking-widest px-3 mb-3">Core</div>
          {NAV.map(({ href, icon: Icon, label, badge }) => {
            const active = location === href || (href !== "/dashboard" && location.startsWith(href));
            return (
              <Link key={href} href={href} onClick={() => setMobileOpen(false)}>
                <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer group
                  ${active
                    ? "bg-gradient-to-r from-[#00D4FF]/15 to-transparent text-white border border-[#00D4FF]/15"
                    : "text-[#6B7280] hover:text-[#D1D5DB] hover:bg-[#0F1E30]"
                  }`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-[#00D4FF]" : "group-hover:text-[#9CA3AF]"}`} />
                  <span className="flex-1">{label}</span>
                  {active && <ChevronRight className="w-3.5 h-3.5 text-[#00D4FF]/60" />}
                  {badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#00D4FF]/20 text-[#00D4FF]">{badge}</span>
                  )}
                </div>
              </Link>
            );
          })}

          <div className="text-[10px] font-semibold text-[#374151] uppercase tracking-widest px-3 mb-3 mt-6">Setup</div>
          <Link href="/onboard" onClick={() => setMobileOpen(false)}>
            <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer group
              ${location === "/onboard" ? "bg-gradient-to-r from-[#7C3AED]/15 to-transparent text-white border border-[#7C3AED]/15" : "text-[#6B7280] hover:text-[#D1D5DB] hover:bg-[#0F1E30]"}`}
            >
              <Zap className={`w-4 h-4 flex-shrink-0 ${location === "/onboard" ? "text-[#7C3AED]" : "group-hover:text-[#9CA3AF]"}`} />
              <span className="flex-1">Onboarding</span>
            </div>
          </Link>
        </nav>

        {/* Bottom */}
        <div className="p-4 border-t border-[#0F1E30]">
          <div className="bg-[#0F1E30] rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-[#00D4FF]/20 flex items-center justify-center">
                <Activity className="w-3 h-3 text-[#00D4FF]" />
              </div>
              <span className="text-xs text-[#9CA3AF] font-mono truncate">t3n-sdk v3.5.2</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              <span className="text-[11px] text-[#10B981]">TEE Network Active</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top bar mobile */}
        <div className="lg:hidden h-14 flex items-center px-4 border-b border-[#0F1E30] bg-[#080E1A]">
          <button onClick={() => setMobileOpen(true)} className="text-[#9CA3AF] mr-3">
            <Menu className="w-5 h-5" />
          </button>
          <Activity className="w-4 h-4 text-[#00D4FF] mr-2" />
          <span className="font-bold text-sm">T3 MedAgent</span>
        </div>

        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
