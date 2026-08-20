import React from "react";
import {
  Layers, Shield, GitFork, UserCheck, AlertOctagon, Code2,
  FileCheck2, Crosshair, Users, Activity, Terminal, Sparkles
} from "lucide-react";

export function SidebarNav({ activeTab, setActiveTab, stats, wsConnected }) {
  const navItems = [
    { id: "pipeline_studio", label: "Pipeline Architect", icon: Layers, badge: "Main Engine" },
    { id: "workforce", label: "Fleet Supervisor", icon: Users, count: stats.activeAgents },
    { id: "hitl", label: "HITL Approvals", icon: UserCheck, count: stats.pendingApprovals },
    { id: "incidents", label: "Incident Runbooks", icon: AlertOctagon, count: stats.activeIncidents },
    { id: "policies", label: "Rego / OPA Policies", icon: Code2 },
    { id: "a2a", label: "Google A2A Mesh", icon: GitFork },
    { id: "redteam", label: "Red-Team Security", icon: Crosshair },
    { id: "connect", label: "Universal CLI Hub", icon: Terminal },
    { id: "diagnostics", label: "Diagnostics Engine", icon: Activity },
    { id: "audit", label: "Audit Ledger", icon: FileCheck2 }
  ];

  return (
    <aside className="w-full lg:w-64 bg-[#0A0D18] border-r border-border flex flex-col justify-between p-4 shrink-0">
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-white tracking-wide font-mono flex items-center gap-1.5">
              SYNAPSE <span className="text-[10px] text-cyan-400">v2.0</span>
            </h1>
            <span className="text-[10px] text-slate-400 font-mono block">Enterprise AI Control Plane</span>
          </div>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition text-xs font-mono font-medium ${
                  isActive
                    ? "bg-indigo-600/20 text-white border border-indigo-500/50 shadow-md shadow-indigo-500/10"
                    : "text-slate-400 hover:text-slate-200 hover:bg-surface"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                    {item.badge}
                  </span>
                )}

                {item.count > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-border space-y-2 text-[11px] font-mono">
        <div className="flex items-center justify-between text-slate-400">
          <span>Control Plane:</span>
          <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <span className={`w-2 h-2 rounded-full ${wsConnected ? "bg-emerald-400 animate-pulse" : "bg-rose-500"}`} />
            {wsConnected ? "ONLINE (VPC)" : "OFFLINE"}
          </span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span>Prevented Loss:</span>
          <strong className="text-slate-200">${stats.preventedLossUsd.toLocaleString()}</strong>
        </div>
      </div>
    </aside>
  );
}
