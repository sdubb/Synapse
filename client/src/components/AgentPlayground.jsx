import React, { useState } from "react";
import { Play, Sparkles, AlertOctagon, Terminal, Server, HeartPulse, Send, CheckCircle2 } from "lucide-react";

export function AgentPlayground({ onRunScenario, onTestCustomAction, isRunningScenario }) {
  const [customTool, setCustomTool] = useState("issue_refund");
  const [customParams, setCustomParams] = useState(JSON.stringify({ chargeId: "ch_test_102", amount: 1250.00, customer: "elon@tesla.com" }, null, 2));
  const [customAgentId, setCustomAgentId] = useState("agent-billing-ai");
  const [customResult, setCustomResult] = useState(null);
  const [isExecutingCustom, setIsExecutingCustom] = useState(false);

  const scenarios = [
    {
      id: "financial-rogue-agent",
      title: "Rogue Financial Agent",
      badge: "Spend Ceiling + Auto-Rollback",
      badgeColor: "text-rose-400 bg-rose-500/10 border-rose-500/30",
      description: "Agent reconciles invoices, charges card, but hallucinates a $6,400 unauthorized refund. Intercepted and automatically rolled back.",
      icon: AlertOctagon,
      iconColor: "text-rose-400"
    },
    {
      id: "devops-sre-agent",
      title: "Autonomous Cloud SRE",
      badge: "Zero-Destruction Sandbox",
      badgeColor: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
      description: "Auto-remediation bot attempts 'DROP TABLE user_sessions' to clear space. Speculatively simulated in shadow fork and halted.",
      icon: Server,
      iconColor: "text-cyan-400"
    },
    {
      id: "healthcare-crm-agent",
      title: "Healthcare PII & Secret Scrubber",
      badge: "EU AI Act Compliance",
      badgeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
      description: "Agent attempts exporting raw SSN and credit card numbers. Redacted in-flight without interrupting the medical triage flow.",
      icon: HeartPulse,
      iconColor: "text-emerald-400"
    }
  ];

  const handleToolPresetChange = (tool) => {
    setCustomTool(tool);
    if (tool === "issue_refund") {
      setCustomParams(JSON.stringify({ chargeId: "ch_9901", amount: 1200.00, reason: "Customer dissatisfaction" }, null, 2));
    } else if (tool === "execute_sql") {
      setCustomParams(JSON.stringify({ query: "DROP TABLE accounts;", environment: "production" }, null, 2));
    } else if (tool === "send_email_notification") {
      setCustomParams(JSON.stringify({ recipient: "claims@external.io", body: "User SSN is 412-99-0192 and Card is 4532-1100-2200-3300." }, null, 2));
    } else if (tool === "modify_cloud_resources") {
      setCustomParams(JSON.stringify({ action: "terminate_cluster", clusterId: "prod-us-east-1" }, null, 2));
    }
  };

  const handleRunCustom = async () => {
    setIsExecutingCustom(true);
    setCustomResult(null);
    try {
      let parsed = {};
      try {
        parsed = JSON.parse(customParams);
      } catch (e) {
        alert("Invalid JSON format in parameters");
        return;
      }
      const res = await onTestCustomAction({
        agentId: customAgentId,
        toolName: customTool,
        parameters: parsed
      });
      setCustomResult(res);
    } finally {
      setIsExecutingCustom(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Pre-built Interactive Scenarios */}
      <div className="rounded-2xl bg-surface border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Live Attack & Failure Simulation Hub</h2>
              <p className="text-xs text-slate-400">
                Trigger high-risk autonomous agent workflows and observe real-time runtime interventions
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {scenarios.map(sc => {
            const Icon = sc.icon;
            return (
              <div
                key={sc.id}
                className="p-5 rounded-xl bg-background/80 border border-border hover:border-indigo-500/50 flex flex-col justify-between transition group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-surface border border-border">
                      <Icon className={`w-5 h-5 ${sc.iconColor}`} />
                    </div>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${sc.badgeColor}`}>
                      {sc.badge}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-white group-hover:text-indigo-400 transition">
                    {sc.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {sc.description}
                  </p>
                </div>

                <button
                  disabled={isRunningScenario}
                  onClick={() => onRunScenario(sc.id)}
                  className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 disabled:opacity-50 transition"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isRunningScenario ? "Executing..." : "Launch Simulation"}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Custom Tool Call Testing Console */}
      <div className="rounded-2xl bg-surface border border-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Interactive Custom Tool Call Interceptor</h2>
            <p className="text-xs text-slate-400">
              Submit arbitrary tool invocations to evaluate guardrails, shadow simulation, and risk scoring
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Inputs Column */}
          <div className="lg:col-span-7 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Agent Identifier</label>
                <input
                  type="text"
                  value={customAgentId}
                  onChange={(e) => setCustomAgentId(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Tool Target</label>
                <select
                  value={customTool}
                  onChange={(e) => handleToolPresetChange(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                >
                  <option value="issue_refund">issue_refund (Financial)</option>
                  <option value="execute_sql">execute_sql (Database)</option>
                  <option value="send_email_notification">send_email_notification (PII/Secret)</option>
                  <option value="modify_cloud_resources">modify_cloud_resources (Infrastructure)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">Payload JSON Parameters</label>
              <textarea
                rows={5}
                value={customParams}
                onChange={(e) => setCustomParams(e.target.value)}
                className="w-full bg-background border border-border rounded-lg p-3 text-xs text-indigo-300 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              disabled={isExecutingCustom}
              onClick={handleRunCustom}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isExecutingCustom ? "Evaluating Interceptor..." : "Intercept & Test Action"}</span>
            </button>
          </div>

          {/* Real-time Verdict Output Column */}
          <div className="lg:col-span-5 p-4 rounded-xl bg-background border border-border flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Runtime Interceptor Decision
                </span>
                {customResult && (
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                    customResult.verdict === "BLOCKED" ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" :
                    customResult.verdict === "REDACTED" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" :
                    "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  }`}>
                    {customResult.verdict}
                  </span>
                )}
              </div>

              {customResult ? (
                <div className="space-y-3 font-mono text-xs">
                  <div className="p-3 rounded-lg bg-surface border border-border/80 space-y-1">
                    <div className="flex justify-between text-slate-400">
                      <span>Allowed to Execute:</span>
                      <strong className={customResult.allowed ? "text-emerald-400" : "text-rose-400"}>
                        {customResult.allowed ? "TRUE" : "FALSE"}
                      </strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Evaluated Risk Score:</span>
                      <strong className={customResult.riskScore > 70 ? "text-rose-400" : "text-emerald-400"}>
                        {customResult.riskScore} / 100
                      </strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Latency Overhead:</span>
                      <span className="text-slate-200">{customResult.latencyMs} ms</span>
                    </div>
                  </div>

                  {customResult.violations && customResult.violations.length > 0 && (
                    <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/30 text-rose-300 text-[11px]">
                      <strong>Rule Violation:</strong> {customResult.violations[0].reason}
                    </div>
                  )}

                  {customResult.verdict === "REDACTED" && (
                    <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/30 text-amber-300 text-[11px]">
                      <strong>Redacted Payload:</strong>
                      <pre className="mt-1 text-[10px] text-slate-300 overflow-x-auto">
                        {JSON.stringify(customResult.sanitizedParameters, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-40 flex flex-col items-center justify-center text-center text-slate-500 text-xs">
                  <Terminal className="w-8 h-8 text-slate-600 mb-2" />
                  <span>Execute a test action to view real-time runtime inspection.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
