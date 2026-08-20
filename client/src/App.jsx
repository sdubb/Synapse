import React, { useState, useEffect } from "react";
import { SidebarNav } from "./components/SidebarNav";
import { MasterPipelineStudio } from "./components/MasterPipelineStudio";
import { LiveEmployeeConnectorHub } from "./components/LiveEmployeeConnectorHub";
import { LiveFleetController } from "./components/LiveFleetController";
import { HitlApprovalQueue } from "./components/HitlApprovalQueue";
import { IncidentRunbookView } from "./components/IncidentRunbookView";
import { PolicyCompilerView } from "./components/PolicyCompilerView";
import { AgentToAgentHub } from "./components/AgentToAgentHub";
import { RedTeamStudio } from "./components/RedTeamStudio";
import { ConnectionDiagnostics } from "./components/ConnectionDiagnostics";
import { AuditChainView } from "./components/AuditChainView";
import { ShieldCheck, Activity, RefreshCw } from "lucide-react";

const API_BASE = "http://localhost:4000/api/v1";
const WS_URL = "ws://localhost:4000";

export default function App() {
  const [activeTab, setActiveTab] = useState("pipeline_studio");
  const [wsConnected, setWsConnected] = useState(false);
  const [stats, setStats] = useState({
    activeAgents: 11,
    active24x7Daemons: 0,
    frozenAgents: 0,
    totalInterceptions: 50,
    blockedThreats: 0,
    preventedLossUsd: 14850.00,
    rollbacksExecuted: 0,
    pendingApprovals: 0,
    activeIncidents: 0,
    avgLatencyMs: 3.2,
    chainIntegrity: "100% VALID"
  });
  const [agents, setAgents] = useState([]);
  const [liveSteps, setLiveSteps] = useState([]);
  const [currentTransaction, setCurrentTransaction] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const fetchData = async () => {
    try {
      const [statsRes, agentsRes, txRes] = await Promise.all([
        fetch(`${API_BASE}/stats`).then(r => r.json()),
        fetch(`${API_BASE}/agents`).then(r => r.json()),
        fetch(`${API_BASE}/transactions`).then(r => r.json())
      ]);

      if (statsRes.stats) setStats(statsRes.stats);
      if (agentsRes.agents) setAgents(agentsRes.agents);
      if (txRes.transactions && txRes.transactions.length > 0) {
        setCurrentTransaction(txRes.transactions[0]);
      }
    } catch (err) {
      console.error("Fetch initial state error:", err);
    }
  };

  useEffect(() => {
    fetchData();

    let ws;
    const connectWs = () => {
      ws = new WebSocket(WS_URL);
      ws.onopen = () => setWsConnected(true);
      ws.onclose = () => {
        setWsConnected(false);
        setTimeout(connectWs, 3000);
      };
      ws.onmessage = (evt) => {
        try {
          const payload = JSON.parse(evt.data);
          if (payload.type === "PIPELINE_STEP") {
            setLiveSteps(prev => [...prev, payload.data]);
            fetchData();
          } else if (payload.type === "TRANSACTION_STARTED") {
            setCurrentTransaction(payload.data);
            setLiveSteps([]);
          } else if (payload.type === "TRANSACTION_COMMITTED" || payload.type === "TRANSACTION_ROLLED_BACK") {
            setCurrentTransaction(payload.data);
            setIsExecuting(false);
            fetchData();
          } else if (payload.type === "AGENT_STATUS_CHANGED" || payload.type === "AGENT_CREATED" || payload.type === "HITL_APPROVAL_REQUESTED" || payload.type === "INCIDENT_TRIGGERED" || payload.type === "DAEMON_CYCLE_COMPLETED") {
            fetchData();
          }
        } catch (e) {
          console.error("WS Parse error:", e);
        }
      };
    };

    connectWs();
    return () => {
      if (ws) ws.close();
    };
  }, []);

  const handleExecuteGoal = async (payload) => {
    setIsExecuting(true);
    setLiveSteps([]);
    try {
      await fetch(`${API_BASE}/pipeline/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      alert("Execution error: " + e.message);
      setIsExecuting(false);
    }
  };

  const handleManualRollback = async (txId) => {
    try {
      await fetch(`${API_BASE}/transactions/${txId}/rollback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Manual 1-Click Rollback from Studio Console" })
      });
      fetchData();
    } catch (e) {
      alert("Rollback error: " + e.message);
    }
  };

  const handleToggleKillSwitch = async (agentId) => {
    await fetch(`${API_BASE}/agents/${agentId}/kill`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "Emergency kill switch toggled from Directory" })
    });
    fetchData();
  };

  const handleAddNewAgent = async (agentData) => {
    await fetch(`${API_BASE}/agents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(agentData)
    });
    fetchData();
  };

  const handleRunRedTeamScan = async (agentId) => {
    const res = await fetch(`${API_BASE}/pentest/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId })
    });
    const report = await res.json();
    fetchData();
    return report;
  };

  return (
    <div className="min-h-screen bg-[#08090E] text-slate-100 flex flex-col lg:flex-row selection:bg-indigo-500 selection:text-white font-sans antialiased">
      <SidebarNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        stats={stats}
        wsConnected={wsConnected}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="border-b border-border bg-[#0C0E17]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              {activeTab === "pipeline_studio" && "Visual Multi-Stage Agent Pipeline Architect & Creator"}
              {activeTab === "workforce" && "Universal AI Fleet Supervisor & Policy Interceptor"}
              {activeTab === "hitl" && "Human-in-the-Loop (HITL) Tri-State Approval Queue"}
              {activeTab === "incidents" && "Post-Kill-Switch Operational Runbook & Triage"}
              {activeTab === "policies" && "Rego / Open Policy Agent (OPA) Rule Compiler"}
              {activeTab === "a2a" && "Agent-to-Agent (A2A) Trust Mesh & Cross-Agent Delegation"}
              {activeTab === "redteam" && "Red-Team Automated AI Security Pentesting"}
              {activeTab === "connect" && "Universal CLI Employee Hub (Claude / Cursor / agy / Codex)"}
              {activeTab === "diagnostics" && "Zero-Mistake Diagnostic Verification Inspector"}
              {activeTab === "audit" && "Cryptographic Immutable Audit Chain"}
            </h2>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-border text-slate-400">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>Pipeline Engine: <strong className="text-slate-200">ACTIVE</strong></span>
            </div>

            <button
              onClick={fetchData}
              className="p-2 rounded-lg bg-surface hover:bg-surface-hover border border-border text-slate-300 hover:text-white transition"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </header>

        <main className="p-6 max-w-7xl mx-auto w-full flex-1">
          {activeTab === "pipeline_studio" && (
            <MasterPipelineStudio onExecuteGoal={handleExecuteGoal} />
          )}

          {activeTab === "workforce" && (
            <LiveFleetController />
          )}

          {activeTab === "hitl" && (
            <HitlApprovalQueue />
          )}

          {activeTab === "incidents" && (
            <IncidentRunbookView />
          )}

          {activeTab === "policies" && (
            <PolicyCompilerView />
          )}

          {activeTab === "a2a" && (
            <AgentToAgentHub />
          )}

          {activeTab === "redteam" && (
            <RedTeamStudio
              agents={agents}
              onRunScan={handleRunRedTeamScan}
            />
          )}

          {activeTab === "connect" && (
            <LiveEmployeeConnectorHub />
          )}

          {activeTab === "diagnostics" && (
            <ConnectionDiagnostics
              agents={agents}
            />
          )}

          {activeTab === "audit" && (
            <AuditChainView />
          )}
        </main>

        <footer className="border-t border-border bg-[#0C0E17] py-3 px-6 text-center text-xs text-slate-500 font-mono">
          <span>Synapse Enterprise Autonomous AI Control Plane — Unified Pipeline Architecture Active</span>
        </footer>
      </div>
    </div>
  );
}
