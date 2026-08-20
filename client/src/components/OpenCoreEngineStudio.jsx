import React, { useState, useEffect } from "react";
import {
  Terminal, Play, CheckCircle2, Cpu, Shield, Sparkles, Activity,
  Server, ArrowRight, Settings, Code, Layers, Zap
} from "lucide-react";

export function OpenCoreEngineStudio({ onExecuteGoal }) {
  const [selectedCli, setSelectedCli] = useState("aider");
  const [selectedModel, setSelectedModel] = useState("deepseek-r1:70b");
  const [customGoal, setCustomGoal] = useState("Audit enterprise cloud compliance, sync Salesforce CRM, and delegate invoice to Treasury");
  const [spendLimitUsd, setSpendLimitUsd] = useState(2500);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);

  const cliDrivers = [
    {
      id: "aider",
      name: "Aider (Open-Source CLI)",
      type: "Git-Native Pair Programmer",
      badge: "Popular (165k ⭐)",
      description: "Model-agnostic open-source CLI with surgical multi-file edits and atomic Git rollbacks.",
      installCmd: "pip install aider-chat",
      compatibleModels: ["deepseek-r1:70b", "llama3.3:70b", "qwen2.5-coder:32b", "gpt-4o", "claude-3-7-sonnet"]
    },
    {
      id: "openhands",
      name: "OpenHands (All-Hands AI)",
      type: "Autonomous Software Harness",
      badge: "Linux Foundation",
      description: "Full-scale autonomous engineering agent harness capable of long-horizon task completion.",
      installCmd: "docker run -it -p 3000:3000 ghcr.io/all-hands-ai/openhands",
      compatibleModels: ["deepseek-r1", "llama-3-70b", "claude-3-5-sonnet", "gpt-4o"]
    },
    {
      id: "goose",
      name: "Goose CLI (Block / Square)",
      type: "Native MCP Extensible Runtime",
      badge: "Apache-2.0",
      description: "Open-source developer agent built specifically to execute tools over Model Context Protocol (MCP).",
      installCmd: "curl -fsSL https://github.com/block/goose/releases/download/stable/download_cli.sh | bash",
      compatibleModels: ["ollama/deepseek-r1", "openai/gpt-4o", "anthropic/claude-3-5-sonnet"]
    },
    {
      id: "agy",
      name: "Google Antigravity CLI (agy)",
      type: "Antigravity Agent Runtime",
      badge: "Native Engine",
      description: "Google's autonomous CLI process engine with subagent delegation and execution sandboxes.",
      installCmd: "Built-in / agy.exe",
      compatibleModels: ["gemini-2.5-pro", "gemini-2.5-flash", "claude-3-7-sonnet"]
    },
    {
      id: "native_daemon",
      name: "Synapse Native Daemon",
      type: "Zero-Dependency OS Runner",
      badge: "Zero-Setup",
      description: "Runs directly on pure Node.js runtime without needing any external Python or Go binaries installed.",
      installCmd: "Built-in (Zero Install)",
      compatibleModels: ["deepseek-r1 (Ollama)", "llama3 (vLLM)", "gpt-4o (REST)"]
    }
  ];

  const currentCli = cliDrivers.find(c => c.id === selectedCli) || cliDrivers[0];

  const handleRunCli = async (e) => {
    e.preventDefault();
    setIsExecuting(true);
    setExecutionResult(null);

    try {
      const res = await fetch("http://localhost:4000/api/v1/engine/cli/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliId: selectedCli,
          agentId: "agent-sales-ae",
          goal: customGoal,
          model: selectedModel,
          spendCeilingUsd: Number(spendLimitUsd)
        })
      }).then(r => r.json());

      setExecutionResult(res);
    } catch (err) {
      alert("Execution error: " + err.message);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Top Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0C0E17] via-[#0A1226] to-[#0C0E17] border border-cyan-500/30 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 text-[10px]">
              Multi-CLI Swappable Architecture
            </span>
            <h2 className="text-sm font-bold text-white">Universal Open-Source Agent CLI Switcher</h2>
          </div>
          <p className="text-[11px] text-slate-400 font-sans">
            Choose ANY open-source CLI runtime (Aider, OpenHands, Goose, agy, or Synapse Native) to drive your agents. All CLIs automatically receive Synapse's 14 FAANG tools and OPA spend limits.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface border border-border text-emerald-400 font-bold shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Multi-CLI Driver Active</span>
        </div>
      </div>

      {/* CLI Selector Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {cliDrivers.map((cli) => {
          const isSelected = selectedCli === cli.id;

          return (
            <button
              key={cli.id}
              type="button"
              onClick={() => {
                setSelectedCli(cli.id);
                setSelectedModel(cli.compatibleModels[0]);
              }}
              className={`p-4 rounded-xl border text-left transition flex flex-col justify-between space-y-2 ${
                isSelected
                  ? "bg-cyan-950/40 border-cyan-500 text-white shadow-lg shadow-cyan-500/10"
                  : "bg-surface border-border text-slate-400 hover:text-white"
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-bold border bg-indigo-500/20 text-indigo-300 border-indigo-500/40">
                    {cli.badge}
                  </span>
                </div>
                <strong className="text-xs text-white block mt-1">{cli.name.split(" ")[0]}</strong>
                <p className="text-[10px] text-slate-400 font-sans leading-tight">{cli.type}</p>
              </div>

              <span className="text-[9.5px] text-cyan-400 font-bold">
                {isSelected ? "● SELECTED DRIVER" : "USE THIS CLI"}
              </span>
            </button>
          );
        })}
      </div>

      {/* Configuration & Live Execution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form */}
        <div className="lg:col-span-5 rounded-2xl bg-surface border border-border p-6 space-y-4">
          <div className="space-y-1 border-b border-border pb-3">
            <span className="text-[10px] text-cyan-400 uppercase font-bold">Active CLI Driver:</span>
            <h3 className="text-sm font-bold text-white">{currentCli.name}</h3>
            <p className="text-[11px] text-slate-400 font-sans">{currentCli.description}</p>
          </div>

          <form onSubmit={handleRunCli} className="space-y-4">
            <div>
              <label className="text-slate-300 font-bold block mb-1">Target Model for {currentCli.name.split(" ")[0]}</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full bg-background border border-cyan-500/40 rounded-xl px-3 py-2 text-cyan-300 font-bold text-xs focus:outline-none"
              >
                {currentCli.compatibleModels.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-bold block mb-1">Autonomous Task Directive</label>
              <textarea
                rows={3}
                value={customGoal}
                onChange={(e) => setCustomGoal(e.target.value)}
                placeholder="Directive for the agent CLI..."
                required
                className="w-full bg-background border border-border rounded-xl p-3 text-slate-100 font-sans text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="p-3 rounded-xl bg-background border border-border space-y-1">
              <span className="text-[10px] text-slate-400 block">How to Install this CLI independently:</span>
              <code className="text-xs text-amber-300 font-mono block select-all overflow-x-auto">{currentCli.installCmd}</code>
            </div>

            <button
              type="submit"
              disabled={isExecuting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold transition shadow-lg shadow-cyan-600/20 text-xs disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isExecuting ? "Spawning CLI Subprocess..." : `Spawn & Supervise ${currentCli.name.split(" ")[0]}`}</span>
            </button>
          </form>
        </div>

        {/* Right Output */}
        <div className="lg:col-span-7 rounded-2xl bg-surface border border-border p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                Live CLI Process Supervision & OPA Hook
              </h3>
              <span className="text-[10px] text-emerald-400 font-bold">MCP Port: 4005</span>
            </div>

            {executionResult ? (
              <div className="p-4 rounded-xl bg-background border border-emerald-500/40 space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">{executionResult.cli}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    PID: {executionResult.pid} (Supervised)
                  </span>
                </div>

                <p className="text-slate-300 text-xs font-sans">{executionResult.message}</p>

                <div className="p-2.5 rounded-lg bg-[#08090E] border border-border/80 text-[11px] text-cyan-300">
                  <span>Transaction ID: <code>{executionResult.txId}</code></span>
                </div>
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-center text-slate-500 text-xs">
                <span>Select your preferred CLI (Aider / OpenHands / Goose / agy) and click Spawn.</span>
              </div>
            )}

            <div className="space-y-2 pt-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Why Any CLI Works with Synapse:</span>
              <div className="text-[11px] text-slate-300 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>1. Synapse injects <code>SYNAPSE_MCP_GATEWAY=http://localhost:4005</code> into the CLI process.</span>
              </div>
              <div className="text-[11px] text-slate-300 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>2. The CLI discovers all 14 FAANG tools (AWS, K8s, SAP) automatically.</span>
              </div>
              <div className="text-[11px] text-slate-300 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>3. OPA Rego invariants and SQLite WAL Merkle logging guard every action.</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-background border border-border/80 text-[10.5px] text-slate-400 flex items-center justify-between">
            <span>Zero Vendor Lock-in: Switch CLIs anytime.</span>
            <span className="text-cyan-300 font-bold">100% Open Standards</span>
          </div>
        </div>
      </div>
    </div>
  );
}
