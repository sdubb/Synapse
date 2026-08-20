import React, { useState, useEffect } from "react";
import {
  Sparkles, Wrench, Shield, CheckCircle2, ArrowRight, Play,
  Plus, Edit3, Trash2, Key, Terminal, Activity, PauseCircle,
  PlayCircle, Layers, ArrowDown, Cpu, Sliders, Lock, Zap,
  TrendingUp, Eye, GitBranch, RefreshCw, Wand2, ShieldAlert,
  RotateCcw, Check, AlertTriangle, Send, Undo2
} from "lucide-react";
import { ADVANCED_AGENT_TOOL_REGISTRY } from "../../../server/src/templates/advancedTools.js";
import { generateDynamicPipelineSkill } from "../../../server/src/templates/dynamicPromptGenerator.js";

const API_BASE = "http://localhost:4000/api/v1";

export function MasterPipelineStudio({ onExecuteGoal }) {
  const [pipelines, setPipelines] = useState([]);
  const [activeDaemons, setActiveDaemons] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // ✦ AI Architect State
  const [userPromptIntent, setUserPromptIntent] = useState("");
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [aiNotice, setAiNotice] = useState(null);
  const [previousRevision, setPreviousRevision] = useState(null);

  // QA Verifier Diagnosis State
  const [qaDiagnosis, setQaDiagnosis] = useState(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);

  // Active Pipeline Form / Canvas State (Directly Editable & AI-Modifiable)
  const [pipelineName, setPipelineName] = useState("Autonomous Market Arbitrage & Risk Rebalancer");
  const [domain, setDomain] = useState("Quant Trading & Market Execution");
  const [selectedCli, setSelectedCli] = useState("aider");
  const [selectedModel, setSelectedModel] = useState("deepseek-r1:70b");
  const [cronInterval, setCronInterval] = useState(10);
  const [spendCeilingUsd, setSpendCeilingUsd] = useState(5000);
  const [hitlThresholdUsd, setHitlThresholdUsd] = useState(1000);
  const [systemPrompt, setSystemPrompt] = useState("");

  const [nodes, setNodes] = useState([
    {
      id: "node_1",
      nodeType: "MONITOR_STREAM",
      title: "Stream L2 Orderbook & Volatility Anomaly",
      tool: "market_data_orderbook_stream",
      condition: "ALWAYS_EXECUTE",
      retryCount: 3,
      fallbackAction: "ALERT_ON_CALL",
      postcondition: { verifier: "db_row_exists", params: { agentId: "agent-quant-trader" } },
      params: '{"pair": "BTC/USDT", "depth": 50, "timeframe": "1m"}'
    },
    {
      id: "node_2",
      nodeType: "CONDITIONAL_BRANCH",
      title: "Evaluate VaR Risk & Slippage Gate",
      tool: "portfolio_risk_var_analyzer",
      condition: "IF_VOLATILITY_SURGE_GT_2PCT",
      retryCount: 2,
      fallbackAction: "HALT_PIPELINE",
      postcondition: { verifier: "external_endpoint_status", params: { endpoint: "http://localhost:4000/api/v1/stats" } },
      params: '{"maxDrawdownPct": 2.5, "targetSharpe": 2.1, "rebalanceThresholdUsd": 50000}'
    },
    {
      id: "node_3",
      nodeType: "EXECUTE_ACTION",
      title: "Execute Algorithmic Limit Rebalance Order",
      tool: "execute_limit_market_order",
      condition: "IF_RISK_APPROVED",
      retryCount: 1,
      fallbackAction: "TRIGGER_2FA_APPROVAL",
      postcondition: { verifier: "idempotency_key_active", params: { idempotencyKey: "idem_order_01" } },
      params: '{"symbol": "NVDA", "action": "BUY", "quantity": 10, "orderType": "LIMIT", "maxSlippageBps": 15}'
    }
  ]);

  const allTools = ADVANCED_AGENT_TOOL_REGISTRY.flatMap(cat => cat.tools);

  // Dynamic Prompt Auto-Synthesis on any DAG or Governance change
  useEffect(() => {
    if (!isSynthesizing) {
      const dynamic = generateDynamicPipelineSkill({
        pipelineName: pipelineName || "Custom Autonomous Pipeline",
        domain,
        cliEngine: selectedCli === "aider" ? "Aider (Git-Native Pair CLI)" : selectedCli === "goose" ? "Goose (Block MCP)" : "Google Antigravity (agy)",
        model: selectedModel,
        spendCeilingUsd,
        hitlThresholdUsd,
        nodes
      });
      setSystemPrompt(dynamic);
    }
  }, [nodes, pipelineName, domain, selectedCli, selectedModel, spendCeilingUsd, hitlThresholdUsd, isSynthesizing]);

  // Fetch Pipelines from SQLite Backend & Daemons
  const fetchPipelines = async () => {
    try {
      const res = await fetch(`${API_BASE}/pipelines`).then(r => r.json());
      if (res.pipelines && res.pipelines.length > 0) {
        setPipelines(res.pipelines);
      }
    } catch (e) {}
  };

  const fetchDaemons = async () => {
    try {
      const res = await fetch(`${API_BASE}/daemons`).then(r => r.json());
      if (res.daemons) setActiveDaemons(res.daemons);
    } catch (e) {}
  };

  useEffect(() => {
    fetchPipelines();
    fetchDaemons();
  }, []);

  // Listen to WebSocket Events for Live State Synchronization
  useEffect(() => {
    let ws;
    try {
      ws = new WebSocket("ws://localhost:4000");
      ws.onmessage = (evt) => {
        try {
          const payload = JSON.parse(evt.data);
          if (payload.type === "NODE_CREATED" || payload.type === "NODE_UPDATED" || payload.type === "NODE_DELETED") {
            if (payload.data?.pipeline) {
              setNodes(payload.data.pipeline.nodes || []);
            }
          } else if (payload.type === "PIPELINE_COMMITTED" || payload.type === "PIPELINE_ROLLED_BACK") {
            fetchPipelines();
          }
        } catch (e) {}
      };
    } catch (e) {}

    return () => {
      if (ws) ws.close();
    };
  }, []);

  // ✦ AI Architect Directive (Constructs or Modifies the Visual Cards via MCP)
  const handleRunArchitect = async (e) => {
    if (e) e.preventDefault();
    if (!userPromptIntent.trim()) return;

    setIsSynthesizing(true);
    setAiNotice(null);

    try {
      const res = await fetch(`${API_BASE}/pipeline/architect/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userPrompt: userPromptIntent,
          pipelineId: editingId,
          activePipeline: {
            id: editingId || "pipe_active_studio",
            name: pipelineName,
            domain,
            cliEngine: selectedCli,
            model: selectedModel,
            spendCeilingUsd,
            hitlThresholdUsd,
            cronInterval,
            nodes
          },
          selectedCli,
          selectedModel
        })
      }).then(r => r.json());

      if (res.error) throw new Error(res.error);

      // Save previous state for 1-Click Undo
      setPreviousRevision({
        pipelineName,
        domain,
        spendCeilingUsd,
        hitlThresholdUsd,
        cronInterval,
        nodes: [...nodes],
        systemPrompt
      });

      // Update Visual Cards Directly with AI's Output
      if (res.pipeline) {
        setPipelineName(res.pipeline.name || pipelineName);
        setDomain(res.pipeline.domain || domain);
        setSpendCeilingUsd(res.pipeline.spendCeilingUsd || spendCeilingUsd);
        setHitlThresholdUsd(res.pipeline.hitlThresholdUsd || hitlThresholdUsd);
        setCronInterval(res.pipeline.cronInterval || cronInterval);
        setNodes(res.pipeline.nodes || nodes);
        if (res.pipeline.systemPrompt) setSystemPrompt(res.pipeline.systemPrompt);
      }

      setAiNotice(res.message || "Pipeline updated by AI Architect.");
      setUserPromptIntent("");
      setIsCreating(true);
    } catch (err) {
      alert("AI Architect Error: " + err.message);
    } finally {
      setIsSynthesizing(false);
    }
  };

  // ✦ 1-Click Undo AI Revision
  const handleUndoAiRevision = () => {
    if (!previousRevision) return;
    setPipelineName(previousRevision.pipelineName);
    setDomain(previousRevision.domain);
    setSpendCeilingUsd(previousRevision.spendCeilingUsd);
    setHitlThresholdUsd(previousRevision.hitlThresholdUsd);
    setCronInterval(previousRevision.cronInterval);
    setNodes(previousRevision.nodes);
    setSystemPrompt(previousRevision.systemPrompt);
    setPreviousRevision(null);
    setAiNotice(null);
  };

  // Manual Node Card Actions
  const handleAddNode = () => {
    const nextIdx = nodes.length + 1;
    setNodes([
      ...nodes,
      {
        id: "node_" + nextIdx,
        nodeType: "EXECUTE_ACTION",
        title: "Next Step in Sequence",
        tool: "market_data_orderbook_stream",
        condition: "ON_SUCCESS",
        retryCount: 2,
        fallbackAction: "ALERT_ON_CALL",
        postcondition: { verifier: "db_row_exists", params: { agentId: "agent-sales-ae" } },
        params: '{"pair": "BTC/USDT"}'
      }
    ]);
  };

  const handleRemoveNode = (idx) => {
    setNodes(nodes.filter((_, i) => i !== idx));
  };

  const handleToolChange = (idx, toolId) => {
    const selectedTool = allTools.find(t => t.id === toolId);
    const next = [...nodes];
    next[idx].tool = toolId;
    if (selectedTool) {
      next[idx].title = selectedTool.name;
      next[idx].params = selectedTool.defaultParams;
    }
    setNodes(next);
  };

  const handleUpdateNodeField = (idx, field, value) => {
    const next = [...nodes];
    next[idx][field] = value;
    setNodes(next);
  };

  // Save / Deploy Pipeline
  const handleSavePipeline = async (e) => {
    if (e) e.preventDefault();
    if (!pipelineName.trim()) return;

    const targetId = editingId || "pipe_" + Date.now();
    const payload = {
      id: targetId,
      name: pipelineName,
      domain,
      cliEngine: selectedCli === "aider" ? "Aider (Git-Native Pair CLI)" : selectedCli === "goose" ? "Goose (Block MCP)" : "Google Antigravity (agy)",
      model: selectedModel,
      spendCeilingUsd: Number(spendCeilingUsd),
      hitlThresholdUsd: Number(hitlThresholdUsd),
      cronInterval: Number(cronInterval),
      systemPrompt,
      nodes
    };

    try {
      await fetch(`${API_BASE}/pipelines`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      await fetch(`${API_BASE}/pipelines/${targetId}/commit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Saved from Studio Canvas", committedBy: "Operator" })
      });

      fetchPipelines();
      setIsCreating(false);
      setEditingId(null);
      setAiNotice(null);
    } catch (err) {
      alert("Save Error: " + err.message);
    }
  };

  const handleToggle24x7 = async (pipe) => {
    const isRunning = activeDaemons.some(d => d.agentId === pipe.id);
    if (isRunning) {
      await fetch(`${API_BASE}/daemons/${pipe.id}/stop`, { method: "POST" });
    } else {
      await fetch(`${API_BASE}/daemons/${pipe.id}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intervalSeconds: pipe.cronInterval || 10, goal: `Autonomous 24/7 continuous daemon for ${pipe.name}` })
      });
    }
    fetchDaemons();
  };

  const handleEditPipeline = (pipe) => {
    setEditingId(pipe.id);
    setPipelineName(pipe.name);
    setDomain(pipe.domain || "Quant Trading & Market Execution");
    setSelectedCli(pipe.cliEngine?.includes("Goose") ? "goose" : pipe.cliEngine?.includes("agy") ? "agy" : "aider");
    setSelectedModel(pipe.model || "deepseek-r1:70b");
    setCronInterval(pipe.cronInterval || 10);
    setSpendCeilingUsd(pipe.spendCeilingUsd || 5000);
    setHitlThresholdUsd(pipe.hitlThresholdUsd || 1000);
    setSystemPrompt(pipe.systemPrompt || "");
    setNodes(pipe.nodes || []);
    setIsCreating(true);
    setAiNotice(null);
  };

  const handleDeletePipeline = async (id) => {
    await fetch(`${API_BASE}/pipelines/${id}`, { method: "DELETE" });
    fetchPipelines();
  };

  const handleRunQAVerifier = async (pipe) => {
    setIsDiagnosing(true);
    try {
      const res = await fetch(`${API_BASE}/verification/workflow/diagnose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pipelineId: pipe.id,
          nodes: pipe.nodes || nodes,
          spendCeilingUsd: pipe.spendCeilingUsd
        })
      }).then(r => r.json());

      setQaDiagnosis(res);
    } catch (err) {
      alert("QA Error: " + err.message);
    } finally {
      setIsDiagnosing(false);
    }
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* 🛡️ TOP BANNER */}
      <div className="rounded-2xl bg-[#090C16] border border-cyan-500/30 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold text-cyan-300 bg-cyan-500/20 px-2.5 py-0.5 rounded-full border border-cyan-500/40">
              Tiered Actor/Verifier & Recovery Engine Active
            </span>
          </div>
          <h2 className="text-sm font-bold text-white">Universal Autonomous Pipeline & QA Controller</h2>
          <p className="text-[11px] text-slate-400 font-sans mt-0.5">
            Every pipeline everywhere (custom DAGs, A2A mesh, 24/7 loops) runs under Dual-Tier Verification: Tier 1 free deterministic checks + Tier 2 QA Diagnosis & Surgical Reruns.
          </p>
        </div>

        <button
          onClick={() => {
            setIsCreating(true);
            setEditingId(null);
            setAiNotice(null);
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-bold transition shadow-lg shadow-cyan-600/30 shrink-0 text-xs"
        >
          <Plus className="w-4 h-4" />
          <span>+ Architect New Verified Pipeline</span>
        </button>
      </div>

      {/* ✦ NATURAL-LANGUAGE AI ARCHITECT BAR */}
      <div className="rounded-2xl bg-gradient-to-r from-[#090D1A] via-[#0D182E] to-[#090D1A] border border-cyan-500/40 p-4 shadow-xl space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-xs font-bold text-white">AI Pipeline Architect</span>
            <span className="text-[10px] text-slate-400 font-sans hidden sm:inline">
              — Type natural language to auto-build or modify pipeline cards
            </span>
          </div>

          {previousRevision && (
            <button
              type="button"
              onClick={handleUndoAiRevision}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface hover:bg-surface-hover border border-cyan-500/40 text-cyan-300 text-[10.5px] font-bold"
            >
              <Undo2 className="w-3 h-3" /> Undo AI Revision
            </button>
          )}
        </div>

        <form onSubmit={handleRunArchitect} className="flex gap-2">
          <input
            type="text"
            value={userPromptIntent}
            onChange={(e) => setUserPromptIntent(e.target.value)}
            placeholder='e.g. "Monitor BTC volatility, calculate risk, execute limit order when spread > 0.5%, then verify execution"'
            className="flex-1 bg-[#060810] border border-cyan-500/40 focus:border-cyan-400 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-xs focus:outline-none"
          />

          <button
            type="submit"
            disabled={isSynthesizing}
            className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-600/30 transition shrink-0 disabled:opacity-50"
          >
            {isSynthesizing ? <Wand2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>{isSynthesizing ? "Architecting..." : "Generate Pipeline"}</span>
          </button>
        </form>

        {aiNotice && (
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10.5px] flex items-center gap-1.5 animate-in fade-in">
            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{aiNotice}</span>
          </div>
        )}
      </div>

      {/* 🛠️ DYNAMIC PIPELINE ASSEMBLER (MANUAL VISUAL CARDS & CONTROLS) */}
      {isCreating && (
        <div className="p-6 rounded-2xl bg-[#090C16] border border-cyan-500/50 space-y-5 shadow-2xl animate-in fade-in">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/80 pb-3">
            <div>
              <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">
                DYNAMIC PIPELINE ASSEMBLER
              </span>
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mt-0.5">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                {editingId ? "Edit Enterprise Pipeline Architecture" : "Design Custom Agent Pipeline with Verification Contracts"}
              </h3>
            </div>

            <button
              onClick={() => setIsCreating(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg text-sm"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSavePipeline} className="space-y-5">
            {/* Row 1: Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 p-4 rounded-xl bg-[#060810] border border-border">
              <div className="md:col-span-2">
                <label className="text-slate-300 font-bold block mb-1 text-[11px]">Pipeline Name</label>
                <input
                  type="text"
                  value={pipelineName}
                  onChange={(e) => setPipelineName(e.target.value)}
                  placeholder="e.g. Autonomous Market Arbitrage & Risk Rebalancer"
                  required
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-cyan-500 font-sans"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1 text-[11px]">Assigned CLI Harness</label>
                <select
                  value={selectedCli}
                  onChange={(e) => setSelectedCli(e.target.value)}
                  className="w-full bg-surface border border-cyan-500/40 rounded-xl px-3 py-2 text-cyan-300 font-bold text-xs focus:outline-none"
                >
                  <option value="aider">Aider (Git-Native Pair CLI)</option>
                  <option value="goose">Goose (Block MCP)</option>
                  <option value="openhands">OpenHands (Autonomous)</option>
                  <option value="agy">Google Antigravity (agy)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1 text-[11px]">Reasoning Model</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-indigo-300 font-bold text-xs focus:outline-none"
                >
                  <option value="deepseek-r1:70b">DeepSeek-R1 (Local Air-Gapped)</option>
                  <option value="llama3.3:70b">Llama 3.3 70B (vLLM)</option>
                  <option value="qwen2.5-coder:32b">Qwen 2.5 Coder 32B</option>
                  <option value="gpt-4o">OpenAI GPT-4o</option>
                  <option value="claude-3-7-sonnet">Claude 3.7 Sonnet</option>
                </select>
              </div>
            </div>

            {/* Row 2: Dynamic Auto-Synthesized Behavioral Skill Prompt */}
            <div className="p-4 rounded-xl bg-[#060810] border border-cyan-500/40 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-cyan-300 font-bold flex items-center gap-1.5 text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Auto-Synthesized Behavioral Skill Prompt (Customized to this DAG):
                </span>
                <span className="text-[10px] text-emerald-400 font-bold">Auto-updates on DAG changes</span>
              </div>
              <textarea
                rows={4}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="w-full bg-[#04060A] border border-border rounded-xl p-3 text-cyan-200 font-mono text-[10.5px] leading-relaxed focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Row 3: Governance Limits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 p-4 rounded-xl bg-[#060810] border border-border">
              <div>
                <label className="text-slate-300 font-bold block mb-1 text-[11px]">24/7 Monitor Interval (Seconds)</label>
                <input
                  type="number"
                  min="1"
                  max="3600"
                  value={cronInterval}
                  onChange={(e) => setCronInterval(Number(e.target.value))}
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-slate-100 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1 text-[11px]">Hard Spend Ceiling ($ USD)</label>
                <input
                  type="number"
                  value={spendCeilingUsd}
                  onChange={(e) => setSpendCeilingUsd(Number(e.target.value))}
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-emerald-400 font-bold text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1 text-[11px]">Human 2FA Threshold ($ USD)</label>
                <input
                  type="number"
                  value={hitlThresholdUsd}
                  onChange={(e) => setHitlThresholdUsd(Number(e.target.value))}
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-amber-400 font-bold text-xs focus:outline-none"
                />
              </div>
            </div>

            {/* Row 4: Sequential Execution Pipeline Stages Cards */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-cyan-300 font-bold flex items-center gap-2 text-xs">
                  <GitBranch className="w-4 h-4 text-cyan-400" />
                  Sequential Execution Pipeline Stages with Verification Contracts:
                </span>
                <button
                  type="button"
                  onClick={handleAddNode}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-hover border border-cyan-500/50 text-cyan-300 text-[11px] font-bold transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Next Step in Sequence
                </button>
              </div>

              <div className="space-y-3">
                {nodes.map((node, nIdx) => {
                  return (
                    <div key={nIdx} className="space-y-2">
                      <div className="p-4 rounded-xl bg-[#060810] border border-cyan-500/30 hover:border-cyan-500 transition space-y-3 shadow-md">
                        {/* Top Node Card Line */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 flex-1">
                            <span className="w-7 h-7 rounded-lg bg-cyan-600/20 border border-cyan-500 text-cyan-300 flex items-center justify-center font-bold text-xs shrink-0">
                              {nIdx + 1}
                            </span>

                            <input
                              type="text"
                              value={node.title}
                              onChange={(e) => handleUpdateNodeField(nIdx, "title", e.target.value)}
                              placeholder="Node Title"
                              className="flex-1 bg-surface border border-border rounded-lg px-3 py-1.5 text-white text-xs font-bold font-sans"
                            />
                          </div>

                          <select
                            value={node.nodeType}
                            onChange={(e) => handleUpdateNodeField(nIdx, "nodeType", e.target.value)}
                            className="bg-[#0C0E17] border border-cyan-500/50 rounded-lg px-2.5 py-1.5 text-cyan-300 text-xs font-bold focus:outline-none shrink-0"
                          >
                            <option value="MONITOR_STREAM">Node: Monitor Stream</option>
                            <option value="CONDITIONAL_BRANCH">Node: Conditional Branch</option>
                            <option value="EXECUTE_ACTION">Node: Action Execution</option>
                            <option value="A2A_DELEGATION">Node: A2A Peer Delegation</option>
                            <option value="NOTIFICATION">Node: 2FA Notification</option>
                          </select>

                          <select
                            value={node.tool}
                            onChange={(e) => handleToolChange(nIdx, e.target.value)}
                            className="bg-[#0C0E17] border border-indigo-500/50 rounded-lg px-2.5 py-1.5 text-indigo-300 text-xs font-bold focus:outline-none max-w-xs truncate"
                          >
                            {ADVANCED_AGENT_TOOL_REGISTRY.map((cat, cIdx) => (
                              <optgroup key={cIdx} label={cat.category} className="bg-background text-slate-300 font-bold">
                                {cat.tools.map((t) => (
                                  <option key={t.id} value={t.id} className="text-slate-100">
                                    {t.name} • ({t.provider.split(" ")[0]})
                                  </option>
                                ))}
                              </optgroup>
                            ))}
                          </select>

                          {nodes.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveNode(nIdx)}
                              className="p-1 text-rose-400 hover:text-rose-300 transition"
                              title="Delete Step"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {/* JSON Parameters Box */}
                        <div className="pl-9">
                          <textarea
                            rows={2}
                            value={typeof node.params === "string" ? node.params : JSON.stringify(node.params)}
                            onChange={(e) => handleUpdateNodeField(nIdx, "params", e.target.value)}
                            placeholder="JSON parameters"
                            className="w-full bg-[#04060A] border border-cyan-500/20 rounded-lg p-2.5 text-cyan-300 font-mono text-[11px] focus:outline-none focus:border-cyan-500"
                          />
                        </div>
                      </div>

                      {nIdx < nodes.length - 1 && (
                        <div className="flex items-center justify-center py-0.5">
                          <ArrowDown className="w-4 h-4 text-cyan-400 animate-bounce" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 rounded-xl bg-surface border border-border text-slate-300 hover:text-white"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-lg shadow-cyan-600/30 text-xs"
              >
                Deploy Synthesized Pipeline
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PIPELINE GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pipelines.map((pipe) => {
          const activeDaemon = activeDaemons.find(d => d.agentId === pipe.id);
          const is24x7Running = !!activeDaemon;

          return (
            <div
              key={pipe.id}
              className={`p-5 rounded-2xl border transition flex flex-col justify-between space-y-4 shadow-md ${
                is24x7Running
                  ? "bg-[#0A1325] border-cyan-500/60 shadow-xl shadow-cyan-500/10"
                  : "bg-surface border-border hover:border-cyan-500/50"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-cyan-500/20 text-cyan-300 border-cyan-500/40">
                    {pipe.domain}
                  </span>

                  {is24x7Running ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded-full border border-cyan-500/40 animate-pulse">
                      <Activity className="w-3 h-3 text-cyan-400 animate-spin" />
                      24/7 Active
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">Loop: Every {pipe.cronInterval || 10}s</span>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white">{pipe.name}</h3>
                  <span className="text-[10.5px] text-cyan-400 font-mono block mt-0.5">
                    Harness: {pipe.cliEngine} • {pipe.model}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-background border border-border/80 space-y-1.5">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">
                    Execution DAG ({pipe.nodes?.length || 0} Stages):
                  </span>
                  {pipe.nodes?.map((n, nIdx) => (
                    <div key={nIdx} className="text-[11px] text-slate-300 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 truncate">
                        <CheckCircle2 className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span className="truncate">{n.title}</span>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                        {n.nodeType?.split("_")[0]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex flex-col space-y-2 border-t border-border/60">
                <div className="flex items-center justify-between">
                  <button
                    disabled={isDiagnosing}
                    onClick={() => handleRunQAVerifier(pipe)}
                    className="flex-1 mr-2 flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 font-bold transition text-[11px]"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{isDiagnosing ? "Diagnosing..." : "QA Verifier Run"}</span>
                  </button>

                  <button
                    onClick={() => onExecuteGoal({
                      agentId: pipe.id,
                      userGoal: `Execute Pipeline for ${pipe.name}`,
                      spendLimitUsd: pipe.spendCeilingUsd
                    })}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition shadow-md shadow-cyan-600/20 text-[11px]"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Run</span>
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleEditPipeline(pipe)}
                      className="px-2 py-1 rounded-lg bg-surface hover:bg-surface-hover border border-border text-slate-300 text-[10.5px]"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeletePipeline(pipe.id)}
                      className="p-1 text-rose-400 hover:text-rose-300"
                      title="Delete Pipeline"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => handleToggle24x7(pipe)}
                    className={`px-3 py-1 rounded-xl font-bold transition text-[10.5px] border ${
                      is24x7Running
                        ? "bg-rose-500/20 border-rose-500/40 text-rose-300"
                        : "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
                    }`}
                  >
                    {is24x7Running ? "Stop 24/7" : "24/7 Loop"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
