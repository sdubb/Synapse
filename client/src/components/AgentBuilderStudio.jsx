import React, { useState } from "react";
import { PlusCircle, Cpu, Shield, Key, Sparkles, Check, Copy, Code, Terminal, Layers } from "lucide-react";

export function AgentBuilderStudio({ onAgentCreated }) {
  const [name, setName] = useState("Tax-Compliance-Auditor");
  const [department, setDepartment] = useState("Corporate Finance");
  const [ownerEmail, setOwnerEmail] = useState("cfo-tax@enterprise.com");
  const [modelProvider, setModelProvider] = useState("Anthropic");
  const [model, setModel] = useState("claude-3-5-sonnet");
  const [spendLimitUsd, setSpendLimitUsd] = useState(2500);
  const [primaryMission, setPrimaryMission] = useState("Audit quarterly GST/VAT filings and reconcile invoices across global subsidiaries.");
  const [allowedTools, setAllowedTools] = useState("fetch_tax_ledger, verify_ein_tin, issue_adjustment_credit");
  const [isBuilding, setIsBuilding] = useState(false);
  const [createdResult, setCreatedResult] = useState(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsBuilding(true);
    try {
      const res = await fetch("http://localhost:4000/api/v1/builder/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          department,
          ownerEmail,
          modelProvider,
          model,
          spendLimitUsd: Number(spendLimitUsd),
          primaryMission,
          allowedTools: allowedTools.split(",").map(t => t.trim()),
          delegationWhitelist: ["Finance-Agent-024"]
        })
      });
      const data = await res.json();
      setCreatedResult(data);
      if (onAgentCreated) onAgentCreated(data.agent);
    } finally {
      setIsBuilding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-surface border border-border p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <PlusCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Visual AI Worker Builder & Hardened Identity Forge
            </h2>
            <p className="text-xs text-slate-400">
              Configure, harden, and issue cryptographic passports for new autonomous agents
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Column */}
        <form onSubmit={handleCreate} className="lg:col-span-7 rounded-2xl bg-surface border border-border p-6 space-y-4">
          <h3 className="text-sm font-bold text-white mb-2 font-mono flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" /> Agent Parameters & Governance Specs
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">Agent Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">Assigned Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">Model Provider</label>
              <select
                value={modelProvider}
                onChange={(e) => setModelProvider(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
              >
                <option value="Anthropic">Anthropic</option>
                <option value="OpenAI">OpenAI</option>
                <option value="Google Cloud">Google Cloud</option>
                <option value="Self-Hosted">Self-Hosted (Llama / DeepSeek)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">Model ID</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                required
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">Max Spend ($)</label>
              <input
                type="number"
                value={spendLimitUsd}
                onChange={(e) => setSpendLimitUsd(e.target.value)}
                required
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-mono text-slate-400 block mb-1">Owner Email (Accountable Human Supervisor)</label>
            <input
              type="email"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              required
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-slate-400 block mb-1">Primary Operational Mission</label>
            <textarea
              rows={3}
              value={primaryMission}
              onChange={(e) => setPrimaryMission(e.target.value)}
              required
              className="w-full bg-background border border-border rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-slate-400 block mb-1">Authorized Tool Bindings (Comma-separated)</label>
            <input
              type="text"
              value={allowedTools}
              onChange={(e) => setAllowedTools(e.target.value)}
              required
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={isBuilding}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold shadow-xl shadow-indigo-600/25 disabled:opacity-50 transition"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isBuilding ? "Forging Hardened Identity..." : "Forge & Register AI Worker"}</span>
          </button>
        </form>

        {/* Output & Passport Preview Column */}
        <div className="lg:col-span-5 rounded-2xl bg-surface border border-border p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-border pb-3">
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400" /> Hardened System Prompt & Manifest
              </h3>
              {createdResult && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(createdResult.generatedSystemPrompt);
                    setCopiedPrompt(true);
                    setTimeout(() => setCopiedPrompt(false), 2000);
                  }}
                  className="flex items-center gap-1 text-[11px] font-mono text-indigo-400 hover:text-indigo-300"
                >
                  {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPrompt ? "Copied" : "Copy Prompt"}</span>
                </button>
              )}
            </div>

            {createdResult ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/40 text-emerald-300 text-[11px]">
                  ✓ <strong>Registered Successfully:</strong> {createdResult.agent.id} added to Enterprise Identity Directory!
                </div>

                <div className="p-3 rounded-xl bg-background border border-border">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Generated System Prompt:</span>
                  <pre className="text-[11px] text-slate-300 whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {createdResult.generatedSystemPrompt}
                  </pre>
                </div>

                <div className="p-3 rounded-xl bg-background border border-border">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">MCP Configuration JSON:</span>
                  <pre className="text-[10px] text-cyan-400 overflow-x-auto">
                    {JSON.stringify(createdResult.mcpConfigSnippet, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center text-slate-500 text-xs font-mono">
                <Terminal className="w-8 h-8 text-slate-600 mb-2" />
                <span>Fill parameters to auto-generate a hardened system prompt and cryptographic AI Worker passport.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
