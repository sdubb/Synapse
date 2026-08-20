import React, { useState, useEffect } from "react";
import {
  Plus, Trash2, Play, Send, Undo2, Check, Activity,
  ChevronDown, X, Shield, ArrowDown, ArrowUp, Copy, BookOpen,
  Terminal, AlertTriangle, CheckCircle2, ShieldAlert, Sparkles,
  RefreshCw, RotateCcw, Clock, Layers
} from "lucide-react";
import { ADVANCED_AGENT_TOOL_REGISTRY } from "../../../server/src/templates/advancedTools.js";
import { generateDynamicPipelineSkill } from "../../../server/src/templates/dynamicPromptGenerator.js";

const API_BASE = "http://localhost:4000/api/v1";

// Node type visual labels
const NODE_TYPE_LABELS = {
  MONITOR_STREAM: "Monitor Stream",
  CONDITIONAL_BRANCH: "Conditional Branch",
  EXECUTE_ACTION: "Action Execution",
  A2A_DELEGATION: "A2A Delegation",
  NOTIFICATION: "2FA Notification"
};

// Structural left-border accent per node type
const NODE_TYPE_ACCENTS = {
  MONITOR_STREAM: "#818CF8",      // Iris — Observation / Stream
  CONDITIONAL_BRANCH: "#FB923C",  // Thermal — Risk Gate / Condition
  EXECUTE_ACTION: "#F87171",      // Danger / Red — Mutation / Execution
  A2A_DELEGATION: "#38BDF8",      // Sky — Agent-to-Agent Delegation
  NOTIFICATION: "#34D399"         // Verified / Green — 2FA & Notification
};

// Curated Enterprise Blueprint Starters (Optional 1-Click Scaffolding)
const STARTER_BLUEPRINTS = [
  {
    id: "blueprint_crypto_arb",
    name: "BTC/USDT Arbitrage & VaR Risk Rebalancer",
    domain: "Quant Trading & Market Execution",
    cliEngine: "aider",
    model: "deepseek-r1:70b",
    spendCeilingUsd: 5000,
    hitlThresholdUsd: 1000,
    cronInterval: 10,
    nodes: [
      {
        id: "node_1",
        nodeType: "MONITOR_STREAM",
        title: "Stream L2/L3 Orderbook & Volatility Anomaly",
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
        condition: "IF_SPREAD_GT_0_5_PCT",
        retryCount: 2,
        fallbackAction: "HALT_PIPELINE",
        postcondition: { verifier: "external_endpoint_status", params: { endpoint: "http://localhost:4000/api/v1/stats" } },
        params: '{"minSpreadBps": 50, "maxDrawdownPct": 2.0, "targetSharpe": 2.1}'
      },
      {
        id: "node_3",
        nodeType: "EXECUTE_ACTION",
        title: "Execute Algorithmic Limit Arbitrage Order",
        tool: "execute_limit_market_order",
        condition: "IF_PROFITABLE_AND_APPROVED",
        retryCount: 1,
        fallbackAction: "TRIGGER_2FA_APPROVAL",
        postcondition: { verifier: "idempotency_key_active", params: { idempotencyKey: "idem_btc_arb_01" } },
        params: '{"symbol": "BTC/USDT", "action": "BUY", "quantity": 0.5, "orderType": "LIMIT", "maxSlippageBps": 10}'
      },
      {
        id: "node_4",
        nodeType: "NOTIFICATION",
        title: "Dispatch 2FA Execution Summary to Slack",
        tool: "slack_enterprise_block_kit",
        condition: "ON_SUCCESS",
        retryCount: 3,
        fallbackAction: "LOG_ONLY",
        postcondition: { verifier: "external_endpoint_status", params: { endpoint: "http://localhost:4000/api/v1/stats" } },
        params: '{"channel": "#quant-trading-desk", "allowInline2Fa": true}'
      }
    ]
  },
  {
    id: "blueprint_k8s_healer",
    name: "Kubernetes Zero-Downtime Cluster Auto-Healer",
    domain: "Cloud Infrastructure & SRE",
    cliEngine: "aider",
    model: "deepseek-r1:70b",
    spendCeilingUsd: 3000,
    hitlThresholdUsd: 500,
    cronInterval: 15,
    nodes: [
      {
        id: "node_1",
        nodeType: "MONITOR_STREAM",
        title: "Poll APM Telemetry & Memory Leak Anomaly",
        tool: "log_stream_anomaly_detector",
        condition: "ALWAYS_EXECUTE",
        retryCount: 3,
        fallbackAction: "ALERT_ON_CALL",
        postcondition: { verifier: "external_endpoint_status", params: { endpoint: "http://localhost:4000/api/v1/stats" } },
        params: '{"cluster": "prod-us-east-1", "service": "checkout-api", "errorRateThreshold": 0.05}'
      },
      {
        id: "node_2",
        nodeType: "CONDITIONAL_BRANCH",
        title: "Check Pod CrashLoopBackOff & SLA Risk",
        tool: "cloudwatch_datadog_alarm_poll",
        condition: "IF_METRIC_BREACH",
        retryCount: 2,
        fallbackAction: "HALT_PIPELINE",
        postcondition: { verifier: "external_endpoint_status", params: { endpoint: "http://localhost:4000/api/v1/stats" } },
        params: '{"maxUnhealthyPods": 2, "drainTimeoutSeconds": 60}'
      },
      {
        id: "node_3",
        nodeType: "EXECUTE_ACTION",
        title: "Execute Surgical Canary Drain & Safe Pod Restart",
        tool: "k8s_cluster_drain_restart",
        condition: "IF_AUTO_REPAIR_ENABLED",
        retryCount: 1,
        fallbackAction: "TRIGGER_2FA_APPROVAL",
        postcondition: { verifier: "idempotency_key_active", params: { idempotencyKey: "idem_k8s_drain_01" } },
        params: '{"namespace": "production", "deployment": "checkout-api", "gracePeriodSeconds": 30}'
      }
    ]
  },
  {
    id: "blueprint_crm_sap_sync",
    name: "Salesforce Opportunity to SAP S/4HANA Revenue Reconciliation",
    domain: "Enterprise Finance & Revenue Ops",
    cliEngine: "goose",
    model: "claude-3-7-sonnet",
    spendCeilingUsd: 10000,
    hitlThresholdUsd: 2500,
    cronInterval: 60,
    nodes: [
      {
        id: "node_1",
        nodeType: "MONITOR_STREAM",
        title: "Ingest Closed-Won Salesforce Opportunities",
        tool: "salesforce_enterprise_sync",
        condition: "ALWAYS_EXECUTE",
        retryCount: 3,
        fallbackAction: "ALERT_ON_CALL",
        postcondition: { verifier: "db_row_exists", params: { agentId: "agent-sales-ae" } },
        params: '{"stage": "Closed Won", "currency": "USD", "minDealSize": 50000}'
      },
      {
        id: "node_2",
        nodeType: "EXECUTE_ACTION",
        title: "Post Journal Entry & Reconcile SAP ERP Ledger",
        tool: "sap_erp_ledger_reconcile",
        condition: "ON_NEW_RECORDS",
        retryCount: 1,
        fallbackAction: "TRIGGER_2FA_APPROVAL",
        postcondition: { verifier: "idempotency_key_active", params: { idempotencyKey: "idem_sap_rev_01" } },
        params: '{"companyCode": "1000", "ledgerGroup": "0L", "autoPost": true}'
      }
    ]
  }
];

export function MasterPipelineStudio({ onExecuteGoal }) {
  const [pipelines, setPipelines] = useState([]);
  const [activeDaemons, setActiveDaemons] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showBlueprintsModal, setShowBlueprintsModal] = useState(false);

  // ✦ AI Architect State
  const [userPromptIntent, setUserPromptIntent] = useState("");
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [aiNotice, setAiNotice] = useState(null);
  const [previousRevision, setPreviousRevision] = useState(null);

  // QA Verifier Diagnosis Modal State
  const [qaDiagnosis, setQaDiagnosis] = useState(null);
  const [diagnosingPipeId, setDiagnosingPipeId] = useState(null);

  // Live Real-Time Execution Console Drawer State
  const [activeExecution, setActiveExecution] = useState(null);
  const [executionSteps, setExecutionSteps] = useState([]);

  // Form State (Starts Clean / Empty on New Pipeline)
  const [pipelineName, setPipelineName] = useState("");
  const [domain, setDomain] = useState("Enterprise Automation");
  const [selectedCli, setSelectedCli] = useState("aider");
  const [selectedModel, setSelectedModel] = useState("deepseek-r1:70b");
  const [cronInterval, setCronInterval] = useState(10);
  const [spendCeilingUsd, setSpendCeilingUsd] = useState(2500);
  const [hitlThresholdUsd, setHitlThresholdUsd] = useState(500);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [nodes, setNodes] = useState([]);
  const [showPrompt, setShowPrompt] = useState(false);
  const [validationError, setValidationError] = useState(null);

  const allTools = ADVANCED_AGENT_TOOL_REGISTRY.flatMap(cat => cat.tools);

  // Auto-synthesize behavioral prompt when DAG changes
  useEffect(() => {
    if (!isSynthesizing && isCreating && nodes.length > 0) {
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
  }, [nodes, pipelineName, domain, selectedCli, selectedModel, spendCeilingUsd, hitlThresholdUsd, isSynthesizing, isCreating]);

  // Fetch real pipelines & active daemons from SQLite Backend
  const fetchPipelines = async () => {
    try {
      const res = await fetch(`${API_BASE}/pipelines`).then(r => r.json());
      if (res.pipelines) setPipelines(res.pipelines);
    } catch (e) {
      console.error("Fetch pipelines error:", e);
    }
  };

  const fetchDaemons = async () => {
    try {
      const res = await fetch(`${API_BASE}/daemons`).then(r => r.json());
      if (res.daemons) setActiveDaemons(res.daemons);
    } catch (e) {
      console.error("Fetch daemons error:", e);
    }
  };

  useEffect(() => {
    fetchPipelines();
    fetchDaemons();
  }, []);

  // WebSocket Live Synchronization for Daemons & Pipeline Executions
  useEffect(() => {
    let ws;
    try {
      ws = new WebSocket("ws://localhost:4000");
      ws.onmessage = (evt) => {
        try {
          const payload = JSON.parse(evt.data);
          if (["NODE_CREATED", "NODE_UPDATED", "NODE_DELETED", "PIPELINE_COMMITTED", "PIPELINE_ROLLED_BACK"].includes(payload.type)) {
            fetchPipelines();
          } else if (payload.type === "DAEMON_CYCLE_STARTED" || payload.type === "DAEMON_CYCLE_COMPLETED") {
            fetchDaemons();
          } else if (payload.type === "TRANSACTION_STARTED") {
            if (activeExecution) {
              setExecutionSteps([{
                stepNumber: 0,
                title: "Pipeline Transaction Initialized",
                status: "IN_PROGRESS",
                toolName: "SYSTEM_INIT",
                time: new Date().toLocaleTimeString()
              }]);
            }
          } else if (payload.type === "PIPELINE_STEP") {
            setExecutionSteps(prev => [...prev, {
              ...payload.data,
              time: new Date().toLocaleTimeString()
            }]);
          } else if (payload.type === "TRANSACTION_COMMITTED" || payload.type === "TRANSACTION_ROLLED_BACK") {
            setExecutionSteps(prev => [...prev, {
              stepNumber: prev.length + 1,
              title: payload.type === "TRANSACTION_COMMITTED" ? "Pipeline Execution Succeeded" : "Pipeline Halted / Rolled Back",
              status: payload.type === "TRANSACTION_COMMITTED" ? "COMMITTED" : "ROLLED_BACK",
              toolName: "FINAL_VERDICT",
              time: new Date().toLocaleTimeString()
            }]);
          }
        } catch (e) {}
      };
    } catch (e) {}
    return () => { if (ws) ws.close(); };
  }, [activeExecution]);

  // Start Blank Pipeline
  const handleStartBlankPipeline = () => {
    setEditingId(null);
    setPipelineName("");
    setDomain("General Automation");
    setSelectedCli("aider");
    setSelectedModel("deepseek-r1:70b");
    setCronInterval(10);
    setSpendCeilingUsd(2500);
    setHitlThresholdUsd(500);
    setSystemPrompt("");
    setValidationError(null);
    setAiNotice(null);
    setNodes([
      {
        id: "node_1",
        nodeType: "MONITOR_STREAM",
        title: "Initial Observation Step",
        tool: "market_data_orderbook_stream",
        condition: "ALWAYS_EXECUTE",
        retryCount: 3,
        fallbackAction: "ALERT_ON_CALL",
        postcondition: { verifier: "external_endpoint_status", params: { endpoint: "http://localhost:4000/api/v1/stats" } },
        params: '{"pair": "BTC/USDT", "depth": 50}'
      }
    ]);
    setIsCreating(true);
    setShowBlueprintsModal(false);
  };

  // Load Starter Blueprint into Editor
  const handleLoadBlueprint = (blueprint) => {
    setEditingId(null);
    setPipelineName(blueprint.name);
    setDomain(blueprint.domain);
    setSelectedCli(blueprint.cliEngine);
    setSelectedModel(blueprint.model);
    setCronInterval(blueprint.cronInterval);
    setSpendCeilingUsd(blueprint.spendCeilingUsd);
    setHitlThresholdUsd(blueprint.hitlThresholdUsd);
    setNodes(blueprint.nodes);
    setValidationError(null);
    setAiNotice(`Loaded template: ${blueprint.name}`);
    setIsCreating(true);
    setShowBlueprintsModal(false);
  };

  // ✦ AI Architect Directive (Synthesize or modify DAG via MCP)
  const handleRunArchitect = async (e) => {
    if (e) e.preventDefault();
    if (!userPromptIntent.trim()) return;

    setIsSynthesizing(true);
    setAiNotice(null);
    setValidationError(null);

    try {
      const res = await fetch(`${API_BASE}/pipeline/architect/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userPrompt: userPromptIntent,
          pipelineId: editingId,
          activePipeline: {
            id: editingId || "pipe_active_studio",
            name: pipelineName || "Synthesized Pipeline",
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

      // Save previous state for 1-click Undo
      setPreviousRevision({
        pipelineName,
        domain,
        spendCeilingUsd,
        hitlThresholdUsd,
        cronInterval,
        nodes: [...nodes],
        systemPrompt
      });

      if (res.pipeline) {
        setPipelineName(res.pipeline.name || pipelineName || "Custom AI Workflow");
        setDomain(res.pipeline.domain || domain);
        setSpendCeilingUsd(res.pipeline.spendCeilingUsd || spendCeilingUsd);
        setHitlThresholdUsd(res.pipeline.hitlThresholdUsd || hitlThresholdUsd);
        setCronInterval(res.pipeline.cronInterval || cronInterval);
        setNodes(res.pipeline.nodes || nodes);
        if (res.pipeline.systemPrompt) setSystemPrompt(res.pipeline.systemPrompt);
      }

      setAiNotice(res.message || "Pipeline successfully synthesized by AI Architect.");
      setUserPromptIntent("");
      setIsCreating(true);
    } catch (err) {
      alert("AI Architect Error: " + err.message);
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
    setAiNotice("Reverted to previous revision.");
  };

  // Node Mutations
  const handleAddNode = () => {
    const nextIdx = nodes.length + 1;
    setNodes([
      ...nodes,
      {
        id: "node_" + nextIdx,
        nodeType: "EXECUTE_ACTION",
        title: `Step ${nextIdx}`,
        tool: "market_data_orderbook_stream",
        condition: "ON_SUCCESS",
        retryCount: 2,
        fallbackAction: "ALERT_ON_CALL",
        postcondition: { verifier: "db_row_exists", params: { agentId: "agent-quant-trader" } },
        params: '{"pair": "BTC/USDT"}'
      }
    ]);
  };

  const handleDuplicateNode = (idx) => {
    const source = nodes[idx];
    const next = [...nodes];
    next.splice(idx + 1, 0, {
      ...source,
      id: "node_" + Date.now(),
      title: `${source.title} (Copy)`
    });
    setNodes(next);
  };

  const handleMoveNode = (idx, direction) => {
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= nodes.length) return;
    const next = [...nodes];
    const temp = next[idx];
    next[idx] = next[targetIdx];
    next[targetIdx] = temp;
    setNodes(next);
  };

  const handleRemoveNode = (idx) => {
    setNodes(nodes.filter((_, i) => i !== idx));
  };

  const handleToolChange = (idx, toolId) => {
    const selectedTool = allTools.find(t => t.id === toolId);
    const next = [...nodes];
    next[idx].tool = toolId;
    if (selectedTool) {
      if (!next[idx].title || next[idx].title.startsWith("Step")) {
        next[idx].title = selectedTool.name;
      }
      next[idx].params = selectedTool.defaultParams;
    }
    setNodes(next);
  };

  const handleUpdateNodeField = (idx, field, value) => {
    const next = [...nodes];
    next[idx][field] = value;
    setNodes(next);
  };

  // Preflight Validation & Deploy to SQLite
  const handleSavePipeline = async (e) => {
    if (e) e.preventDefault();
    setValidationError(null);

    if (!pipelineName.trim()) {
      setValidationError("Pipeline Name is required.");
      return;
    }
    if (nodes.length === 0) {
      setValidationError("At least one stage is required in the pipeline.");
      return;
    }
    if (Number(hitlThresholdUsd) > Number(spendCeilingUsd)) {
      setValidationError(`Human 2FA Threshold ($${hitlThresholdUsd}) cannot exceed Hard Spend Ceiling ($${spendCeilingUsd}).`);
      return;
    }

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
        body: JSON.stringify({ reason: "Saved from Studio UI", committedBy: "Operator" })
      });

      fetchPipelines();
      setIsCreating(false);
      setEditingId(null);
      setAiNotice(null);
    } catch (err) {
      setValidationError("Save Error: " + err.message);
    }
  };

  // Edit Existing Pipeline
  const handleEditPipeline = (pipe) => {
    setEditingId(pipe.id);
    setPipelineName(pipe.name);
    setDomain(pipe.domain || "Enterprise Automation");
    setSelectedCli(pipe.cliEngine?.toLowerCase().includes("goose") ? "goose" : pipe.cliEngine?.toLowerCase().includes("agy") ? "agy" : "aider");
    setSelectedModel(pipe.model || "deepseek-r1:70b");
    setCronInterval(pipe.cronInterval || 10);
    setSpendCeilingUsd(pipe.spendCeilingUsd || 2500);
    setHitlThresholdUsd(pipe.hitlThresholdUsd || 500);
    setSystemPrompt(pipe.systemPrompt || "");
    setNodes(pipe.nodes || []);
    setValidationError(null);
    setAiNotice(null);
    setIsCreating(true);
  };

  // Delete Pipeline
  const handleDeletePipeline = async (id) => {
    if (!confirm("Are you sure you want to delete this pipeline?")) return;
    await fetch(`${API_BASE}/pipelines/${id}`, { method: "DELETE" });
    if (editingId === id) setIsCreating(false);
    fetchPipelines();
  };

  // Toggle 24/7 Background Daemon
  const handleToggle24x7 = async (pipe) => {
    const isRunning = activeDaemons.some(d => d.agentId === pipe.id);
    if (isRunning) {
      await fetch(`${API_BASE}/daemons/${pipe.id}/stop`, { method: "POST" });
    } else {
      await fetch(`${API_BASE}/daemons/${pipe.id}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intervalSeconds: pipe.cronInterval || 10, goal: `Autonomous execution for ${pipe.name}` })
      });
    }
    fetchDaemons();
  };

  // Execute Pipeline (Opens Live Console)
  const handleRunPipeline = async (pipe) => {
    setActiveExecution({
      pipelineId: pipe.id,
      name: pipe.name,
      startedAt: new Date().toLocaleTimeString()
    });
    setExecutionSteps([
      {
        stepNumber: 1,
        title: "Preflight OPA Governance & Verification Check",
        toolName: "preflight_safety_check",
        status: "IN_PROGRESS",
        thought: `Evaluating spend ceiling ($${pipe.spendCeilingUsd}) and tool confinement...`,
        time: new Date().toLocaleTimeString()
      }
    ]);

    try {
      await fetch(`${API_BASE}/pipeline/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: pipe.id,
          userGoal: `Execute Pipeline: ${pipe.name}`,
          spendLimitUsd: pipe.spendCeilingUsd
        })
      });
    } catch (e) {
      alert("Execution trigger error: " + e.message);
    }
  };

  // Run QA Verifier Diagnosis Modal
  const handleRunQAVerifier = async (pipe) => {
    setDiagnosingPipeId(pipe.id);
    try {
      const res = await fetch(`${API_BASE}/verification/workflow/diagnose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pipelineId: pipe.id,
          nodes: pipe.nodes || [],
          spendCeilingUsd: pipe.spendCeilingUsd
        })
      }).then(r => r.json());

      setQaDiagnosis(res);
    } catch (err) {
      alert("QA Diagnosis Error: " + err.message);
    } finally {
      setDiagnosingPipeId(null);
    }
  };

  return (
    <div className="space-y-6">

      {/* ─── TOP HEADER & ACTIONS ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold text-white tracking-tight flex items-center gap-2">
            <span>Pipeline Studio</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#818CF8]/10 text-[#818CF8] font-mono border border-[#818CF8]/20">
              Deterministic Trajectories
            </span>
          </h2>
          <p className="text-[12.5px] text-[#64748B] mt-0.5">
            Construct, verify, and govern autonomous AI pipelines via natural language or visual stage cards.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowBlueprintsModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[#94A3B8] hover:text-white text-[12px] font-medium border border-[#1E293B] transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#818CF8]" />
            <span>Blueprints</span>
          </button>

          <button
            onClick={handleStartBlankPipeline}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#818CF8] hover:bg-[#6366F1] text-white text-[12.5px] font-medium transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New pipeline</span>
          </button>
        </div>
      </div>

      {/* ─── AI ARCHITECT BAR ─── */}
      <div className="rounded-xl bg-[#111827] border border-[#1E293B] p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11.5px] text-[#818CF8] font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Pipeline Architect</span>
          </span>
          {previousRevision && (
            <button
              type="button"
              onClick={handleUndoAiRevision}
              className="flex items-center gap-1 text-[11px] text-[#94A3B8] hover:text-white transition-colors"
            >
              <Undo2 className="w-3 h-3" />
              <span>Undo changes</span>
            </button>
          )}
        </div>

        <form onSubmit={handleRunArchitect} className="flex gap-2">
          <input
            type="text"
            value={userPromptIntent}
            onChange={(e) => setUserPromptIntent(e.target.value)}
            placeholder='e.g. "Monitor BTC orderbook, check VaR risk, execute limit buy if spread > 0.5%, then verify settlement in SAP"'
            className="flex-1 bg-[#0D1220] border border-[#1E293B] focus:border-[#818CF8] rounded-lg px-3.5 py-2 text-[12.5px] text-[#E2E8F0] placeholder-[#475569] focus:outline-none transition-colors"
          />

          <button
            type="submit"
            disabled={isSynthesizing || !userPromptIntent.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#818CF8] hover:bg-[#6366F1] text-white text-[12px] font-medium transition-colors disabled:opacity-40 shrink-0"
          >
            <Send className="w-3 h-3" />
            <span>{isSynthesizing ? "Synthesizing..." : "Generate"}</span>
          </button>
        </form>

        {aiNotice && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#34D399]/8 border border-[#34D399]/20 text-[#34D399] text-[11.5px]">
            <Check className="w-3.5 h-3.5 shrink-0" />
            <span>{aiNotice}</span>
          </div>
        )}
      </div>

      {/* ─── PIPELINE EDITOR (VISUAL STAGE CANVAS) ─── */}
      {isCreating && (
        <div className="rounded-xl bg-[#111827] border border-[#1E293B] overflow-hidden space-y-0 animate-in fade-in">
          {/* Editor Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1E293B] bg-[#0D1220]/60">
            <div>
              <h3 className="text-[13px] font-semibold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#818CF8]" />
                <span>{editingId ? "Edit Pipeline Architecture" : "Design Custom Pipeline"}</span>
              </h3>
              <span className="text-[11px] text-[#64748B]">
                {editingId ? `Modifying revision for ID: ${editingId}` : "Staged in-memory draft before production commit"}
              </span>
            </div>

            <button
              onClick={() => setIsCreating(false)}
              className="p-1.5 rounded-md text-[#64748B] hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSavePipeline}>
            {/* Validation Banner */}
            {validationError && (
              <div className="mx-5 mt-4 p-3 rounded-lg bg-[#F87171]/10 border border-[#F87171]/30 text-[#F87171] text-[12px] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Row 1: Pipeline Parameters */}
            <div className="px-5 py-4 space-y-4 border-b border-[#1E293B]">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="text-[11px] text-[#64748B] font-medium block mb-1.5">Pipeline Name</label>
                  <input
                    type="text"
                    value={pipelineName}
                    onChange={(e) => setPipelineName(e.target.value)}
                    placeholder="e.g. Real-Time Arbitrage & Risk Rebalancer"
                    required
                    className="w-full bg-[#0D1220] border border-[#1E293B] focus:border-[#818CF8] rounded-lg px-3 py-2 text-[12.5px] text-[#E2E8F0] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-[#64748B] font-medium block mb-1.5">Domain / Category</label>
                  <input
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="e.g. Quant Trading / SRE"
                    className="w-full bg-[#0D1220] border border-[#1E293B] focus:border-[#818CF8] rounded-lg px-3 py-2 text-[12.5px] text-[#E2E8F0] focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 2: Harness & Governance */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] text-[#64748B] font-medium block mb-1.5">CLI Harness</label>
                  <select
                    value={selectedCli}
                    onChange={(e) => setSelectedCli(e.target.value)}
                    className="w-full bg-[#0D1220] border border-[#1E293B] rounded-lg px-3 py-2 text-[12px] text-[#E2E8F0] focus:outline-none focus:border-[#818CF8]"
                  >
                    <option value="aider">Aider (Git-Native Pair CLI)</option>
                    <option value="goose">Goose (Block MCP)</option>
                    <option value="openhands">OpenHands (Autonomous)</option>
                    <option value="agy">Google Antigravity (agy)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-[#64748B] font-medium block mb-1.5">Reasoning Model</label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full bg-[#0D1220] border border-[#1E293B] rounded-lg px-3 py-2 text-[12px] text-[#E2E8F0] focus:outline-none focus:border-[#818CF8]"
                  >
                    <option value="deepseek-r1:70b">DeepSeek-R1 70B</option>
                    <option value="llama3.3:70b">Llama 3.3 70B</option>
                    <option value="qwen2.5-coder:32b">Qwen 2.5 Coder 32B</option>
                    <option value="gpt-4o">OpenAI GPT-4o</option>
                    <option value="claude-3-7-sonnet">Claude 3.7 Sonnet</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-[#64748B] font-medium block mb-1.5">Hard Spend Limit ($ USD)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-[#64748B]">$</span>
                    <input
                      type="number"
                      value={spendCeilingUsd}
                      onChange={(e) => setSpendCeilingUsd(Number(e.target.value))}
                      className="w-full bg-[#0D1220] border border-[#1E293B] rounded-lg pl-7 pr-3 py-2 text-[12px] text-[#34D399] font-medium focus:outline-none focus:border-[#818CF8] tabular-nums"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-[#64748B] font-medium block mb-1.5">2FA Threshold ($ USD)</label>
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

              {/* Collapsible Dynamic Prompt */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowPrompt(!showPrompt)}
                  className="flex items-center gap-1.5 text-[11px] text-[#64748B] hover:text-[#94A3B8] transition-colors"
                >
                  <ChevronDown className={`w-3 h-3 transition-transform ${showPrompt ? "rotate-180" : ""}`} />
                  <span>Auto-Synthesized Behavioral Skill Prompt</span>
                  <span className="text-[#34D399] text-[10px]">· Live Updates</span>
                </button>
                {showPrompt && (
                  <textarea
                    rows={5}
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    className="w-full mt-2 bg-[#0A0E17] border border-[#1E293B] rounded-lg p-3 text-[11px] text-[#94A3B8] font-mono leading-relaxed focus:outline-none focus:border-[#818CF8] resize-y"
                  />
                )}
              </div>
            </div>

            {/* ─── STAGE CARDS RAIL ─── */}
            <div className="px-5 py-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#94A3B8] font-medium">
                  Execution Stages <span className="text-[#64748B]">· {nodes.length} Stages Configured</span>
                </span>
                <button
                  type="button"
                  onClick={handleAddNode}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#818CF8]/10 hover:bg-[#818CF8]/20 text-[#818CF8] text-[11.5px] font-medium border border-[#818CF8]/30 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add stage</span>
                </button>
              </div>

              {nodes.length === 0 ? (
                <div className="p-8 rounded-lg bg-[#0D1220] border border-dashed border-[#1E293B] text-center space-y-2">
                  <p className="text-[12px] text-[#64748B]">No stages added yet.</p>
                  <button
                    type="button"
                    onClick={handleAddNode}
                    className="text-[12px] text-[#818CF8] hover:underline font-medium"
                  >
                    + Add your first execution stage
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {nodes.map((node, nIdx) => {
                    const accent = NODE_TYPE_ACCENTS[node.nodeType] || "#818CF8";

                    return (
                      <div key={nIdx} className="space-y-2">
                        <div
                          className="rounded-xl bg-[#0D1220] hover:bg-[#0F1525] border border-[#1E293B] overflow-hidden transition-all shadow-sm group"
                          style={{ borderLeft: `4px solid ${accent}` }}
                        >
                          <div className="p-4 space-y-3">
                            {/* Card Top Line */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                              <div className="flex items-center gap-2 flex-1">
                                <span className="w-6 h-6 rounded-md bg-white/[0.04] border border-[#1E293B] text-white text-[11px] font-mono flex items-center justify-center font-bold shrink-0">
                                  {nIdx + 1}
                                </span>

                                <input
                                  type="text"
                                  value={node.title}
                                  onChange={(e) => handleUpdateNodeField(nIdx, "title", e.target.value)}
                                  placeholder="Stage Name"
                                  className="flex-1 bg-transparent text-[13px] text-white font-medium placeholder-[#475569] focus:outline-none"
                                />
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <select
                                  value={node.nodeType}
                                  onChange={(e) => handleUpdateNodeField(nIdx, "nodeType", e.target.value)}
                                  className="bg-[#111827] border border-[#1E293B] rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-[#E2E8F0] focus:outline-none"
                                >
                                  <option value="MONITOR_STREAM">Monitor Stream</option>
                                  <option value="CONDITIONAL_BRANCH">Conditional Branch</option>
                                  <option value="EXECUTE_ACTION">Action Execution</option>
                                  <option value="A2A_DELEGATION">A2A Delegation</option>
                                  <option value="NOTIFICATION">2FA Notification</option>
                                </select>

                                <button
                                  type="button"
                                  disabled={nIdx === 0}
                                  onClick={() => handleMoveNode(nIdx, -1)}
                                  className="p-1.5 rounded-md text-[#64748B] hover:text-white hover:bg-white/[0.06] disabled:opacity-20 transition-colors"
                                  title="Move Up"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  disabled={nIdx === nodes.length - 1}
                                  onClick={() => handleMoveNode(nIdx, 1)}
                                  className="p-1.5 rounded-md text-[#64748B] hover:text-white hover:bg-white/[0.06] disabled:opacity-20 transition-colors"
                                  title="Move Down"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDuplicateNode(nIdx)}
                                  className="p-1.5 rounded-md text-[#64748B] hover:text-white hover:bg-white/[0.06] transition-colors"
                                  title="Duplicate Stage"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>

                                {nodes.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveNode(nIdx)}
                                    className="p-1.5 rounded-md text-[#64748B] hover:text-[#F87171] hover:bg-[#F87171]/10 transition-colors"
                                    title="Delete Stage"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Tool Selector */}
                            <div>
                              <select
                                value={node.tool}
                                onChange={(e) => handleToolChange(nIdx, e.target.value)}
                                className="w-full bg-[#111827] border border-[#1E293B] rounded-lg px-3 py-1.5 text-[11.5px] text-[#94A3B8] focus:outline-none focus:border-[#818CF8]"
                              >
                                {ADVANCED_AGENT_TOOL_REGISTRY.map((cat, cIdx) => (
                                  <optgroup key={cIdx} label={cat.category} className="bg-[#0A0D18] text-white">
                                    {cat.tools.map((t) => (
                                      <option key={t.id} value={t.id}>
                                        {t.name} • ({t.provider})
                                      </option>
                                    ))}
                                  </optgroup>
                                ))}
                              </select>
                            </div>

                            {/* JSON Parameters Box */}
                            <div>
                              <textarea
                                rows={2}
                                value={typeof node.params === "string" ? node.params : JSON.stringify(node.params)}
                                onChange={(e) => handleUpdateNodeField(nIdx, "params", e.target.value)}
                                placeholder="JSON Parameters (e.g. {'pair': 'BTC/USDT'})"
                                className="w-full bg-[#0A0E17] border border-[#1E293B] rounded-lg p-2.5 text-[11px] text-[#94A3B8] font-mono focus:outline-none focus:border-[#818CF8] resize-y"
                              />
                            </div>
                          </div>
                        </div>

                        {nIdx < nodes.length - 1 && (
                          <div className="flex justify-center py-0.5">
                            <div className="w-px h-3 bg-[#1E293B]" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 border-t border-[#1E293B] bg-[#0D1220]/60">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 rounded-lg text-[12px] text-[#94A3B8] hover:text-white hover:bg-white/[0.04] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-[#818CF8] hover:bg-[#6366F1] text-white text-[12px] font-medium transition-colors shadow-sm"
              >
                Deploy pipeline
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── ACTIVE PRODUCTION PIPELINES LIST ─── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[12.5px] text-white font-medium">
            Active Production Pipelines <span className="text-[#64748B]">· {pipelines.length}</span>
          </span>
          <button
            onClick={fetchPipelines}
            className="p-1 rounded-md text-[#64748B] hover:text-white transition-colors"
            title="Refresh List"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {pipelines.length === 0 ? (
          <div className="rounded-xl bg-[#111827] border border-dashed border-[#1E293B] p-10 text-center space-y-4">
            <div className="w-10 h-10 rounded-xl bg-[#818CF8]/10 text-[#818CF8] flex items-center justify-center mx-auto border border-[#818CF8]/20">
              <Layers className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-[13.5px] font-semibold text-white">No pipelines deployed yet</h4>
              <p className="text-[12px] text-[#64748B] max-w-md mx-auto">
                Generate an autonomous workflow using the AI prompt bar above, load a pre-configured starter blueprint, or build one manually.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setShowBlueprintsModal(true)}
                className="px-4 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[#94A3B8] hover:text-white text-[12px] font-medium border border-[#1E293B] transition-colors"
              >
                Load a Blueprint
              </button>
              <button
                onClick={handleStartBlankPipeline}
                className="px-4 py-2 rounded-lg bg-[#818CF8] hover:bg-[#6366F1] text-white text-[12px] font-medium transition-colors"
              >
                + Start from scratch
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-[#111827] border border-[#1E293B] divide-y divide-[#1E293B] overflow-hidden">
            {pipelines.map((pipe) => {
              const activeDaemon = activeDaemons.find(d => d.agentId === pipe.id);
              const isRunning = !!activeDaemon;

              return (
                <div key={pipe.id} className="p-4 hover:bg-white/[0.01] transition-colors space-y-3">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    {/* Left: Info */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <h4 className="text-[13px] font-semibold text-white">{pipe.name}</h4>
                        {isRunning ? (
                          <span className="flex items-center gap-1 text-[10.5px] text-[#34D399] font-medium px-2 py-0.5 rounded-full bg-[#34D399]/10 border border-[#34D399]/20 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse" />
                            Looping ({activeDaemon?.runsCount || 0} cycles)
                          </span>
                        ) : (
                          <span className="text-[10.5px] text-[#64748B] font-mono">
                            Interval: {pipe.cronInterval || 10}s
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-[#64748B]">
                        <span>Harness: <strong className="text-[#94A3B8]">{pipe.cliEngine}</strong></span>
                        <span>·</span>
                        <span>Model: <strong className="text-[#94A3B8]">{pipe.model}</strong></span>
                        <span>·</span>
                        <span>Ceiling: <strong className="text-[#34D399]">${pipe.spendCeilingUsd}</strong></span>
                        <span>·</span>
                        <span>2FA: <strong className="text-[#FB923C]">${pipe.hitlThresholdUsd}</strong></span>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        disabled={diagnosingPipeId === pipe.id}
                        onClick={() => handleRunQAVerifier(pipe)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 text-[#818CF8] text-[11.5px] font-medium border border-[#818CF8]/30 transition-colors"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        <span>{diagnosingPipeId === pipe.id ? "Auditing..." : "Verify QA"}</span>
                      </button>

                      <button
                        onClick={() => handleRunPipeline(pipe)}
                        className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-[#818CF8] hover:bg-[#6366F1] text-white text-[11.5px] font-medium transition-colors shadow-sm"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Run</span>
                      </button>

                      <button
                        onClick={() => handleEditPipeline(pipe)}
                        className="px-2.5 py-1.5 rounded-lg text-[11.5px] text-[#94A3B8] hover:text-white hover:bg-white/[0.06] transition-colors"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleToggle24x7(pipe)}
                        className={`px-3 py-1.5 rounded-lg text-[11.5px] font-medium transition-colors border ${
                          isRunning
                            ? "bg-[#F87171]/10 border-[#F87171]/30 text-[#F87171] hover:bg-[#F87171]/20"
                            : "bg-white/[0.04] border-[#1E293B] text-[#94A3B8] hover:text-white hover:bg-white/[0.08]"
                        }`}
                      >
                        {isRunning ? "Stop 24/7" : "24/7 Loop"}
                      </button>

                      <button
                        onClick={() => handleDeletePipeline(pipe.id)}
                        className="p-1.5 rounded-lg text-[#64748B] hover:text-[#F87171] hover:bg-[#F87171]/10 transition-colors"
                        title="Delete Pipeline"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Stage Sequence Chips */}
                  {pipe.nodes && pipe.nodes.length > 0 && (
                    <div className="pt-2 border-t border-[#1E293B]/60 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-[#64748B] mr-1">Stages ({pipe.nodes.length}):</span>
                      {pipe.nodes.map((n, nIdx) => {
                        const accent = NODE_TYPE_ACCENTS[n.nodeType] || "#818CF8";
                        return (
                          <span
                            key={nIdx}
                            className="text-[10.5px] px-2 py-0.5 rounded-md font-medium flex items-center gap-1 border"
                            style={{
                              color: accent,
                              backgroundColor: accent + "12",
                              borderColor: accent + "30"
                            }}
                          >
                            <span className="opacity-60">{nIdx + 1}.</span>
                            <span>{n.title || n.tool}</span>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── LIVE REAL-TIME EXECUTION CONSOLE DRAWER ─── */}
      {activeExecution && (
        <div className="rounded-xl bg-[#0B0F17] border border-[#818CF8]/40 p-4 space-y-3 shadow-2xl animate-in slide-in-from-bottom">
          <div className="flex items-center justify-between border-b border-[#1E293B] pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#34D399] animate-ping" />
              <Terminal className="w-4 h-4 text-[#818CF8]" />
              <h4 className="text-[12.5px] font-semibold text-white">
                Live Execution Console: <span className="text-[#818CF8]">{activeExecution.name}</span>
              </h4>
            </div>

            <button
              onClick={() => setActiveExecution(null)}
              className="p-1 rounded text-[#64748B] hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto font-mono text-[11px] p-2 bg-[#060810] rounded-lg border border-[#1E293B]">
            {executionSteps.map((s, idx) => (
              <div key={idx} className="flex items-start gap-2 text-slate-300">
                <span className="text-[#64748B] shrink-0">[{s.time || "LOG"}]</span>
                <span className="text-[#818CF8] shrink-0 font-bold">{s.toolName || "STEP"}:</span>
                <span className="text-slate-200">{s.title || s.thought || JSON.stringify(s.params || {})}</span>
                {s.status === "COMMITTED" && (
                  <span className="text-[#34D399] font-bold ml-auto">[SUCCESS]</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── QA VERIFIER DIAGNOSIS MODAL ─── */}
      {qaDiagnosis && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-[#111827] border border-[#1E293B] rounded-2xl p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#818CF8]" />
                <h3 className="text-[13px] font-semibold text-white">
                  Ground-Truth QA Verification Report
                </h3>
              </div>
              <button
                onClick={() => setQaDiagnosis(null)}
                className="text-[#64748B] hover:text-white p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5 p-3 rounded-lg bg-[#0D1220] border border-[#1E293B] text-center">
              <div>
                <span className="text-[10px] text-[#64748B] block">Verdict</span>
                <span className={`text-[12px] font-bold ${qaDiagnosis.workflowStatus === "VERIFIED" ? "text-[#34D399]" : "text-[#F87171]"}`}>
                  {qaDiagnosis.workflowStatus}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#64748B] block">Verified Nodes</span>
                <span className="text-[12px] font-bold text-white tabular-nums">
                  {qaDiagnosis.verifiedNodesCount} / {qaDiagnosis.totalNodesCount}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#64748B] block">Confidence</span>
                <span className="text-[12px] font-bold text-[#818CF8] tabular-nums">
                  {Math.round(qaDiagnosis.confidence * 100)}%
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] text-[#64748B] font-medium block">Detailed Audit Trace:</span>
              <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 bg-[#0D1220] rounded-lg border border-[#1E293B]">
                {qaDiagnosis.failures?.length === 0 ? (
                  <div className="p-3 text-center text-[#34D399] text-[11.5px] flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>All stage postconditions & ground-truth contracts verified successfully.</span>
                  </div>
                ) : (
                  qaDiagnosis.failures?.map((f, fIdx) => (
                    <div key={fIdx} className="p-2 rounded bg-[#F87171]/10 border border-[#F87171]/20 text-[11px] text-[#F87171]">
                      <strong>{f.nodeId}:</strong> {f.diagnosis}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setQaDiagnosis(null)}
                className="px-4 py-2 rounded-lg bg-[#818CF8] hover:bg-[#6366F1] text-white text-[12px] font-medium"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── BLUEPRINTS TEMPLATE MODAL ─── */}
      {showBlueprintsModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#111827] border border-[#1E293B] rounded-2xl p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
              <div>
                <h3 className="text-[13px] font-semibold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#818CF8]" />
                  <span>Enterprise Starter Blueprints</span>
                </h3>
                <span className="text-[11px] text-[#64748B]">Select a verified template to load into the visual studio</span>
              </div>
              <button
                onClick={() => setShowBlueprintsModal(false)}
                className="text-[#64748B] hover:text-white p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-96 overflow-y-auto">
              {STARTER_BLUEPRINTS.map((bp) => (
                <div
                  key={bp.id}
                  onClick={() => handleLoadBlueprint(bp)}
                  className="p-4 rounded-xl bg-[#0D1220] hover:bg-[#111827] border border-[#1E293B] hover:border-[#818CF8]/50 transition-all cursor-pointer space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-[13px] font-semibold text-white group-hover:text-[#818CF8] transition-colors">
                      {bp.name}
                    </h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#818CF8]/10 text-[#818CF8] font-medium border border-[#818CF8]/20">
                      {bp.domain}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#64748B]">
                    Harness: {bp.cliEngine} • Model: {bp.model} • Hard Spend: ${bp.spendCeilingUsd} • 2FA: ${bp.hitlThresholdUsd}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {bp.nodes.map((n, i) => (
                      <span key={i} className="text-[9.5px] px-2 py-0.5 rounded bg-white/[0.04] text-slate-300">
                        {i + 1}. {n.title}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
