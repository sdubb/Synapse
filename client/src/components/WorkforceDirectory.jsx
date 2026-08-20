import React, { useState } from "react";
import { Users, Shield, Lock, Power, AlertTriangle, CheckCircle2, Search, ExternalLink, Cpu, Key, ArrowUpRight } from "lucide-react";

export function WorkforceDirectory({ workforce, onToggleKillSwitch, onSelectAgentForPentest, onSelectAgentForQA }) {
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredWorkforce = workforce.filter(a =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.modelProvider.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-surface border border-border p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Enterprise AI Workforce Directory & Identity Layer
            </h2>
            <p className="text-xs text-slate-400">
              The "Okta for AI Workers" — Cross-vendor governance for OpenAI, Anthropic, Google, and Custom models
            </p>
          </div>
        </div>

        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search agent, model, department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
          />
        </div>
      </div>

      {/* Workforce Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredWorkforce.map(agent => {
          const isSuspended = agent.status === "SUSPENDED";
          const isQuarantined = agent.status === "QUARANTINED";

          return (
            <div
              key={agent.id}
              className={`p-5 rounded-2xl border transition-all relative overflow-hidden ${
                isSuspended
                  ? "bg-rose-950/20 border-rose-500/50"
                  : isQuarantined
                  ? "bg-amber-950/20 border-amber-500/50"
                  : "bg-surface/90 border-border hover:border-indigo-500/40"
              }`}
            >
              {/* Card Top */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-indigo-400">{agent.id}</span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      isSuspended ? "bg-rose-500/20 text-rose-300 border border-rose-500/40" :
                      isQuarantined ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" :
                      "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    }`}>
                      {agent.status}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-background border border-border text-slate-300">
                      {agent.department}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mt-1">{agent.name}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5 font-mono">
                    <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{agent.modelProvider} ({agent.model})</span>
                  </p>
                </div>

                {/* Kill switch */}
                <button
                  onClick={() => onToggleKillSwitch(agent.id)}
                  className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
                    isSuspended
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500"
                      : "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30"
                  }`}
                  title={isSuspended ? "Re-activate AI Worker" : "Emergency Kill Switch"}
                >
                  <Power className="w-4 h-4" />
                  <span className="hidden sm:inline">{isSuspended ? "Unfreeze" : "Kill Switch"}</span>
                </button>
              </div>

              {/* Metrics Row */}
              <div className="mt-4 pt-3 border-t border-border/80 grid grid-cols-3 gap-2 text-center text-xs font-mono">
                <div className="p-2 rounded-lg bg-background border border-border/60">
                  <div className="text-[10px] text-slate-400">Security Score</div>
                  <div className={`text-base font-bold mt-0.5 ${
                    agent.securityScore >= 80 ? "text-emerald-400" :
                    agent.securityScore >= 50 ? "text-amber-400" : "text-rose-400"
                  }`}>
                    {agent.securityScore}/100
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-background border border-border/60">
                  <div className="text-[10px] text-slate-400">Reliability</div>
                  <div className="text-base font-bold text-cyan-400 mt-0.5">
                    {agent.reliabilityScore}%
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-background border border-border/60">
                  <div className="text-[10px] text-slate-400">Spend Ceiling</div>
                  <div className="text-base font-bold text-slate-200 mt-0.5">
                    ${agent.spendLimitUsd}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex items-center justify-between gap-2 pt-2">
                <button
                  onClick={() => setSelectedAgent(agent)}
                  className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-mono"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>View Passport</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSelectAgentForPentest(agent.id)}
                    className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-mono transition"
                  >
                    Attack & Pentest
                  </button>
                  <button
                    onClick={() => onSelectAgentForQA(agent.id)}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-mono transition"
                  >
                    Run QA Scenarios
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Worker Passport Modal */}
      {selectedAgent && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-indigo-500/40 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">AI Worker Identity Passport</h3>
                  <p className="text-xs text-slate-400 font-mono">Immutable Cryptographic Identity Record</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAgent(null)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-background border border-border">
                <div><span className="text-slate-400">Agent ID:</span> <strong className="text-white">{selectedAgent.id}</strong></div>
                <div><span className="text-slate-400">Department:</span> <strong className="text-white">{selectedAgent.department}</strong></div>
                <div><span className="text-slate-400">Model Provider:</span> <strong className="text-cyan-400">{selectedAgent.modelProvider}</strong></div>
                <div><span className="text-slate-400">Owner Email:</span> <strong className="text-slate-300">{selectedAgent.ownerEmail}</strong></div>
                <div><span className="text-slate-400">Passport Signature:</span> <span className="text-indigo-400 truncate">{selectedAgent.passportSignature}</span></div>
                <div><span className="text-slate-400">Last Pentest:</span> <span className="text-slate-300">{selectedAgent.lastPentest}</span></div>
              </div>

              <div>
                <span className="text-slate-400 font-bold block mb-1">Authorized Tool Bindings:</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedAgent.allowedTools.map(t => (
                    <span key={t} className="px-2.5 py-1 rounded-md bg-background border border-border text-slate-200">
                      {t}()
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-bold block mb-1">Allowed Agent-to-Agent Delegation Whitelist:</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedAgent.delegationWhitelist.length > 0 ? (
                    selectedAgent.delegationWhitelist.map(d => (
                      <span key={d} className="px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
                        {d}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-500">No external delegation permissions (Strict isolation)</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
