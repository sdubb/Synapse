import React, { useState, useEffect } from "react";
import { Play, Sparkles, Building2, Cpu, Server, Truck, DollarSign, Shield, Zap, RefreshCw, Activity, Layers, ArrowRight } from "lucide-react";

export function EnterpriseFleetSimulator({ onTriggerEnterpriseSimulation }) {
  const [enterprises, setEnterprises] = useState([]);
  const [activeEnterprise, setActiveEnterprise] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStatus, setSimulationStatus] = useState(null);

  const fetchEnterprises = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/v1/enterprises");
      const data = await res.json();
      if (data.enterprises) {
        setEnterprises(data.enterprises);
        setActiveEnterprise(data.activeEnterprise || data.enterprises[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchEnterprises();
  }, []);

  const handleSwitchEnterprise = async (id) => {
    try {
      const res = await fetch("http://localhost:4000/api/v1/enterprises/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enterpriseId: id })
      });
      const data = await res.json();
      if (data.activeEnterprise) setActiveEnterprise(data.activeEnterprise);
    } catch (e) {
      console.error(e);
    }
  };

  const handleStart = async () => {
    setIsSimulating(true);
    setSimulationStatus(`Dispatching Autonomous Multi-Agent Fleet for ${activeEnterprise?.name || "Enterprise"}...`);
    try {
      await fetch("http://localhost:4000/api/v1/enterprises/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enterpriseId: activeEnterprise?.id })
      });
      if (onTriggerEnterpriseSimulation) onTriggerEnterpriseSimulation();
      setSimulationStatus(`Autonomous Cycle Active: Inter-Agent Delegation & Trajectory Verification in Progress`);
    } finally {
      setTimeout(() => setIsSimulating(false), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-surface border border-border p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-600 to-cyan-500 text-white shadow-lg shadow-emerald-500/20">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Autonomous Enterprise Fleet Orchestrator
            </h2>
            <p className="text-xs text-slate-400">
              Manage an entire autonomous company operated by specialized AI agents collaborating in real time
            </p>
          </div>
        </div>

        {/* Enterprise Switcher */}
        <div className="flex items-center gap-3">
          <select
            value={activeEnterprise?.id || ""}
            onChange={(e) => handleSwitchEnterprise(e.target.value)}
            className="bg-background border border-border rounded-xl px-4 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
          >
            {enterprises.map(e => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>

          <button
            disabled={isSimulating}
            onClick={handleStart}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white text-xs font-bold shadow-xl shadow-emerald-600/25 disabled:opacity-50 transition"
          >
            <Play className={`w-4 h-4 fill-current ${isSimulating ? "animate-spin" : ""}`} />
            <span>{isSimulating ? "Orchestrating Fleet..." : "Run Autonomous Enterprise Cycle"}</span>
          </button>
        </div>
      </div>

      {/* Live Status Banner */}
      {simulationStatus && (
        <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 flex items-center justify-between font-mono text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>{simulationStatus}</span>
          </div>
          <span className="text-[10px] text-slate-400">Switch to 'Agent Thought Stream' to observe step-by-step reasoning</span>
        </div>
      )}

      {/* Active Enterprise Fleet Cards */}
      {activeEnterprise && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              Active Fleet for: <strong className="text-white">{activeEnterprise.name}</strong> ({activeEnterprise.industry})
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {activeEnterprise.activeAgents.map((agent, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-surface/90 border border-border hover:border-emerald-500/40 transition space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-background border border-border">
                    <Cpu className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                    ACTIVE FLEET
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white">{agent.id}</h3>
                  <p className="text-xs text-slate-300 font-mono mt-0.5">{agent.role}</p>
                </div>

                <div className="pt-3 border-t border-border/60 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Model Engine:</span>
                  <span className="text-cyan-400 font-bold">{agent.model}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
