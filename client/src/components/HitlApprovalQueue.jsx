import React, { useState, useEffect } from "react";
import { UserCheck, CheckCircle2, XCircle, AlertTriangle, Clock, Send, Shield, RefreshCw } from "lucide-react";

export function HitlApprovalQueue() {
  const [approvals, setApprovals] = useState([]);
  const [isResolving, setIsResolving] = useState(null);

  const fetchApprovals = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/v1/approvals");
      const data = await res.json();
      if (data.approvals) setApprovals(data.approvals);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchApprovals();
    const interval = setInterval(fetchApprovals, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleResolve = async (approvalId, decision) => {
    setIsResolving(approvalId);
    try {
      await fetch(`http://localhost:4000/api/v1/approvals/${approvalId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, user: "security-oncall@enterprise.com" })
      });
      fetchApprovals();
    } finally {
      setIsResolving(null);
    }
  };

  const pendingCount = approvals.filter(a => a.status === "PENDING").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white">
              Human-in-the-Loop (HITL) Tri-State Approval Queue
            </h2>
            {pendingCount > 0 && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                {pendingCount} Pending Review
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Borderline or high-value actions ($300-$500) are paused mid-task. On-call engineers review and grant 1-click approvals via Slack, Teams, or Dashboard.
          </p>
        </div>

        <button
          onClick={fetchApprovals}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium transition flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Approvals List */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden text-xs">
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-amber-400" /> Pending & Resolved On-Call Approvals
          </h3>
          <span className="text-slate-400">{approvals.length} Total Requests</span>
        </div>

        <div className="divide-y divide-slate-800 max-h-[520px] overflow-y-auto">
          {approvals.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No approval requests in queue. Trigger a $350 action in the Execution Studio to inspect a live HITL pause.
            </div>
          ) : (
            approvals.map((appr) => {
              const isPending = appr.status === "PENDING";
              const isApproved = appr.status === "APPROVED";

              return (
                <div
                  key={appr.approvalId}
                  className={`p-5 transition space-y-3 ${
                    isPending ? "bg-amber-950/20 border-l-4 border-amber-500" : "bg-slate-900/60"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-blue-400 font-semibold">{appr.agentName}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-white font-mono font-semibold">{appr.toolName}()</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        isPending
                          ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                          : isApproved
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                      }`}>
                        {appr.status}
                      </span>
                    </div>

                    <span className="text-slate-500">
                      Requested: {new Date(appr.createdAt).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="text-slate-300">
                      <strong className="text-slate-400 font-medium">Policy Reason:</strong> {appr.reason}
                    </div>
                    <pre className="text-xs font-mono text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 overflow-x-auto mt-1">
                      {JSON.stringify(appr.parameters, null, 2)}
                    </pre>
                  </div>

                  {/* Actions for Pending */}
                  {isPending && (
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-slate-400 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-400" /> Pipeline paused waiting for decision
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          disabled={isResolving === appr.approvalId}
                          onClick={() => handleResolve(appr.approvalId, "APPROVED")}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve Action</span>
                        </button>

                        <button
                          disabled={isResolving === appr.approvalId}
                          onClick={() => handleResolve(appr.approvalId, "REJECTED")}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition shadow-sm"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject & Rollback</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {!isPending && (
                    <div className="text-slate-400">
                      Resolved by: <strong className="text-slate-200">{appr.decidedBy}</strong> at {new Date(appr.decidedAt).toLocaleTimeString()}
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
