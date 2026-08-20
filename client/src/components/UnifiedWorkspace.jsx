import React, { useState } from "react";
import {
  Briefcase, Key, Terminal, Sparkles, Filter, Activity, PauseCircle,
  PlayCircle, Play, CheckCircle2, RotateCcw, Brain, Wrench, Copy, Check
} from "lucide-react";
import { EXPANDED_ENTERPRISE_ROLES } from "../../../server/src/templates/expandedRoles.js";
import { CustomPipelineBuilder } from "./CustomPipelineBuilder";

export function UnifiedWorkspace({
  agents,
  liveSteps,
  currentTransaction,
  onExecuteGoal,
  onManualRollback,
  isExecuting,
  onNavigateToTab
}) {
  const [activeMode, setActiveMode] = useState("BUILDER"); // "BUILDER" | "WORKFLOWS" | "RUN" | "CONNECT"
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [activeDaemons, setActiveDaemons] = useState([]);

  // User input states
  const [customGoal, setCustomGoal] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState(agents[0]?.id || "wf-sales-rep");
  const [spendLimitUsd, setSpendLimitUsd] = useState(500);
  const [requireApprovalAbove, setRequireApprovalAbove] = useState(300);
  const [blockDestructive, setBlockDestructive] = useState(true);
  const [redactPii, setRedactPii] = useState(true);

  // Connect tab state
  const [sdkLang, setSdkLang] = useState("python");
  const [copied, setCopied] = useState(false);

  const fetchDaemons = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/v1/daemons").then(r => r.json());
      if (res.daemons) setActiveDaemons(res.daemons);
    } catch (e) {}
  };

  const handleToggle24x7 = async (wf) => {
    const isRunning = activeDaemons.some(d => d.agentId === wf.id);
    if (isRunning) {
      await fetch(`http://localhost:4000/api/v1/daemons/${wf.id}/stop`, { method: "POST" });
    } else {
      await fetch(`http://localhost:4000/api/v1/daemons/${wf.id}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intervalSeconds: 15, goal: `Continuous 24/7 autonomous pipeline for ${wf.name}` })
      });
    }
    fetchDaemons();
  };

  const categories = ["ALL", "Revenue & Sales", "Marketing & Growth", "Finance & Accounting", "Legal & Risk", "HR & People Ops", "Engineering & SRE", "Cybersecurity & SecOps", "Product & Engineering", "Procurement & Logistics"];

  const filteredWorkflows = selectedCategory === "ALL"
    ? EXPANDED_ENTERPRISE_ROLES
    : EXPANDED_ENTERPRISE_ROLES.filter(w => w.category === selectedCategory);

  const handleLaunchWorkflow = (wf) => {
    onExecuteGoal({
      agentId: wf.id,
      userGoal: `Execute Full-Day Autonomous Pipeline for ${wf.name}`,
      spendLimitUsd: wf.spendCeilingUsd
    });
  };

  const handleRunTask = (e) => {
    e.preventDefault();
    if (!customGoal.trim()) return;

    onExecuteGoal({
      agentId: selectedAgentId,
      userGoal: customGoal,
      spendLimitUsd: Number(spendLimitUsd),
      requiresHitlAboveUsd: Number(requireApprovalAbove),
      blockDestructive,
      redactPii
    });
  };

  const sdkSnippets = {
    python: `# 1. Install Synapse Enterprise SDK
pip install synapse-guard

# 2. Protect any custom Python / LangGraph / CrewAI worker
import synapse_guard

synapse_guard.init(
    api_key="syn_live_enterprise_99",
    spend_limit=${spendLimitUsd},
    require_approval_above=${requireApprovalAbove},
    block_destructive=${blockDestructive ? "True" : "False"}
)`,
    antigravity: `# Google Antigravity CLI (agy) Native Security Interceptor
agy config set security.proxy "http://localhost:4000/api/v1/intercept"
agy config set spend.ceiling ${spendLimitUsd}
agy config set rollback.auto true

agy run --goal "${customGoal || "Refactor production microservices"}" --with-synapse`,
    mcp: `// Claude Desktop & Cursor IDE Universal MCP Config
{
  "mcpServers": {
    "synapse-control-plane": {
      "command": "npx",
      "args": ["-y", "@synapse/mcp-gateway", "--server", "http://localhost:4000"]
    }
  }
}`
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(sdkSnippets[sdkLang]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Navigation Tabs */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              Autonomous Enterprise Workflow & Task Center
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Design multi-stage pipelines, attach enterprise tools, run background workers, or trigger ad-hoc tasks.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs flex-wrap gap-1">
            <button
              onClick={() => setActiveMode("BUILDER")}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                activeMode === "BUILDER"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Pipeline Architect</span>
            </button>

            <button
              onClick={() => setActiveMode("WORKFLOWS")}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                activeMode === "WORKFLOWS"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Workforce Matrix</span>
            </button>

            <button
              onClick={() => setActiveMode("RUN")}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                activeMode === "RUN"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Ad-Hoc Studio</span>
            </button>

            <button
              onClick={() => setActiveMode("CONNECT")}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                activeMode === "CONNECT"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>SDK & CLI Hook</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODE 1: CUSTOM TASK & TOOL BUILDER */}
      {activeMode === "BUILDER" && (
        <CustomPipelineBuilder onExecuteGoal={onExecuteGoal} />
      )}

      {/* MODE 2: WORKFORCE MATRIX */}
      {activeMode === "WORKFLOWS" && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-400 flex items-center gap-1 font-semibold shrink-0">
              <Filter className="w-3.5 h-3.5" /> Filter:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg border transition shrink-0 font-medium ${
                  selectedCategory === cat
                    ? "bg-blue-600 text-white border-blue-500 shadow-sm"
                    : "bg-slate-900 text-slate-400 hover:text-white border-slate-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWorkflows.map((wf) => {
              const activeDaemon = activeDaemons.find(d => d.agentId === wf.id);
              const is24x7Running = !!activeDaemon;

              return (
                <div
                  key={wf.id}
                  className={`p-5 rounded-2xl border transition flex flex-col justify-between space-y-4 text-xs ${
                    is24x7Running
                      ? "bg-slate-900 border-blue-500 shadow-md shadow-blue-500/10"
                      : "bg-slate-900 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {wf.badge}
                      </span>
                      
                      {is24x7Running ? (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <Activity className="w-3 h-3 text-emerald-400 animate-spin" />
                          Daemon Active (#{activeDaemon.runsCount} runs)
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">{wf.dailyVolume}</span>
                      )}
                    </div>

                    <div>
                      <span className="text-xs font-semibold text-blue-400">{wf.category}</span>
                      <h3 className="text-sm font-semibold text-white mt-0.5">{wf.name}</h3>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">{wf.description}</p>
                  </div>

                  <div className="pt-3 flex items-center gap-2 border-t border-slate-800">
                    <button
                      disabled={isExecuting}
                      onClick={() => handleLaunchWorkflow(wf)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition disabled:opacity-50 text-xs shadow-sm"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Run Job</span>
                    </button>

                    <button
                      onClick={() => handleToggle24x7(wf)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-semibold transition text-xs border ${
                        is24x7Running
                          ? "bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20"
                          : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      {is24x7Running ? <PauseCircle className="w-3.5 h-3.5" /> : <PlayCircle className="w-3.5 h-3.5" />}
                      <span>{is24x7Running ? "Stop Daemon" : "Start Daemon"}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODE 3: CUSTOM AD-HOC TASK */}
      {activeMode === "RUN" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-5">
            <form onSubmit={handleRunTask} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Target AI Agent</label>
                <select
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                >
                  {agents.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.provider})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Task Directive</label>
                <textarea
                  rows={4}
                  value={customGoal}
                  onChange={(e) => setCustomGoal(e.target.value)}
                  placeholder="e.g. Audit customer account Sarah Connor and issue authorized $150 credit..."
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-medium">Spend Ceiling</span>
                  <span className="text-emerald-400 font-semibold font-mono">${spendLimitUsd} USD</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="5000"
                  step="50"
                  value={spendLimitUsd}
                  onChange={(e) => setSpendLimitUsd(e.target.value)}
                  className="w-full accent-blue-600"
                />
              </div>

              <button
                type="submit"
                disabled={isExecuting || !customGoal.trim()}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition shadow-md shadow-blue-600/20 disabled:opacity-50 text-xs"
              >
                {isExecuting ? "Executing Pipeline..." : "Execute Custom Directive"}
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Brain className="w-4 h-4 text-blue-400" /> Real-time Execution Output
            </h3>

            <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
              {liveSteps.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center text-slate-500 text-xs">
                  Type a directive on the left and click execute.
                </div>
              ) : (
                liveSteps.map((step, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-slate-800 bg-slate-950 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-semibold">{step.title}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{step.verdict}</span>
                    </div>
                    <p className="text-slate-300 text-xs">"{step.thought}"</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODE 4: CONNECT AGENT SDK */}
      {activeMode === "CONNECT" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 text-xs">
            <h3 className="text-sm font-semibold text-white">Integration Target</h3>
            <div className="space-y-2">
              <button
                onClick={() => setSdkLang("python")}
                className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between ${
                  sdkLang === "python" ? "bg-blue-600/15 border-blue-500 text-white font-semibold" : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>Python SDK (LangGraph / CrewAI)</span>
              </button>

              <button
                onClick={() => setSdkLang("antigravity")}
                className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between ${
                  sdkLang === "antigravity" ? "bg-blue-600/15 border-blue-500 text-white font-semibold" : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>Google Antigravity CLI (agy)</span>
              </button>

              <button
                onClick={() => setSdkLang("mcp")}
                className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between ${
                  sdkLang === "mcp" ? "bg-blue-600/15 border-blue-500 text-white font-semibold" : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>Claude Desktop & Cursor MCP</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-8 rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between text-xs">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-blue-400" /> Copy & Paste Into Your Codebase
              </h3>

              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition text-xs font-medium"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copied ? "Copied!" : "Copy Code"}</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <pre className="text-xs font-mono text-slate-200 leading-relaxed overflow-x-auto">
                <code>{sdkSnippets[sdkLang]}</code>
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
