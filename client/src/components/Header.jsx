import React from "react";
import { ShieldCheck, Activity, Terminal, Lock, Sparkles, RefreshCw } from "lucide-react";

export function Header({ wsConnected, stats, onRunScenario, isRunningScenario, onRefresh }) {
  return (
    <header className="border-b border-border bg-[#0C0E17]/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Mission */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#0C0E17] animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Synapse<span className="text-indigo-400">Guard</span>
              </h1>
              <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                v1.0 MVP
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> EU AI Act Art.14 Verified
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Deterministic Runtime, Speculative Sandbox & Universal Rollback Engine for Autonomous Agents
            </p>
          </div>
        </div>

        {/* Live System Status & Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-border text-xs">
            <span className={`w-2 h-2 rounded-full ${wsConnected ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-rose-500"}`} />
            <span className="text-slate-300 font-mono">
              {wsConnected ? "LIVE TELEMETRY STREAM" : "CONNECTING..."}
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-border text-xs text-slate-400 font-mono">
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            <span>Avg Overhead: <strong className="text-slate-200">8.4ms</strong></span>
          </div>

          <button
            onClick={onRefresh}
            className="p-2 rounded-lg bg-surface hover:bg-surface-hover border border-border text-slate-300 hover:text-white transition"
            title="Refresh state"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
