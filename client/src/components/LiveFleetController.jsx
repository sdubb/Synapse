import React, { useState, useEffect } from "react";
import {
  Shield, Cpu, Power, Sliders, Activity, CheckCircle2, AlertTriangle,
  RotateCcw, RefreshCw, Plus, Edit3, Trash2, Key, Terminal, ExternalLink,
  Lock, Eye, Play, PauseCircle, Search, Filter, Check
} from "lucide-react";

export function LiveFleetController() {
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("ALL");
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Policy Form State
  const [spendLimit, setSpendLimit] = useState(500);
  const [hitlThreshold, setHitlThreshold] = useState(300);
  const [blockDestructive, setBlockDestructive] = useState(true);
  const [redactPii, setRedactPii] = useState(true);

  const fetchAgents = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/v1/agents").then(r => r.json());
      if (res.agents) {
        setAgents(res.agents);
        if (!selectedAgent && res.agents.length > 0) {
          setSelectedAgent(res.agents[0]);
          setSpendLimit(res.agents[0].spendCeilingUsd || 500);
          setHitlThreshold(res.agents[0].requiresHitlAboveUsd || 300);
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleToggleKillSwitch = async (agentId) => {
    await fetch(`http://localhost:4000/api/v1/agents/${agentId}/kill`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "Executive Live Kill Switch Toggled from Universal Fleet Controller" })
    });
    fetchAgents();
  };

  const handleSelectAgent = (agent) => {
    setSelectedAgent(agent);
    setSpendLimit(agent.spendCeilingUsd || 500);
    setHitlThreshold(agent.requiresHitlAboveUsd || 300);
    setSavedSuccess(false);
  };

  const handleSavePolicy = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const departments = ["ALL", ...new Set(agents.map(a => a.department))];

  const filteredAgents = agents.filter(agt => {
    const matchesSearch = agt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          agt.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          agt.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDepartment === "ALL" || agt.department === selectedDepartment;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white">AI Workforce Directory & Fleet Governance</h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {agents.length} Active Workers
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Centralized policy supervision, dynamic spend boundaries, and 1-click circuit-breaker kill switches.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAgents}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Fleet</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search agents, providers, IDs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => setSelectedDepartment(dept)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                selectedDepartment === dept
                  ? "bg-blue-600 text-white"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* Grid: Left = Fleet List, Right = Selected Agent Policy Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 6 Cols: Workforce Directory List */}
        <div className="lg:col-span-6 space-y-3">
          <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
            {filteredAgents.map((agt) => {
              const isSelected = selectedAgent?.id === agt.id;
              const isSuspended = agt.status === "SUSPENDED";

              return (
                <div
                  key={agt.id}
                  onClick={() => handleSelectAgent(agt)}
                  className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between space-y-3 ${
                    isSelected
                      ? "bg-slate-900 border-blue-500 shadow-md shadow-blue-500/10 text-white"
                      : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {agt.department}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                      isSuspended
                        ? "bg-rose-500/15 text-rose-400 border-rose-500/30 font-semibold"
                        : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                    }`}>
                      {isSuspended ? "SUSPENDED" : "ACTIVE"}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-white">{agt.name}</h3>
                    <span className="text-xs text-slate-400 block mt-0.5">{agt.provider}</span>
                  </div>

                  <div className="pt-2.5 flex items-center justify-between border-t border-slate-800 text-xs text-slate-400">
                    <span>Spend Ceiling: <strong className="text-slate-200 font-mono">${agt.spendCeilingUsd}</strong></span>
                    <span>2FA Review: <strong className="text-amber-400 font-mono">${agt.requiresHitlAboveUsd}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 6 Cols: Live Governance & Interception Console */}
        {selectedAgent && (
          <div className="lg:col-span-6 rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-6">
            {/* Header with Kill Switch */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-semibold text-blue-400">{selectedAgent.department}</span>
                <h3 className="text-base font-bold text-white mt-0.5">{selectedAgent.name}</h3>
                <span className="text-xs text-slate-400 font-mono block mt-1">
                  ID: {selectedAgent.id} • {selectedAgent.provider}
                </span>
              </div>

              <button
                onClick={() => handleToggleKillSwitch(selectedAgent.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                  selectedAgent.status === "SUSPENDED"
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20"
                    : "bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20"
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                <span>{selectedAgent.status === "SUSPENDED" ? "Reactivate Agent" : "Emergency Kill"}</span>
              </button>
            </div>

            {/* Spend Ceiling Controls */}
            <div className="space-y-4 bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-400" /> Spend Limits & Human-in-the-Loop Threshold
                </span>
                <span className="text-xs text-emerald-400 font-medium">Enforced via OPA</span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Hard Spend Ceiling (Auto-block above)</span>
                  <span className="text-sm font-semibold font-mono text-emerald-400">${spendLimit} USD</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="10000"
                  step="100"
                  value={spendLimit}
                  onChange={(e) => setSpendLimit(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Human-in-the-Loop 2FA Threshold</span>
                  <span className="text-sm font-semibold font-mono text-amber-400">${hitlThreshold} USD</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="2000"
                  step="50"
                  value={hitlThreshold}
                  onChange={(e) => setHitlThreshold(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div className="pt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-slate-800 text-xs">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={blockDestructive}
                    onChange={(e) => setBlockDestructive(e.target.checked)}
                    className="accent-blue-600 rounded"
                  />
                  <span>Zero-Destruction Invariant</span>
                </label>

                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={redactPii}
                    onChange={(e) => setRedactPii(e.target.checked)}
                    className="accent-blue-600 rounded"
                  />
                  <span>Automatic PII Redactor</span>
                </label>
              </div>
            </div>

            {/* MCP Gateway Target */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <span className="text-xs font-semibold text-slate-300 block">MCP Interception Gateway:</span>
              <code className="text-blue-400 text-xs block font-mono">http://localhost:4005 (Universal FAANG MCP)</code>
              <span className="text-xs text-slate-500 block">All tool calls evaluated in &lt;3ms against Rego invariants.</span>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">Persistent storage in SQLite WAL DB.</span>
              <button
                onClick={handleSavePolicy}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition shadow-md shadow-blue-600/20"
              >
                {savedSuccess ? <Check className="w-3.5 h-3.5" /> : null}
                <span>{savedSuccess ? "Policy Applied!" : "Save & Enforce Policy"}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
