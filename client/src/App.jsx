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

  const TAB_TITLES = {
    pipeline_studio: "Pipelines",
    workforce: "Fleet",
    hitl: "Approvals",
    incidents: "Incidents",
    policies: "Policies",
    a2a: "A2A Mesh",
    redteam: "Security",
    connect: "CLI Hub",
    diagnostics: "Diagnostics",
    audit: "Audit log"
  };

  return (
    <div className="min-h-screen bg-[#0A0E17] text-[#E2E8F0] flex flex-col lg:flex-row antialiased">
      <SidebarNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        stats={stats}
        wsConnected={wsConnected}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="border-b border-[#1E293B] bg-[#0D1220]/90 backdrop-blur-md px-6 py-3.5 flex items-center justify-between sticky top-0 z-40">
          <h2 className="text-sm font-semibold text-white tracking-tight">
            {TAB_TITLES[activeTab] || "Synapse"}
          </h2>

          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.04] text-[11px] text-[#94A3B8]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34D399]" />
              Engine running
            </div>

            <button
              onClick={fetchData}
              className="p-1.5 rounded-md hover:bg-white/[0.06] text-[#64748B] hover:text-[#E2E8F0] transition-colors"
              title="Refresh data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        <main className="px-6 py-5 max-w-6xl mx-auto w-full flex-1">
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
      </div>
    </div>
  );
}
