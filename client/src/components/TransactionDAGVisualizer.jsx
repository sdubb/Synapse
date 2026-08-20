import React, { useState } from "react";
import { Undo2, GitCommit, ArrowRight, CheckCircle2, AlertTriangle, XCircle, RotateCcw, Box, Clock, Layers } from "lucide-react";

export function TransactionDAGVisualizer({ transactions, onRollbackTransaction }) {
  const [selectedTxId, setSelectedTxId] = useState(null);
  const [isRollingBack, setIsRollingBack] = useState(false);

  const activeTx = transactions.find(t => t.id === selectedTxId) || transactions[0];

  const handleRollback = async (txId) => {
    setIsRollingBack(true);
    try {
      await onRollbackTransaction(txId);
    } finally {
      setIsRollingBack(false);
    }
  };

  if (!transactions || transactions.length === 0) {
    return (
      <div className="p-8 rounded-2xl bg-surface border border-border text-center">
        <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-300">No Transaction Sessions Yet</h3>
        <p className="text-xs text-slate-500 mt-1">Run an agent simulation from the Playground to observe state checkpointing and time-travel rollback.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-surface border border-border overflow-hidden">
      {/* Visualizer Header */}
      <div className="px-6 py-4 border-b border-border bg-[#0D0F1A] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Undo2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              Time-Travel State Checkpoints & Universal Rollback Engine
            </h2>
            <p className="text-xs text-slate-400">
              Deterministic inverse graph (DAG) enabling automated compensation & zero-damage recovery
            </p>
          </div>
        </div>

        {/* Transaction Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400">Session:</label>
          <select
            value={activeTx?.id || ""}
            onChange={(e) => setSelectedTxId(e.target.value)}
            className="bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
          >
            {transactions.map(t => (
              <option key={t.id} value={t.id}>
                {t.id} — {t.workflowName.substring(0, 30)} ({t.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {activeTx && (
        <div className="p-6 space-y-6">
          {/* Active Transaction Metadata & Actions */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-xl bg-background/60 border border-border/80">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold text-indigo-400">{activeTx.id}</span>
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs text-slate-300 font-medium">{activeTx.workflowName}</span>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                  activeTx.status === "COMMITTED" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" :
                  activeTx.status === "ROLLED_BACK" ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/30" :
                  activeTx.status === "ROLLING_BACK" ? "bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse" :
                  "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                }`}>
                  {activeTx.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono flex items-center gap-2">
                <Clock className="w-3 h-3" /> Agent: <span className="text-slate-300">{activeTx.agentId}</span> | Steps: {activeTx.steps.length}
              </p>
            </div>

            {/* 1-Click Rollback CTA */}
            {activeTx.status !== "ROLLED_BACK" && (
              <button
                disabled={isRollingBack || activeTx.steps.length === 0}
                onClick={() => handleRollback(activeTx.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isRollingBack ? "animate-spin" : ""}`} />
                <span>{isRollingBack ? "Executing Inverse DAG..." : "Trigger 1-Click Universal Rollback"}</span>
              </button>
            )}
          </div>

          {/* Rollback Details Banner (if rolled back) */}
          {activeTx.status === "ROLLED_BACK" && activeTx.rollbackLog && (
            <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 flex items-start gap-3">
              <Undo2 className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-indigo-300">
                  Transaction Auto-Compensated & Rolled Back
                </h4>
                <p className="text-xs text-slate-300">
                  <strong className="text-slate-100">Reason:</strong> {activeTx.rollbackLog.reason}
                </p>
                <p className="text-[11px] text-indigo-400/80 font-mono">
                  {activeTx.rollbackLog.totalStepsReverted} state mutation(s) inverted and restored cleanly.
                </p>
              </div>
            </div>
          )}

          {/* DAG Step-by-Step Flow */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Execution Sequence & Inverse Compensation Mapping (LIFO Graph)
            </h3>

            <div className="space-y-3">
              {activeTx.steps.map((step, idx) => {
                const isReverted = step.status === "REVERTED";
                const isCompleted = step.status === "COMPLETED";

                return (
                  <div
                    key={step.stepId || idx}
                    className={`p-4 rounded-xl border transition-all ${
                      isReverted
                        ? "bg-[#141226] border-indigo-500/40"
                        : isCompleted
                        ? "bg-background/80 border-border"
                        : "bg-rose-950/20 border-rose-500/40"
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      {/* Left: Forward Action */}
                      <div className="flex items-start gap-3">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold ${
                          isReverted ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/40" :
                          "bg-surface text-slate-300 border border-border"
                        }`}>
                          {step.stepIndex}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-semibold text-white">
                              {step.toolName}()
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                              isReverted ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" :
                              "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            }`}>
                              {step.status}
                            </span>
                          </div>
                          <pre className="text-[11px] text-slate-400 font-mono mt-1 overflow-x-auto max-w-md">
                            {JSON.stringify(step.parameters, null, 2)}
                          </pre>
                        </div>
                      </div>

                      {/* Center Arrow */}
                      <div className="hidden lg:flex items-center gap-1 text-slate-600">
                        <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Compensating Inverse</span>
                        <ArrowRight className="w-4 h-4 text-indigo-400" />
                      </div>

                      {/* Right: Registered Inverse Compensation Action */}
                      <div className="p-3 rounded-lg bg-surface/90 border border-border/80 min-w-[280px]">
                        <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                          <span className="text-indigo-400 font-semibold flex items-center gap-1">
                            <RotateCcw className="w-3 h-3" />
                            {step.inverseOperation?.inverseTool || "no_op"}()
                          </span>
                          <span className={isReverted ? "text-emerald-400" : "text-slate-500"}>
                            {isReverted ? "✓ REVERTED" : "ARMED"}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono truncate">
                          {JSON.stringify(step.inverseOperation?.inverseParams || {})}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
