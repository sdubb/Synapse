import React, { useState } from "react";
import { Sliders, CheckCircle2, Shield, DollarSign, Terminal, Zap, Lock } from "lucide-react";

export function PolicyManager({ policies, onUpdatePolicy }) {
  const [updatingId, setUpdatingId] = useState(null);

  const handleToggle = async (policy) => {
    setUpdatingId(policy.id);
    try {
      await onUpdatePolicy(policy.id, { enabled: !policy.enabled });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleThresholdChange = async (policy, newThreshold) => {
    setUpdatingId(policy.id);
    try {
      await onUpdatePolicy(policy.id, { threshold: Number(newThreshold) });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="rounded-2xl bg-surface border border-border overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-[#0D0F1A] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">
              Deterministic Policy Engine & Guardrail Rules
            </h2>
            <p className="text-xs text-slate-400">
              Configure microsecond-latency invariants, spending ceilings, and zero-destruction boundaries
            </p>
          </div>
        </div>

        <span className="text-xs font-mono text-indigo-400 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
          {policies.filter(p => p.enabled).length} Active Guardrails
        </span>
      </div>

      {/* Policies Grid */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {policies.map(policy => {
          const isUpdating = updatingId === policy.id;

          return (
            <div
              key={policy.id}
              className={`p-5 rounded-xl border transition-all ${
                policy.enabled
                  ? "bg-background/90 border-border hover:border-indigo-500/40"
                  : "bg-surface/40 border-border/40 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white">{policy.name}</h3>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-surface border border-border text-slate-300">
                      {policy.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {policy.description}
                  </p>
                </div>

                {/* Toggle Switch */}
                <button
                  disabled={isUpdating}
                  onClick={() => handleToggle(policy)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                    policy.enabled ? "bg-indigo-600 justify-end" : "bg-slate-800 justify-start"
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform" />
                </button>
              </div>

              {/* Policy Specific Controls */}
              {policy.id === "pol-spend-limit" && (
                <div className="mt-4 pt-3 border-t border-border/80 flex items-center justify-between">
                  <label className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Max Autonomous Spend:
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-white">$</span>
                    <input
                      type="number"
                      value={policy.threshold}
                      onChange={(e) => handleThresholdChange(policy, e.target.value)}
                      className="w-24 bg-surface border border-border rounded-lg px-2 py-1 text-xs text-white font-mono text-right focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              {/* Target Tools Tags */}
              <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-slate-500 font-mono">Scope:</span>
                {policy.targetTools.map((t, idx) => (
                  <span key={idx} className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface border border-border/60 text-indigo-300">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
