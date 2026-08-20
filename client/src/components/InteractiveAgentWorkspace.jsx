import React, { useState, useEffect } from "react";
import { Play, Sparkles, Terminal, Brain, Shield, Send, CheckCircle2, AlertOctagon, RotateCcw, Cpu, Layers, DollarSign } from "lucide-react";

export function InteractiveAgentWorkspace({ workforce, onExecuteTask }) {
  const [selectedAgentId, setSelectedAgentId] = useState(workforce[0]?.id || "Finance-Agent-024");
  const [userGoal, setUserGoal] = useState("Investigate customer Sarah Connor's account and issue an authorized $150.00 refund credit for order ord_501.");
  const [spendLimitUsd, setSpendLimitUsd] = useState(500);
  const [templates, setTemplates] = useState([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionOutput, setExecutionOutput] = useState(null);

  const selectedAgent = workforce.find(a => a.id === selectedAgentId) || workforce[0];

  useEffect(() => {
    fetch("http://localhost:4000/api/v1/templates")
      .then(r => r.json())
      .then(d => {
        if (d.templates) setTemplates(d.templates);
      })
      .catch(console.error);
  }, []);

  const handleApplyTemplate = (tpl) => {
    setUserGoal(tpl.suggestedGoal);
  };

  const handleRun = async (e) => {
    e.preventDefault();
    setIsExecuting(true);
    setExecutionOutput(null);

    try {
      await fetch("http://localhost:4000/api/v1/executor/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: selectedAgentId,
          modelProvider: selectedAgent?.modelProvider || "Anthropic",
          model: selectedAgent?.model || "claude-3-5-sonnet",
          userGoal,
          spendLimitUsd: Number(spendLimitUsd)
        })
      });
      setExecutionOutput({
        status: "RUNNING",
        message: `Task dispatched to ${selectedAgentId}. Streaming thought trace & tool execution live over WebSocket...`
      });
    } catch (err) {
      alert("Execution error: " + err.message);
    } finally {
      setTimeout(() => setIsExecuting(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-surface border border-border p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white shadow-lg shadow-indigo-500/20">
            <Terminal className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Autonomous Agent Workspace & Live Execution Terminal
            </h2>
            <p className="text-xs text-slate-400">
              Run real end-to-end agent tasks with live thought generation, tool execution, and trajectory assurance
            </p>
          </div>
        </div>

        {/* Pre-configured Prompt Subsystems */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-mono text-slate-400">Templates:</span>
          {templates.map(tpl => (
            <button
              key={tpl.templateId}
              onClick={() => handleApplyTemplate(tpl)}
              className="px-2.5 py-1 rounded-lg bg-background hover:bg-surface border border-border text-[11px] font-mono text-indigo-300 hover:text-white transition"
            >
              {tpl.title.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Column */}
        <form onSubmit={handleRun} className="lg:col-span-7 rounded-2xl bg-surface border border-border p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">Target Agent Worker</label>
              <select
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
              >
                {workforce.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.id} ({a.modelProvider})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">Autonomous Spend Ceiling ($)</label>
              <input
                type="number"
                value={spendLimitUsd}
                onChange={(e) => setSpendLimitUsd(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-mono text-slate-400 block mb-1">
              Autonomous Mission Goal / Prompt
            </label>
            <textarea
              rows={4}
              value={userGoal}
              onChange={(e) => setUserGoal(e.target.value)}
              required
              className="w-full bg-background border border-border rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500 leading-relaxed"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-background border border-border/80 text-xs font-mono text-slate-400 space-y-1">
            <div className="flex items-center gap-2 text-indigo-300 font-bold">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Active Subsystem Interceptors:</span>
            </div>
            <p className="text-[11px] text-slate-400">
              ✓ Speculative Shadow Sandbox • Trajectory Sequence Verifier • Rollback State DAG Checkpointer • Real-Time PII Redactor
            </p>
          </div>

          <button
            type="submit"
            disabled={isExecuting}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold shadow-xl shadow-indigo-600/25 disabled:opacity-50 transition"
          >
            <Play className={`w-4 h-4 fill-current ${isExecuting ? "animate-spin" : ""}`} />
            <span>{isExecuting ? "Executing Agent Loop..." : "Execute Agent Task with Synapse Governance"}</span>
          </button>
        </form>

        {/* Live Execution Stream Box */}
        <div className="lg:col-span-5 rounded-2xl bg-surface border border-border p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-border pb-3">
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <Brain className="w-4 h-4 text-cyan-400" /> Execution Status & Telemetry
              </h3>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                Live Subsystem Armed
              </span>
            </div>

            {executionOutput ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/40 text-indigo-300 text-xs">
                  {executionOutput.message}
                </div>
                <p className="text-[11px] text-slate-400">
                  Switch to <strong>'Agent Thought Stream'</strong> or <strong>'Live Telemetry & DAG'</strong> tabs to observe the step-by-step reasoning and state graph!
                </p>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center text-slate-500 text-xs font-mono">
                <Terminal className="w-8 h-8 text-slate-600 mb-2" />
                <span>Submit an autonomous mission to watch the agent plan, call tools, and verify state checkpoints live.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
