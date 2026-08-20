import React, { useState, useEffect } from "react";
import {
  Plus, Trash2, Play, Send, Undo2, Check, Activity,
  ChevronDown, X, Shield, ArrowDown
} from "lucide-react";
import { ADVANCED_AGENT_TOOL_REGISTRY } from "../../../server/src/templates/advancedTools.js";
import { generateDynamicPipelineSkill } from "../../../server/src/templates/dynamicPromptGenerator.js";

const API_BASE = "http://localhost:4000/api/v1";

// Node type labels — plain language, not system constants
const NODE_TYPE_LABELS = {
  MONITOR_STREAM: "Monitor",
  CONDITIONAL_BRANCH: "Branch",
  EXECUTE_ACTION: "Execute",
  A2A_DELEGATION: "Delegate",
  NOTIFICATION: "Notify"
};

// Thin left-border color per node type — the signature structural element
const NODE_TYPE_ACCENTS = {
  MONITOR_STREAM: "#818CF8",      // iris — observation
  CONDITIONAL_BRANCH: "#FB923C",  // thermal — decision
  EXECUTE_ACTION: "#F87171",      // danger — mutation
  A2A_DELEGATION: "#38BDF8",      // sky — delegation
  NOTIFICATION: "#34D399"         // verified — notification
};

export function MasterPipelineStudio({ onExecuteGoal }) {
  const [pipelines, setPipelines] = useState([]);
  const [activeDaemons, setActiveDaemons] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // AI Architect state
  const [userPromptIntent, setUserPromptIntent] = useState("");
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [aiNotice, setAiNotice] = useState(null);
  const [previousRevision, setPreviousRevision] = useState(null);

  // QA state
  const [qaDiagnosis, setQaDiagnosis] = useState(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);

  // Collapsible sections
  const [showPrompt, setShowPrompt] = useState(false);

  // Pipeline form state
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

  // Auto-synthesize prompt on changes
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

  // Fetch data
  const fetchPipelines = async () => {
    try {
      const res = await fetch(`${API_BASE}/pipelines`).then(r => r.json());
      if (res.pipelines && res.pipelines.length > 0) setPipelines(res.pipelines);
    } catch (e) {}
  };

  const fetchDaemons = async () => {
    try {
      const res = await fetch(`${API_BASE}/daemons`).then(r => r.json());
      if (res.daemons) setActiveDaemons(res.daemons);
    } catch (e) {}
  };

  useEffect(() => { fetchPipelines(); fetchDaemons(); }, []);

  // WebSocket live sync
  useEffect(() => {
    let ws;
    try {
      ws = new WebSocket("ws://localhost:4000");
      ws.onmessage = (evt) => {
        try {
          const payload = JSON.parse(evt.data);
          if (["NODE_CREATED", "NODE_UPDATED", "NODE_DELETED"].includes(payload.type)) {
            if (payload.data?.pipeline) setNodes(payload.data.pipeline.nodes || []);
          } else if (["PIPELINE_COMMITTED", "PIPELINE_ROLLED_BACK"].includes(payload.type)) {
            fetchPipelines();
          }
        } catch (e) {}
      };
    } catch (e) {}
    return () => { if (ws) ws.close(); };
  }, []);

  // AI Architect
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
            id: editingId || "pipe_active_studio", name: pipelineName, domain,
            cliEngine: selectedCli, model: selectedModel,
            spendCeilingUsd, hitlThresholdUsd, cronInterval, nodes
          },
          selectedCli, selectedModel
        })
      }).then(r => r.json());

      if (res.error) throw new Error(res.error);

      setPreviousRevision({ pipelineName, domain, spendCeilingUsd, hitlThresholdUsd, cronInterval, nodes: [...nodes], systemPrompt });

      if (res.pipeline) {
        setPipelineName(res.pipeline.name || pipelineName);
        setDomain(res.pipeline.domain || domain);
        setSpendCeilingUsd(res.pipeline.spendCeilingUsd || spendCeilingUsd);
        setHitlThresholdUsd(res.pipeline.hitlThresholdUsd || hitlThresholdUsd);
        setCronInterval(res.pipeline.cronInterval || cronInterval);
        setNodes(res.pipeline.nodes || nodes);
        if (res.pipeline.systemPrompt) setSystemPrompt(res.pipeline.systemPrompt);
      }

      setAiNotice(res.message || "Pipeline updated.");
      setUserPromptIntent("");
      setIsCreating(true);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setIsSynthesizing(false);
    }
  };

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

  // Node mutations
  const handleAddNode = () => {
    setNodes([...nodes, {
      id: "node_" + (nodes.length + 1),
      nodeType: "EXECUTE_ACTION",
      title: "",
      tool: "market_data_orderbook_stream",
      condition: "ON_SUCCESS",
      retryCount: 2,
      fallbackAction: "ALERT_ON_CALL",
      postcondition: { verifier: "db_row_exists", params: { agentId: "agent-sales-ae" } },
      params: '{}'
    }]);
  };

  const handleRemoveNode = (idx) => setNodes(nodes.filter((_, i) => i !== idx));

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

  // Save pipeline
  const handleSavePipeline = async (e) => {
    if (e) e.preventDefault();
    if (!pipelineName.trim()) return;
    const targetId = editingId || "pipe_" + Date.now();

    try {
      await fetch(`${API_BASE}/pipelines`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: targetId, name: pipelineName, domain,
          cliEngine: selectedCli === "aider" ? "Aider (Git-Native Pair CLI)" : selectedCli === "goose" ? "Goose (Block MCP)" : "Google Antigravity (agy)",
          model: selectedModel, spendCeilingUsd: Number(spendCeilingUsd),
          hitlThresholdUsd: Number(hitlThresholdUsd), cronInterval: Number(cronInterval),
          systemPrompt, nodes
        })
      });
      await fetch(`${API_BASE}/pipelines/${targetId}/commit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Saved from studio", committedBy: "Operator" })
      });
      fetchPipelines();
      setIsCreating(false);
      setEditingId(null);
      setAiNotice(null);
    } catch (err) {
      alert("Save failed: " + err.message);
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
        body: JSON.stringify({ intervalSeconds: pipe.cronInterval || 10, goal: `Run ${pipe.name}` })
      });
    }
    fetchDaemons();
  };

  const handleEditPipeline = (pipe) => {
    setEditingId(pipe.id);
    setPipelineName(pipe.name);
    setDomain(pipe.domain || "");
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
        body: JSON.stringify({ pipelineId: pipe.id, nodes: pipe.nodes || nodes, spendCeilingUsd: pipe.spendCeilingUsd })
      }).then(r => r.json());
      setQaDiagnosis(res);
    } catch (err) {
      alert("Verification failed: " + err.message);
    } finally {
      setIsDiagnosing(false);
    }
  };

  // ─── RENDER ───────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* ─── HEADER ROW ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold text-white tracking-tight">
            Pipeline studio
          </h2>
          <p className="text-[12.5px] text-[#64748B] mt-0.5">
            Build multi-stage agent workflows. Use the prompt bar or add stages manually.
          </p>
        </div>

        <button
          onClick={() => { setIsCreating(true); setEditingId(null); setAiNotice(null); }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#818CF8] hover:bg-[#6366F1] text-white text-[12.5px] font-medium transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          New pipeline
        </button>
      </div>

      {/* ─── AI ARCHITECT BAR ─── */}
      <form onSubmit={handleRunArchitect} className="relative">
        <input
          type="text"
          value={userPromptIntent}
          onChange={(e) => setUserPromptIntent(e.target.value)}
          placeholder="Describe your pipeline — e.g. Monitor BTC spread, check risk, execute if profitable, verify settlement"
          className="w-full bg-[#111827] border border-[#1E293B] focus:border-[#818CF8] rounded-lg pl-4 pr-28 py-3 text-[13px] text-[#E2E8F0] placeholder-[#475569] focus:outline-none transition-colors"
        />
        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {previousRevision && (
            <button
              type="button"
              onClick={handleUndoAiRevision}
              className="px-2 py-1.5 rounded-md text-[11px] text-[#94A3B8] hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="submit"
            disabled={isSynthesizing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#818CF8] hover:bg-[#6366F1] text-white text-[12px] font-medium transition-colors disabled:opacity-40"
          >
            <Send className="w-3 h-3" />
            {isSynthesizing ? "Building..." : "Generate"}
          </button>
        </div>
      </form>

      {aiNotice && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#34D399]/8 border border-[#34D399]/20 text-[#34D399] text-[12px]">
          <Check className="w-3.5 h-3.5 shrink-0" />
          {aiNotice}
        </div>
      )}

      {/* ─── PIPELINE EDITOR ─── */}
      {isCreating && (
        <div className="rounded-xl bg-[#111827] border border-[#1E293B] overflow-hidden">

          {/* Editor header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1E293B]">
            <h3 className="text-[13px] font-semibold text-white">
              {editingId ? "Edit pipeline" : "New pipeline"}
            </h3>
            <button
              onClick={() => setIsCreating(false)}
              className="p-1 rounded-md text-[#64748B] hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSavePipeline}>

            {/* ─── Configuration ─── */}
            <div className="px-5 py-4 space-y-4 border-b border-[#1E293B]">
              {/* Name row */}
              <div>
                <label className="text-[11px] text-[#64748B] font-medium block mb-1.5">Name</label>
                <input
                  type="text"
                  value={pipelineName}
                  onChange={(e) => setPipelineName(e.target.value)}
                  placeholder="e.g. BTC Arbitrage & Risk Rebalancer"
                  required
                  className="w-full bg-[#0D1220] border border-[#1E293B] focus:border-[#818CF8] rounded-lg px-3 py-2 text-[13px] text-[#E2E8F0] focus:outline-none"
                />
              </div>

              {/* Config grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] text-[#64748B] font-medium block mb-1.5">CLI harness</label>
                  <select
                    value={selectedCli}
                    onChange={(e) => setSelectedCli(e.target.value)}
                    className="w-full bg-[#0D1220] border border-[#1E293B] rounded-lg px-3 py-2 text-[12px] text-[#E2E8F0] focus:outline-none focus:border-[#818CF8]"
                  >
                    <option value="aider">Aider</option>
                    <option value="goose">Goose</option>
                    <option value="openhands">OpenHands</option>
                    <option value="agy">Antigravity</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-[#64748B] font-medium block mb-1.5">Model</label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full bg-[#0D1220] border border-[#1E293B] rounded-lg px-3 py-2 text-[12px] text-[#E2E8F0] focus:outline-none focus:border-[#818CF8]"
                  >
                    <option value="deepseek-r1:70b">DeepSeek-R1 70B</option>
                    <option value="llama3.3:70b">Llama 3.3 70B</option>
                    <option value="qwen2.5-coder:32b">Qwen 2.5 Coder 32B</option>
                    <option value="gpt-4o">GPT-4o</option>
                    <option value="claude-3-7-sonnet">Claude 3.7 Sonnet</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-[#64748B] font-medium block mb-1.5">Spend limit</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-[#64748B]">$</span>
                    <input
                      type="number"
                      value={spendCeilingUsd}
                      onChange={(e) => setSpendCeilingUsd(Number(e.target.value))}
                      className="w-full bg-[#0D1220] border border-[#1E293B] rounded-lg pl-7 pr-3 py-2 text-[12px] text-[#E2E8F0] focus:outline-none focus:border-[#818CF8] tabular-nums"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-[#64748B] font-medium block mb-1.5">Approval threshold</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-[#64748B]">$</span>
                    <input
                      type="number"
                      value={hitlThresholdUsd}
                      onChange={(e) => setHitlThresholdUsd(Number(e.target.value))}
                      className="w-full bg-[#0D1220] border border-[#1E293B] rounded-lg pl-7 pr-3 py-2 text-[12px] text-[#FB923C] font-medium focus:outline-none focus:border-[#818CF8] tabular-nums"
                    />
                  </div>
                </div>
              </div>

              {/* Collapsible system prompt */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowPrompt(!showPrompt)}
                  className="flex items-center gap-1.5 text-[11px] text-[#64748B] hover:text-[#94A3B8] transition-colors"
                >
                  <ChevronDown className={`w-3 h-3 transition-transform ${showPrompt ? "rotate-180" : ""}`} />
                  Generated system prompt
                  <span className="text-[#34D399] text-[10px]">· live</span>
                </button>
                {showPrompt && (
                  <textarea
                    rows={5}
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    className="w-full mt-2 bg-[#0A0E17] border border-[#1E293B] rounded-lg p-3 text-[11px] text-[#94A3B8] font-data leading-relaxed focus:outline-none focus:border-[#818CF8] resize-y"
                  />
                )}
              </div>
            </div>

            {/* ─── STAGES — the signature element ─── */}
            <div className="px-5 py-4 space-y-0">

              <div className="flex items-center justify-between mb-4">
                <span className="text-[12px] text-[#94A3B8] font-medium">
                  Stages <span className="text-[#64748B]">· {nodes.length}</span>
                </span>
                <button
                  type="button"
                  onClick={handleAddNode}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] text-[#818CF8] hover:bg-[#818CF8]/10 transition-colors font-medium"
                >
                  <Plus className="w-3 h-3" /> Add stage
                </button>
              </div>

              {/* Stage cards with continuous left-border spine */}
              <div className="space-y-px">
                {nodes.map((node, nIdx) => {
                  const accent = NODE_TYPE_ACCENTS[node.nodeType] || "#818CF8";

                  return (
                    <div key={nIdx}>
                      <div
                        className="relative bg-[#0D1220] hover:bg-[#0F1525] transition-colors rounded-lg overflow-hidden group"
                        style={{ borderLeft: `3px solid ${accent}` }}
                      >
                        <div className="px-4 py-3.5 space-y-2.5">

                          {/* Stage header row */}
                          <div className="flex items-center gap-3">
                            {/* Type tag */}
                            <span
                              className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded shrink-0"
                              style={{ color: accent, backgroundColor: accent + "18" }}
                            >
                              {NODE_TYPE_LABELS[node.nodeType] || node.nodeType}
                            </span>

                            {/* Title input */}
                            <input
                              type="text"
                              value={node.title}
                              onChange={(e) => handleUpdateNodeField(nIdx, "title", e.target.value)}
                              placeholder="Stage name"
                              className="flex-1 bg-transparent text-[13px] text-white font-medium placeholder-[#475569] focus:outline-none"
                            />

                            {/* Controls — visible on hover */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <select
                                value={node.nodeType}
                                onChange={(e) => handleUpdateNodeField(nIdx, "nodeType", e.target.value)}
                                className="bg-[#111827] border border-[#1E293B] rounded-md px-2 py-1 text-[10px] text-[#94A3B8] focus:outline-none"
                              >
                                <option value="MONITOR_STREAM">Monitor</option>
                                <option value="CONDITIONAL_BRANCH">Branch</option>
                                <option value="EXECUTE_ACTION">Execute</option>
                                <option value="A2A_DELEGATION">Delegate</option>
                                <option value="NOTIFICATION">Notify</option>
                              </select>

                              {nodes.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveNode(nIdx)}
                                  className="p-1 rounded-md text-[#64748B] hover:text-[#F87171] hover:bg-[#F87171]/10 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Tool selector */}
                          <select
                            value={node.tool}
                            onChange={(e) => handleToolChange(nIdx, e.target.value)}
                            className="w-full bg-[#111827] border border-[#1E293B] rounded-md px-2.5 py-1.5 text-[11px] text-[#94A3B8] focus:outline-none focus:border-[#818CF8]"
                          >
                            {ADVANCED_AGENT_TOOL_REGISTRY.map((cat, cIdx) => (
                              <optgroup key={cIdx} label={cat.category}>
                                {cat.tools.map((t) => (
                                  <option key={t.id} value={t.id}>
                                    {t.name}
                                  </option>
                                ))}
                              </optgroup>
                            ))}
                          </select>

                          {/* Parameters */}
                          <textarea
                            rows={1}
                            value={typeof node.params === "string" ? node.params : JSON.stringify(node.params)}
                            onChange={(e) => handleUpdateNodeField(nIdx, "params", e.target.value)}
                            placeholder="{}"
                            className="w-full bg-[#0A0E17] border border-[#1E293B] rounded-md px-2.5 py-2 text-[11px] text-[#94A3B8] font-data focus:outline-none focus:border-[#818CF8] resize-none"
                          />
                        </div>
                      </div>

                      {/* Connector line between stages */}
                      {nIdx < nodes.length - 1 && (
                        <div className="flex justify-center py-1">
                          <div className="w-px h-4 bg-[#1E293B]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ─── Footer actions ─── */}
            <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-[#1E293B]">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-3.5 py-2 rounded-lg text-[12.5px] text-[#94A3B8] hover:text-white hover:bg-white/[0.04] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#818CF8] hover:bg-[#6366F1] text-white text-[12.5px] font-medium transition-colors"
              >
                Deploy pipeline
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── PIPELINE LIST ─── */}
      {pipelines.length > 0 && (
        <div className="space-y-2">
          <span className="text-[12px] text-[#64748B] font-medium block">
            Active pipelines <span className="tabular-nums">· {pipelines.length}</span>
          </span>

          <div className="rounded-xl bg-[#111827] border border-[#1E293B] divide-y divide-[#1E293B] overflow-hidden">
            {pipelines.map((pipe) => {
              const activeDaemon = activeDaemons.find(d => d.agentId === pipe.id);
              const isRunning = !!activeDaemon;

              return (
                <div key={pipe.id} className="px-5 py-4 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: pipeline info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5 mb-1">
                        <h4 className="text-[13px] font-semibold text-white truncate">{pipe.name}</h4>
                        {isRunning && (
                          <span className="flex items-center gap-1 text-[10px] text-[#34D399] font-medium shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse" />
                            Running
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-[#64748B]">
                        <span>{pipe.cliEngine}</span>
                        <span>·</span>
                        <span>{pipe.model}</span>
                        <span>·</span>
                        <span>{pipe.nodes?.length || 0} stages</span>
                        {pipe.cronInterval && (
                          <>
                            <span>·</span>
                            <span>every {pipe.cronInterval}s</span>
                          </>
                        )}
                      </div>

                      {/* Stage summary — compact inline list */}
                      {pipe.nodes && pipe.nodes.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {pipe.nodes.map((n, nIdx) => {
                            const accent = NODE_TYPE_ACCENTS[n.nodeType] || "#818CF8";
                            return (
                              <span
                                key={nIdx}
                                className="text-[10px] px-2 py-0.5 rounded font-medium"
                                style={{ color: accent, backgroundColor: accent + "15" }}
                              >
                                {n.title || NODE_TYPE_LABELS[n.nodeType] || "Stage"}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Right: actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        disabled={isDiagnosing}
                        onClick={() => handleRunQAVerifier(pipe)}
                        className="px-2.5 py-1.5 rounded-md text-[11px] text-[#94A3B8] hover:text-white hover:bg-white/[0.06] transition-colors font-medium"
                      >
                        {isDiagnosing ? "Verifying..." : "Verify"}
                      </button>

                      <button
                        onClick={() => handleEditPipeline(pipe)}
                        className="px-2.5 py-1.5 rounded-md text-[11px] text-[#94A3B8] hover:text-white hover:bg-white/[0.06] transition-colors font-medium"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => onExecuteGoal({
                          agentId: pipe.id,
                          userGoal: `Execute ${pipe.name}`,
                          spendLimitUsd: pipe.spendCeilingUsd
                        })}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-[#818CF8] hover:bg-[#6366F1] text-white text-[11px] font-medium transition-colors"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        Run
                      </button>

                      <button
                        onClick={() => handleToggle24x7(pipe)}
                        className={`px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                          isRunning
                            ? "text-[#F87171] hover:bg-[#F87171]/10"
                            : "text-[#94A3B8] hover:text-white hover:bg-white/[0.06]"
                        }`}
                      >
                        {isRunning ? "Stop" : "Loop"}
                      </button>

                      <button
                        onClick={() => handleDeletePipeline(pipe.id)}
                        className="p-1.5 rounded-md text-[#64748B] hover:text-[#F87171] hover:bg-[#F87171]/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
