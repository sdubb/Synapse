import React, { useState } from "react";
import { ShieldAlert, ShieldCheck, Zap, AlertTriangle, Terminal, ChevronDown, ChevronUp, Lock } from "lucide-react";

export function LiveThreatStream({ streamEvents }) {
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="rounded-2xl bg-surface border border-border overflow-hidden">
      {/* Stream Header */}
      <div className="px-6 py-4 border-b border-border bg-[#0D0F1A] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              Live Threat Interceptor & Telemetry Feed
            </h2>
            <p className="text-xs text-slate-400">
              Real-time deterministic evaluation of all autonomous tool requests before production dispatch
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Intercepting Live</span>
        </div>
      </div>

      {/* Stream List */}
      <div className="divide-y divide-border/60 max-h-[520px] overflow-y-auto">
        {streamEvents.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No events intercepted yet. Run a scenario or test a custom payload below.
          </div>
        ) : (
          streamEvents.map((evt, idx) => {
            const isBlocked = evt.verdict === "BLOCKED";
            const isRedacted = evt.verdict === "REDACTED";
            const isAllowed = evt.verdict === "ALLOWED";
            const isExpanded = expandedId === (evt.actionId || idx);

            return (
              <div
                key={evt.actionId || idx}
                className={`p-4 transition-colors ${
                  isBlocked ? "bg-rose-950/10 hover:bg-rose-950/20" :
                  isRedacted ? "bg-amber-950/10 hover:bg-amber-950/20" :
                  "hover:bg-surface-hover/60"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    {/* Status Icon */}
                    <div className={`p-1.5 rounded-lg border ${
                      isBlocked ? "bg-rose-500/20 text-rose-400 border-rose-500/40" :
                      isRedacted ? "bg-amber-500/20 text-amber-400 border-amber-500/40" :
                      "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                    }`}>
                      {isBlocked ? <ShieldAlert className="w-4 h-4" /> :
                       isRedacted ? <Zap className="w-4 h-4" /> :
                       <ShieldCheck className="w-4 h-4" />}
                    </div>

                    {/* Action signature */}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-semibold text-white">
                          {evt.toolName}()
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          [{evt.agentId || "agent"}]
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                          isBlocked ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" :
                          isRedacted ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" :
                          "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        }`}>
                          {evt.verdict}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                        {evt.violations && evt.violations.length > 0
                          ? evt.violations[0].reason
                          : "Deterministic checks & shadow simulation cleared without violation."}
                      </p>
                    </div>
                  </div>

                  {/* Telemetry metadata */}
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-slate-400">
                        <span>Risk:</span>
                        <strong className={
                          evt.riskScore > 70 ? "text-rose-400" :
                          evt.riskScore > 30 ? "text-amber-400" :
                          "text-emerald-400"
                        }>
                          {evt.riskScore}/100
                        </strong>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {evt.latencyMs || 6.2}ms runtime
                      </div>
                    </div>

                    <button
                      onClick={() => toggleExpand(evt.actionId || idx)}
                      className="p-1.5 rounded-lg bg-surface border border-border text-slate-400 hover:text-white"
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Payload & Violation Details */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-border/80 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                    <div className="p-3 rounded-lg bg-background border border-border">
                      <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                        Sanitized Parameters Payload
                      </div>
                      <pre className="text-[11px] text-indigo-300 overflow-x-auto">
                        {JSON.stringify(evt.sanitizedParameters || evt.parameters || {}, null, 2)}
                      </pre>
                    </div>

                    <div className="p-3 rounded-lg bg-background border border-border">
                      <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                        Cryptographic Audit Signature
                      </div>
                      <div className="text-[10px] text-slate-500 truncate font-mono">
                        Hash: {evt.auditHash || "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"}
                      </div>
                      {evt.shadowResult && (
                        <div className="mt-2 text-[11px] text-slate-300">
                          <span className="text-cyan-400 font-semibold">Shadow Sandbox: </span>
                          {evt.shadowResult.simulationPassed ? "PASSED (0 Invariant Violations)" : "FLAGGED CATASTROPHIC RISK"}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
