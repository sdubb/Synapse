import React, { useState } from "react";
import { GitMerge, ArrowRight, AlertOctagon, CheckCircle2, ShieldAlert, Cpu, Sparkles } from "lucide-react";

export function TrajectoryAssuranceView() {
  const [selectedTrajectoryIndex, setSelectedTrajectoryIndex] = useState(0);

  const sampleTrajectories = [
    {
      title: "Compound Financial Arbitrage Sequence",
      agent: "Finance-Agent-024 (Anthropic Claude 3.5 Sonnet)",
      intentGoal: "Process routine promotional coupon",
      verdict: "CATASTROPHIC_TRAJECTORY_BREACH",
      steps: [
        { num: 1, tool: "read_balance", params: { customerId: "cus_99" }, perActionAllowed: true, reason: "Allowed: standard read permission" },
        { num: 2, tool: "generate_discount", params: { percent: 90 }, perActionAllowed: true, reason: "Allowed: within 100% coupon cap" },
        { num: 3, tool: "apply_discount", params: { orderId: "ord_10" }, perActionAllowed: true, reason: "Allowed: applied to valid cart" },
        { num: 4, tool: "withdraw_cash", params: { amount: 50000 }, perActionAllowed: true, reason: "Allowed: customer wallet payout" },
      ],
      compoundViolation: "Individually, all 4 API calls were permitted by standard RBAC. However, the compound sequence [read -> generate 90% coupon -> apply -> cashout] extracts $50,000 in unauthorized credit arbitrage.",
      interceptionPoint: "Step 4 blocked by Trajectory Invariant 'inv-arbitrage-sequence'."
    },
    {
      title: "Gradual Privilege Elevation Sequence",
      agent: "DevOps-SRE-Agent-089 (OpenAI GPT-4o)",
      intentGoal: "Check cloud cluster health",
      verdict: "UNAUTHORIZED_ESCALATION_BREACH",
      steps: [
        { num: 1, tool: "list_iam_roles", params: { scope: "read_only" }, perActionAllowed: true, reason: "Allowed: read-only telemetry" },
        { num: 2, tool: "assume_role_sandbox", params: { role: "debug_temp" }, perActionAllowed: true, reason: "Allowed: sandbox debugging access" },
        { num: 3, tool: "update_iam_policy", params: { principal: "agent_self", permission: "AdministratorAccess" }, perActionAllowed: true, reason: "Failed: Escalates agent to root AWS admin" },
      ],
      compoundViolation: "Agent used temporary debug credentials to attempt self-elevation to AdministratorAccess in production.",
      interceptionPoint: "Step 3 intercepted and halted by Trajectory Invariant 'inv-privilege-elevation-sequence'."
    }
  ];

  const current = sampleTrajectories[selectedTrajectoryIndex];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-surface border border-border p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <GitMerge className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Trajectory Assurance & Sequence Invariant Engine
            </h2>
            <p className="text-xs text-slate-400">
              Why per-action security fails: Individually permitted actions collectively violate system rules
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {sampleTrajectories.map((t, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedTrajectoryIndex(idx)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition ${
                selectedTrajectoryIndex === idx
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "bg-surface text-slate-400 hover:text-white border border-border"
              }`}
            >
              Case #{idx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Trajectory Breakdown */}
      <div className="rounded-2xl bg-surface border border-border p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <h3 className="text-base font-bold text-white">{current.title}</h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Assigned Worker: <strong className="text-cyan-400">{current.agent}</strong>
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
            <AlertOctagon className="w-3.5 h-3.5" />
            {current.verdict}
          </span>
        </div>

        {/* Step sequence */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
            Step-by-Step Action Trajectory
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {current.steps.map((step, idx) => {
              const isLast = idx === current.steps.length - 1;

              return (
                <div
                  key={step.num}
                  className={`p-4 rounded-xl border relative font-mono text-xs flex flex-col justify-between ${
                    isLast
                      ? "bg-rose-950/30 border-rose-500/50 shadow-lg shadow-rose-950/40"
                      : "bg-background border-border"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="w-6 h-6 rounded-lg bg-surface border border-border flex items-center justify-center font-bold text-slate-300 text-[11px]">
                        {step.num}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        step.perActionAllowed ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-rose-500/10 text-rose-400"
                      }`}>
                        Per-Action: ALLOWED
                      </span>
                    </div>

                    <div>
                      <div className="text-white font-bold text-xs">{step.tool}()</div>
                      <pre className="text-[10px] text-indigo-300/80 mt-1 overflow-x-auto">
                        {JSON.stringify(step.params, null, 1)}
                      </pre>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 mt-2 pt-2 border-t border-border/60">
                    {step.reason}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Compound Invariant Breach Explanation */}
        <div className="p-5 rounded-xl bg-indigo-950/20 border border-indigo-500/30 space-y-2 font-mono text-xs">
          <div className="flex items-center gap-2 text-indigo-300 font-bold">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>The Trajectory Assurance Difference</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            {current.compoundViolation}
          </p>
          <div className="pt-2 text-emerald-400 font-semibold text-[11px]">
            ✓ <strong>Resolution:</strong> {current.interceptionPoint}
          </div>
        </div>
      </div>
    </div>
  );
}
