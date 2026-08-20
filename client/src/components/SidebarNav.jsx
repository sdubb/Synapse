import React from "react";
import {
  Layers, Shield, UserCheck, AlertOctagon, Code2,
  FileCheck2, Crosshair, Users, Activity, Terminal, GitFork
} from "lucide-react";

export function SidebarNav({ activeTab, setActiveTab, stats, wsConnected }) {
  const navItems = [
    { id: "pipeline_studio", label: "Pipelines", icon: Layers },
    { id: "workforce", label: "Fleet", icon: Users, count: stats.activeAgents },
    { id: "hitl", label: "Approvals", icon: UserCheck, count: stats.pendingApprovals },
    { id: "incidents", label: "Incidents", icon: AlertOctagon, count: stats.activeIncidents },
    { id: "policies", label: "Policies", icon: Code2 },
    { id: "a2a", label: "A2A Mesh", icon: GitFork },
    { id: "redteam", label: "Security", icon: Crosshair },
    { id: "connect", label: "CLI Hub", icon: Terminal },
    { id: "diagnostics", label: "Diagnostics", icon: Activity },
    { id: "audit", label: "Audit Log", icon: FileCheck2 }
  ];

  return (
    <aside className="w-full lg:w-56 bg-[#0D1220] border-r border-[#1E293B] flex flex-col justify-between shrink-0">
      {/* Brand */}
      <div>
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#818CF8] flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <h1 className="text-[13px] font-semibold text-white tracking-tight">
                Synapse
              </h1>
              <span className="text-[10px] text-[#64748B] block leading-none">
                Control plane
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="px-2.5 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-[12.5px] font-medium ${
                  isActive
                    ? "bg-[#818CF8]/12 text-white"
                    : "text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-[15px] h-[15px] ${isActive ? "text-[#818CF8]" : "text-[#64748B]"}`} />
                  <span>{item.label}</span>
                </div>

                {item.count > 0 && (
                  <span className={`text-[10px] tabular-nums px-1.5 py-0.5 rounded font-medium ${
                    isActive
                      ? "bg-[#818CF8]/20 text-[#A5B4FC]"
                      : "bg-white/[0.06] text-[#94A3B8]"
                  }`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Status Footer */}
      <div className="px-5 py-4 border-t border-[#1E293B] space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-[#64748B]">Status</span>
          <span className="flex items-center gap-1.5 text-[#94A3B8]">
            <span className={`w-1.5 h-1.5 rounded-full ${wsConnected ? "bg-[#34D399]" : "bg-[#F87171]"}`} />
            {wsConnected ? "Connected" : "Offline"}
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-[#64748B]">Prevented</span>
          <span className="text-[#E2E8F0] font-medium tabular-nums">
            ${stats.preventedLossUsd.toLocaleString()}
          </span>
        </div>
      </div>
    </aside>
  );
}
