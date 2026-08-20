import React, { useState } from "react";
import { Brain, Cpu, Terminal, ArrowRight, Zap, CheckCircle2, AlertTriangle, Layers } from "lucide-react";

export function AgentThoughtStream({ thoughtLogs }) {
  const [selectedAgentFilter, setSelectedAgentFilter] = useState("ALL");

  const filteredLogs = selectedAgentFilter === "ALL"
    ? thoughtLogs
    : thoughtLogs.filter(l => l.agentId === selectedAgentFilter);

  return (
    <div className="rounded-2xl bg-surface border border-border overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-[#0D0F1A] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Deep Agent Reasoning & Thought Trace (Antigravity/Codex Style)
            </h2>
            <p className="text-xs text-slate-400">
              Live inspection of autonomous agent chain-of-thought, sub-goal synthesis, and tool payloads
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300">Live Cognitive Stream</span>
        </div>
      </div>

      {/* Stream Area */}
      <div className="divide-y divide-border/60 max-h-[500px] overflow-y-auto">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs font-mono">
            No active thought traces recorded yet. Run the NVIDIA Enterprise Simulation or a Playground scenario to stream live reasoning.
          </div>
        ) : (
          filteredLogs.map((log, idx) => (
            <div key={idx} className="p-5 bg-background/50 hover:bg-surface-hover/60 transition space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-indigo-400 font-bold">{log.agentId}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-300 text-[11px]">[{log.department}]</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-surface border border-border text-cyan-400">
                    {log.model}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500">
                  {new Date().toLocaleTimeString()}
                </div>
              </div>

              {/* Chain of Thought Box */}
              <div className="p-3.5 rounded-xl bg-[#08090E] border border-indigo-500/20 text-slate-300 space-y-1.5">
                <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-indigo-400">
                  <Brain className="w-3.5 h-3.5" />
                  <span>Agent Internal Chain-of-Thought</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed italic">
                  "{log.thought}"
                </p>
              </div>

              {/* Action Goal */}
              <div className="flex items-center justify-between text-[11px] pt-1">
                <div className="flex items-center gap-2 text-slate-400">
                  <span>Sub-Goal:</span>
                  <strong className="text-emerald-400">{log.currentGoal}</strong>
                </div>
                <div className="flex items-center gap-1 text-cyan-400 font-bold">
                  <span>Tool: {log.action}()</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
