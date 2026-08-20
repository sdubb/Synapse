import React, { useState } from "react";
import { Users, Power, PlusCircle, Shield, Key, Cpu, DollarSign, CheckCircle2, Lock } from "lucide-react";

export function WorkforceFleet({ agents, onToggleKillSwitch, onAddNewAgent }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [provider, setProvider] = useState("Anthropic Claude 3.5 Sonnet");
  const [department, setDepartment] = useState("Finance & Accounting");
  const [spendCeilingUsd, setSpendCeilingUsd] = useState(500);
  const [owner, setOwner] = useState("admin@enterprise.com");
  const [systemPrompt, setSystemPrompt] = useState("Operate autonomously with strict spend limit and zero-destruction boundaries.");

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddNewAgent({
      name,
      provider,
      department,
      spendCeilingUsd: Number(spendCeilingUsd),
      owner,
      systemPrompt
    });
    setShowAddModal(false);
    setName("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-surface border border-border p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            Enterprise AI Workforce Directory & Identity Layer
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            "Okta for AI Workers" — Manage identity passports, assigned spend ceilings, and instant emergency kill switches across your multi-vendor AI fleet.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New AI Worker</span>
        </button>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {agents.map(agent => {
          const isSuspended = agent.status === "SUSPENDED";

          return (
            <div
              key={agent.id}
              className={`p-5 rounded-2xl border transition space-y-4 ${
                isSuspended
                  ? "bg-rose-950/20 border-rose-500/50"
                  : "bg-surface/90 border-border hover:border-indigo-500/40"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-indigo-400">{agent.id}</span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      isSuspended ? "bg-rose-500/20 text-rose-300 border border-rose-500/40" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    }`}>
                      {agent.status}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-background border border-border text-slate-300">
                      {agent.department}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white mt-1">{agent.name}</h3>
                  <p className="text-xs text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                    <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{agent.provider}</span>
                  </p>
                </div>

                {/* Kill Switch CTA */}
                <button
                  onClick={() => onToggleKillSwitch(agent.id)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-semibold flex items-center gap-1.5 transition ${
                    isSuspended
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-md"
                      : "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30"
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{isSuspended ? "Unfreeze Agent" : "Emergency Kill Switch"}</span>
                </button>
              </div>

              {/* Metrics */}
              <div className="pt-3 border-t border-border/80 grid grid-cols-3 gap-2 font-mono text-center text-xs">
                <div className="p-2 rounded-lg bg-background border border-border/60">
                  <span className="text-[10px] text-slate-400 block">Security Score</span>
                  <strong className={`text-base font-bold ${
                    agent.securityScore >= 80 ? "text-emerald-400" : "text-amber-400"
                  }`}>
                    {agent.securityScore}/100
                  </strong>
                </div>

                <div className="p-2 rounded-lg bg-background border border-border/60">
                  <span className="text-[10px] text-slate-400 block">Spend Ceiling</span>
                  <strong className="text-base font-bold text-slate-200">
                    ${agent.spendCeilingUsd}
                  </strong>
                </div>

                <div className="p-2 rounded-lg bg-background border border-border/60">
                  <span className="text-[10px] text-slate-400 block">Tasks Executed</span>
                  <strong className="text-base font-bold text-cyan-400">
                    {agent.tasksCount}
                  </strong>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
                <span>Accountable Supervisor: <strong className="text-slate-300">{agent.owner}</strong></span>
                <span>Last Scan: {agent.lastAudit}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Agent Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-indigo-500/40 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-indigo-400" /> Onboard New Autonomous AI Worker
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white font-mono text-xs">
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Agent Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Legal Contract Reviewer"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Provider Engine</label>
                  <select
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Anthropic Claude 3.5 Sonnet">Anthropic Claude 3.5 Sonnet</option>
                    <option value="Google Antigravity / Gemini">Google Antigravity / Gemini</option>
                    <option value="OpenAI Codex / GPT-4o">OpenAI Codex / GPT-4o</option>
                    <option value="Salesforce Agentforce">Salesforce Agentforce</option>
                    <option value="Self-Hosted Llama-3">Self-Hosted Llama-3</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Spend Limit ($ USD)</label>
                  <input
                    type="number"
                    required
                    value={spendCeilingUsd}
                    onChange={(e) => setSpendCeilingUsd(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Department</label>
                <input
                  type="text"
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Owner Email</label>
                <input
                  type="email"
                  required
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow-lg shadow-indigo-600/30"
              >
                Register AI Worker with Passport
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
