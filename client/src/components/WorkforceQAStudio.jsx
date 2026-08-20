import React, { useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Play, RefreshCw, Cpu, Layers, GitBranch, ShieldCheck } from "lucide-react";

export function WorkforceQAStudio({ workforce, onRunQA, initialSelectedAgentId }) {
  const [selectedAgentId, setSelectedAgentId] = useState(initialSelectedAgentId || workforce[0]?.id || "Finance-Agent-024");
  const [isRunningQA, setIsRunningQA] = useState(false);
  const [qaReport, setQaReport] = useState(null);

  const selectedAgent = workforce.find(a => a.id === selectedAgentId) || workforce[0];

  const handleStartQA = async () => {
    setIsRunningQA(true);
    setQaReport(null);
    try {
      const res = await onRunQA(selectedAgentId, 10000);
      setQaReport(res);
    } catch (e) {
      alert("QA run failed: " + e.message);
    } finally {
      setIsRunningQA(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-surface border border-border p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Workforce Reliability & Synthetic QA Matrix
            </h2>
            <p className="text-xs text-slate-400">
              "Unit Testing for AI Workers" — 10,000 synthetic edge-case scenarios before granting production access
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(e.target.value)}
            disabled={isRunningQA}
            className="bg-background border border-border rounded-xl px-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
          >
            {workforce.map(a => (
              <option key={a.id} value={a.id}>
                {a.id} — {a.name} ({a.modelProvider})
              </option>
            ))}
          </select>

          <button
            disabled={isRunningQA}
            onClick={handleStartQA}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/25 disabled:opacity-50 transition"
          >
            <Play className={`w-4 h-4 fill-current ${isRunningQA ? "animate-pulse" : ""}`} />
            <span>{isRunningQA ? "Testing 10,000 Scenarios..." : "Run 10,000 QA Scenarios"}</span>
          </button>
        </div>
      </div>

      {/* QA Report Results */}
      {qaReport && (
        <div className="space-y-6">
          {/* Top Score Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-surface border border-border">
              <div className="text-xs text-slate-400 font-mono">Workforce Reliability</div>
              <div className="text-3xl font-extrabold font-mono text-emerald-400 mt-1">
                {qaReport.reliabilityScore}%
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Simulated execution consistency</p>
            </div>

            <div className="p-5 rounded-2xl bg-surface border border-border">
              <div className="text-xs text-slate-400 font-mono">Total Edge Scenarios</div>
              <div className="text-3xl font-extrabold font-mono text-cyan-400 mt-1">
                {qaReport.simulatedScenarios.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Synthesized real-world edge cases</p>
            </div>

            <div className="p-5 rounded-2xl bg-surface border border-border">
              <div className="text-xs text-slate-400 font-mono">Passed Scenarios</div>
              <div className="text-3xl font-extrabold font-mono text-indigo-400 mt-1">
                {qaReport.passedCount} / {qaReport.evaluatedCoreScenarios}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Zero-drift execution</p>
            </div>

            <div className="p-5 rounded-2xl bg-surface border border-border">
              <div className="text-xs text-slate-400 font-mono">Auto-Regression Tests Created</div>
              <div className="text-3xl font-extrabold font-mono text-amber-400 mt-1">
                {qaReport.autoCreatedRegressionTests.length}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Locked in CI/CD pipeline</p>
            </div>
          </div>

          {/* Detailed Failure & Edge Case Scenarios */}
          <div className="rounded-2xl bg-surface border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-[#0D0F1A] flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-cyan-400" /> Edge-Case Scenarios & Drift Analysis
              </h3>
              <span className="text-xs font-mono text-slate-400">
                {qaReport.failures.length} Edge Failures Caught
              </span>
            </div>

            <div className="divide-y divide-border/60">
              {qaReport.failures.map((f) => (
                <div key={f.scenarioId} className="p-5 space-y-3 bg-background/50 hover:bg-surface-hover transition">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2.5 py-0.5 rounded-full">
                        FAIL ❌ {f.scenarioId}
                      </span>
                      <h4 className="text-xs font-bold text-white">{f.title}</h4>
                    </div>
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                      Locked: {f.autoGeneratedRegressionTestId}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
                    <div className="p-3 rounded-xl bg-[#0C0E17] border border-border space-y-1">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Input Scenario:</span>
                      <p className="text-slate-200">{f.prompt}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-[#0C0E17] border border-border space-y-1">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Expected Safe Action:</span>
                      <p className="text-emerald-400">{f.expectedAction}</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30 font-mono text-xs space-y-1 text-rose-300">
                    <div><strong>Actual Agent Output:</strong> {f.actualAction}</div>
                    <div className="text-[11px] text-slate-400"><strong>Root Cause:</strong> {f.reason}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
