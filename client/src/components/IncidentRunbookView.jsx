import React, { useState, useEffect } from "react";
import { AlertOctagon, CheckCircle2, ShieldAlert, RotateCcw, Power, Clock, RefreshCw, Terminal, ArrowRight, Check } from "lucide-react";

export function IncidentRunbookView() {
  const [incidents, setIncidents] = useState([]);
  const [isResolving, setIsResolving] = useState(null);

  const fetchIncidents = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/v1/incidents");
      const data = await res.json();
      if (data.incidents) setIncidents(data.incidents);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleResolve = async (incidentId, action) => {
    setIsResolving(incidentId);
    try {
      await fetch(`http://localhost:4000/api/v1/incidents/${incidentId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes: "On-call security lead verified state and audited logs.", resolvedBy: "secops-lead@enterprise.com" })
      });
      fetchIncidents();
    } finally {
      setIsResolving(null);
    }
  };

  const activeCount = incidents.filter(i => i.status.includes("TRIGGERED")).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white">
              Post-Kill-Switch Operational Runbook & Incident Response
            </h2>
            {activeCount > 0 && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
                {activeCount} Active Incidents
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Automated operational protocol executed when an agent is frozen: Container SIGSTOP, Ephemeral Token Revocation, Rollback DAG compensation, and PagerDuty alert.
          </p>
        </div>

        <button
          onClick={fetchIncidents}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium transition flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Incidents</span>
        </button>
      </div>

      {/* Incidents List */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden text-xs">
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-rose-400" /> Automated Incident Runbooks & Triage
          </h3>
          <span className="text-slate-400">{incidents.length} Incidents Tracked</span>
        </div>

        <div className="divide-y divide-slate-800 max-h-[520px] overflow-y-auto">
          {incidents.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No active incidents. Trigger an emergency kill switch in the Workforce Directory to observe automated runbook execution.
            </div>
          ) : (
            incidents.map((inc) => {
              const isTriggered = inc.status.includes("TRIGGERED");

              return (
                <div
                  key={inc.incidentId}
                  className={`p-5 transition space-y-3 ${
                    isTriggered ? "bg-rose-950/20 border-l-4 border-rose-500" : "bg-slate-900/60"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-rose-400 font-mono font-semibold">{inc.incidentId}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-white font-semibold">{inc.agentName}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30">
                        {inc.severity}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        isTriggered ? "bg-rose-500/15 text-rose-400 border border-rose-500/30" : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      }`}>
                        {inc.status}
                      </span>
                    </div>

                    <span className="text-slate-500">
                      Triggered: {new Date(inc.createdAt).toLocaleTimeString()}
                    </span>
                  </div>

                  <p className="text-slate-300 text-xs">
                    <strong className="text-slate-400 font-medium">Trigger Reason:</strong> {inc.reason}
                  </p>

                  {/* 4-Step Runbook Execution */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                    <span className="text-slate-400 font-semibold uppercase tracking-wider block text-[10px]">
                      Automated Runbook Execution Chain:
                    </span>
                    <div className="text-emerald-400 flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>{inc.runbookExecution?.step1_process_quarantine || "Process Quarantined"}</span>
                    </div>
                    <div className="text-emerald-400 flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>{inc.runbookExecution?.step2_dag_compensation || "Inverse Compensation Armed"}</span>
                    </div>
                    <div className="text-emerald-400 flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>{inc.runbookExecution?.step3_pagerduty_paged || "PagerDuty On-Call Paged"}</span>
                    </div>
                    <div className="text-emerald-400 flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>{inc.runbookExecution?.step4_servicenow_sync || "ServiceNow ITIL Incident Created"}</span>
                    </div>
                  </div>

                  {/* Triage Actions */}
                  {isTriggered && (
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-slate-400">
                        Process in quarantine. Ready for SecOps triage.
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          disabled={isResolving === inc.incidentId}
                          onClick={() => handleResolve(inc.incidentId, "SAFE_RESUME")}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Safe Resume Container</span>
                        </button>

                        <button
                          disabled={isResolving === inc.incidentId}
                          onClick={() => handleResolve(inc.incidentId, "PERMANENT_TERMINATE")}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-rose-300 border border-rose-500/30 font-semibold text-xs transition"
                        >
                          <Power className="w-3.5 h-3.5" />
                          <span>Permanent Terminate</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {!isTriggered && inc.resolution && (
                    <div className="text-slate-400">
                      Resolved: <strong className="text-slate-200">{inc.resolution.action}</strong> by {inc.resolution.resolvedBy} at {new Date(inc.resolution.resolvedAt).toLocaleTimeString()} ({inc.resolution.notes})
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
