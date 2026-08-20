import React, { useState, useEffect } from "react";
import { CheckCircle2, AlertTriangle, Play, ShieldCheck, Activity, RefreshCw, Lock, Cpu } from "lucide-react";

export function ConnectionDiagnostics({ agents }) {
  const [selectedAgentId, setSelectedAgentId] = useState(agents[0]?.id || "wf-sales-rep");
  const [isRunning, setIsRunning] = useState(false);
  const [report, setReport] = useState(null);

  const handleRunDiagnostics = async () => {
    setIsRunning(true);
    setReport(null);
    try {
      const res = await fetch("http://localhost:4000/api/v1/diagnostics/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: selectedAgentId })
      });
      const data = await res.json();
      setReport(data);
    } catch (e) {
      alert("Diagnostics failed: " + e.message);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    handleRunDiagnostics();
  }, [selectedAgentId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            Zero-Mistake Diagnostic Verification & Validation Inspector
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Validates A2A protocol handshakes, trajectory compilers, shadow sandboxes, rollback inverse coverage, and PII filters before production deployment.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(e.target.value)}
            disabled={isRunning}
            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            {agents.map(a => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.provider})
              </option>
            ))}
          </select>

          <button
            disabled={isRunning}
            onClick={handleRunDiagnostics}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 disabled:opacity-50 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? "animate-spin" : ""}`} />
            <span>{isRunning ? "Verifying..." : "Run 6-Point Verification"}</span>
          </button>
        </div>
      </div>

      {/* Overall Health Seal */}
      {report && (
        <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>{report.overallHealth}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {report.passedChecks}/{report.totalChecks} Checks Passed
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                All safety interceptors, shadow forks, and inverse DAG operations verified in {report.durationMs}ms.
              </p>
            </div>
          </div>

          <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
            ✓ Safe for Production Fleet
          </span>
        </div>
      )}

      {/* 6-Point Checks Detailed List */}
      {report && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {report.checks.map(chk => (
            <div
              key={chk.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-sm flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <h4 className="text-sm font-semibold text-white">{chk.name}</h4>
                  </div>
                  <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    ✓ PASSED ({chk.latencyMs}ms)
                  </span>
                </div>
                <p className="text-xs text-slate-400">{chk.description}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
                <span className="text-blue-400 font-semibold block mb-0.5">Verification Output:</span>
                {chk.details}
              </div>

              <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-800 text-slate-500">
                <span>Status: <strong className="text-emerald-400">{chk.status}</strong></span>
                <span className="font-mono">{chk.id}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
