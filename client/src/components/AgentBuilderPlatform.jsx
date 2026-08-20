import React, { useState, useEffect } from "react";
import {
  Sparkles, Wrench, Shield, CheckCircle2, ArrowRight, Play,
  Plus, Edit3, Trash2, Key, Terminal, ExternalLink, Activity,
  Database, Server, Lock, Cpu, Globe, Layers, ArrowDown
} from "lucide-react";
import { FAANG_ENTERPRISE_TOOL_REGISTRY } from "../../../server/src/templates/faangTools.js";

export function AgentBuilderPlatform({ onExecuteGoal }) {
  const [agents, setAgents] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form State to build a new agent
  const [agentName, setAgentName] = useState("");
  const [role, setRole] = useState("Corporate Treasury & Invoicing Specialist");
  const [department, setDepartment] = useState("Finance & Treasury");
  const [selectedCli, setSelectedCli] = useState("aider");
  const [selectedModel, setSelectedModel] = useState("deepseek-r1:70b");
  const [spendCeilingUsd, setSpendCeilingUsd] = useState(2500);
  const [hitlThresholdUsd, setHitlThresholdUsd] = useState(500);
  const [selectedTools, setSelectedTools] = useState([
    "aws_s3_worm_audit",
    "salesforce_enterprise_sync",
    "sap_erp_ledger_reconcile"
  ]);

  const allTools = FAANG_ENTERPRISE_TOOL_REGISTRY.flatMap(cat => cat.tools);

  useEffect(() => {
    const saved = localStorage.getItem("synapse_custom_built_agents");
    if (saved) {
      try { setAgents(JSON.parse(saved)); } catch (e) {}
    } else {
      const defaultAgents = [
        {
          id: "custom_agt_01",
          name: "Autonomous Enterprise Deal Closer",
          role: "Sales & Revenue Ops",
          department: "Sales & Revenue",
          cliEngine: "Aider (Open Source CLI)",
          model: "deepseek-r1:70b",
          spendCeilingUsd: 5000,
          hitlThresholdUsd: 1000,
          tools: ["salesforce_enterprise_sync", "slack_enterprise_block_kit", "a2a_cross_delegation"],
          status: "DEPLOYED_ACTIVE"
        },
        {
          id: "custom_agt_02",
          name: "Kubernetes Zero-Downtime Cluster Healer",
          role: "SRE & Infrastructure",
          department: "Engineering & SRE",
          cliEngine: "Goose (Block / Square MCP)",
          model: "qwen2.5-coder:32b",
          spendCeilingUsd: 3000,
          hitlThresholdUsd: 500,
          tools: ["k8s_cluster_drain_restart", "hashicorp_vault_token_rotation", "datadog_pagerduty_sentry_alert"],
          status: "DEPLOYED_ACTIVE"
        }
      ];
      setAgents(defaultAgents);
      localStorage.setItem("synapse_custom_built_agents", JSON.stringify(defaultAgents));
    }
  }, []);

  const saveAgents = (updated) => {
    setAgents(updated);
    localStorage.setItem("synapse_custom_built_agents", JSON.stringify(updated));
  };

  const handleToggleTool = (toolId) => {
    if (selectedTools.includes(toolId)) {
      setSelectedTools(selectedTools.filter(t => t !== toolId));
    } else {
      setSelectedTools([...selectedTools, toolId]);
    }
  };

  const handleSaveAgent = (e) => {
    e.preventDefault();
    if (!agentName.trim()) return;

    const newAgent = {
      id: editingId || "agt_" + Date.now(),
      name: agentName,
      role,
      department,
      cliEngine: selectedCli === "aider" ? "Aider (Open Source)" : selectedCli === "goose" ? "Goose (Block MCP)" : "OpenHands / agy",
      model: selectedModel,
      spendCeilingUsd: Number(spendCeilingUsd),
      hitlThresholdUsd: Number(hitlThresholdUsd),
      tools: selectedTools,
      status: "DEPLOYED_ACTIVE"
    };

    if (editingId) {
      saveAgents(agents.map(a => a.id === editingId ? newAgent : a));
    } else {
      saveAgents([newAgent, ...agents]);
    }

    setIsCreating(false);
    setEditingId(null);
  };

  const handleDeleteAgent = (id) => {
    saveAgents(agents.filter(a => a.id !== id));
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Platform Title Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0C0E17] via-[#0A1226] to-[#0C0E17] border border-indigo-500/30 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/40 text-[10px]">
              Synapse Control Plane
            </span>
            <h2 className="text-sm font-bold text-white">Enterprise AI Agent Factory & Tool Assembler</h2>
          </div>
          <p className="text-[11px] text-slate-400 font-sans">
            Build, equip, and deploy custom autonomous AI agents. Attach FAANG tools (AWS S3, K8s, SAP, Salesforce, Vault), assign open-source CLI engines (Aider, Goose, OpenHands), and enforce real-time OPA spend limits.
          </p>
        </div>

        <button
          onClick={() => {
            setIsCreating(true);
            setEditingId(null);
            setAgentName("");
            setSelectedTools(["salesforce_enterprise_sync", "aws_s3_worm_audit"]);
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow-lg shadow-indigo-600/20 shrink-0 text-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Build & Deploy New Agent</span>
        </button>
      </div>

      {/* CREATE / EDIT AGENT MODAL */}
      {isCreating && (
        <div className="p-6 rounded-2xl bg-[#090B13] border border-indigo-500/50 space-y-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <span className="text-[10px] text-indigo-400 font-bold uppercase">Agent Assembler</span>
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mt-0.5">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                {editingId ? "Edit Custom Agent" : "Assemble New Enterprise Autonomous Agent"}
              </h3>
            </div>

            <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-white">
              ✕
            </button>
          </div>

          <form onSubmit={handleSaveAgent} className="space-y-6">
            {/* Row 1: Identity & Engine */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Agent Name</label>
                <input
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder="e.g. Corporate Treasury Auditor"
                  required
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Assigned CLI Engine Harness</label>
                <select
                  value={selectedCli}
                  onChange={(e) => setSelectedCli(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-cyan-300 font-bold text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="aider">Aider (Git-Native Open Source CLI)</option>
                  <option value="goose">Goose (Block / Square Native MCP CLI)</option>
                  <option value="openhands">OpenHands (Autonomous Linux Fdn Harness)</option>
                  <option value="agy">Google Antigravity CLI (agy)</option>
                  <option value="native">Synapse Native Daemon (Zero Install)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Underlying Reasoning Model</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-indigo-300 font-bold text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="deepseek-r1:70b">DeepSeek-R1 (Local / Air-Gapped via Ollama)</option>
                  <option value="llama3.3:70b">Llama 3.3 70B (Local via vLLM)</option>
                  <option value="qwen2.5-coder:32b">Qwen 2.5 Coder 32B (Local)</option>
                  <option value="gpt-4o">OpenAI GPT-4o (Azure / OpenAI REST)</option>
                  <option value="claude-3-7-sonnet">Anthropic Claude 3.7 Sonnet</option>
                </select>
              </div>
            </div>

            {/* Row 2: Spend & 2FA Governance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-background border border-border">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Hard Spend Ceiling ($ USD)</label>
                <input
                  type="number"
                  value={spendCeilingUsd}
                  onChange={(e) => setSpendCeilingUsd(e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-emerald-400 font-bold text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Human-in-the-Loop 2FA Threshold ($ USD)</label>
                <input
                  type="number"
                  value={hitlThresholdUsd}
                  onChange={(e) => setHitlThresholdUsd(e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-amber-400 font-bold text-xs focus:outline-none"
                />
              </div>
            </div>

            {/* Row 3: Select Tool Capabilities to Inject */}
            <div className="space-y-3">
              <span className="text-slate-300 font-bold flex items-center gap-2">
                <Wrench className="w-3.5 h-3.5 text-indigo-400" /> Equip Agent with FAANG Tools & Connectors:
              </span>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {allTools.map((tool) => {
                  const isEquipped = selectedTools.includes(tool.id);

                  return (
                    <div
                      key={tool.id}
                      onClick={() => handleToggleTool(tool.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-2.5 ${
                        isEquipped
                          ? "bg-indigo-950/40 border-indigo-500 text-white shadow-md shadow-indigo-500/10"
                          : "bg-background border-border text-slate-400 hover:border-slate-600"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isEquipped}
                        onChange={() => {}}
                        className="mt-0.5 accent-indigo-500 rounded"
                      />
                      <div className="space-y-0.5">
                        <strong className="text-xs text-white block">{tool.name}</strong>
                        <span className="text-[9.5px] text-cyan-400 font-mono block">[{tool.provider.split(" ")[0]}]</span>
                        <p className="text-[10px] text-slate-400 font-sans line-clamp-2">{tool.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 rounded-xl bg-surface border border-border text-slate-300"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30"
              >
                Deploy Custom Agent to Fleet
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DEPLOYED CUSTOM AGENT FLEET */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agt) => (
          <div
            key={agt.id}
            className="p-5 rounded-2xl bg-surface border border-border hover:border-indigo-500/50 transition flex flex-col justify-between space-y-4 shadow-md"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-indigo-500/20 text-indigo-300 border-indigo-500/40">
                  {agt.department}
                </span>
                <span className="text-[10px] text-emerald-400 font-bold">Cap: ${agt.spendCeilingUsd}</span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white">{agt.name}</h3>
                <span className="text-[10.5px] text-cyan-400 font-mono block mt-0.5">
                  Engine: {agt.cliEngine} • {agt.model}
                </span>
              </div>

              {/* Equipped Tools List */}
              <div className="p-3 rounded-xl bg-background border border-border/80 space-y-1.5">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Equipped Tools ({agt.tools.length}):</span>
                {agt.tools.map((tId, tIdx) => {
                  const t = allTools.find(tool => tool.id === tId) || { name: tId };
                  return (
                    <div key={tIdx} className="text-[11px] text-slate-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span className="truncate">{t.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-border/60">
              <button
                onClick={() => handleDeleteAgent(agt.id)}
                className="p-1.5 text-rose-400 hover:text-rose-300 transition"
                title="Delete Agent"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onExecuteGoal({
                  agentId: agt.id,
                  userGoal: `Run Autonomous Directive for ${agt.name}`,
                  spendLimitUsd: agt.spendCeilingUsd
                })}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow-md shadow-indigo-600/20 text-[11px]"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Launch Agent</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
