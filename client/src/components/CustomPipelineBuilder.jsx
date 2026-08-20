import React, { useState, useEffect } from "react";
import {
  Briefcase, Plus, Trash2, Edit3, CheckCircle2, Wrench, Globe,
  Database, Code2, Play, Activity, Sparkles, RefreshCw, X, Shield,
  Layers, Server, Cloud, Cpu, Lock, ArrowDown, ArrowRight, Zap, Check, AlertCircle
} from "lucide-react";
import { FAANG_ENTERPRISE_TOOL_REGISTRY } from "../../../server/src/templates/faangTools.js";

export function CustomPipelineBuilder({ onExecuteGoal }) {
  const [pipelines, setPipelines] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Advanced Visual Pipeline Form State
  const [pipelineName, setPipelineName] = useState("");
  const [department, setDepartment] = useState("Cloud Infrastructure & SRE");
  const [cronInterval, setCronInterval] = useState(30);
  const [spendLimitUsd, setSpendLimitUsd] = useState(2500);
  const [stages, setStages] = useState([
    {
      title: "AWS S3 ACL & WORM Audit",
      tool: "aws_s3_worm_audit",
      params: '{"region": "us-east-1", "bucket": "compliance-vault", "enforceKms": true}'
    }
  ]);

  const allTools = FAANG_ENTERPRISE_TOOL_REGISTRY.flatMap(cat => cat.tools);

  useEffect(() => {
    const saved = localStorage.getItem("synapse_faang_pipelines");
    if (saved) {
      try { setPipelines(JSON.parse(saved)); } catch (e) {}
    } else {
      const defaultPipelines = [
        {
          id: "faang-pipe-01",
          name: "AWS S3 WORM Compliance & Multi-Region Audit",
          department: "Cloud Infrastructure & SRE",
          cronInterval: 15,
          spendLimitUsd: 2500,
          stages: [
            {
              title: "Audit S3 Bucket ACLs & KMS Keys",
              tool: "aws_s3_worm_audit",
              params: '{"region": "us-east-1", "bucket": "enterprise-compliance-vault", "enforceKms": true}'
            },
            {
              title: "Run SonarQube SAST Verification",
              tool: "sonarqube_security_sast_scan",
              params: '{"qualityGate": "FAANG_STRICT", "blockOnNewVulnerabilities": true}'
            },
            {
              title: "Dispatch Interactive Slack Block-Kit Notice",
              tool: "slack_enterprise_block_kit",
              params: '{"channel": "#secops-approvals", "allowInline2Fa": true}'
            }
          ]
        },
        {
          id: "faang-pipe-02",
          name: "Kubernetes Zero-Downtime Rolling Auto-Healer",
          department: "Engineering & SRE",
          cronInterval: 60,
          spendLimitUsd: 3000,
          stages: [
            {
              title: "Poll Istio Mesh & Pod Memory Metrics",
              tool: "k8s_cluster_drain_restart",
              params: '{"cluster": "prod-us-east-1", "namespace": "payments-core"}'
            },
            {
              title: "Rotate Dynamic Database Credentials in Vault",
              tool: "hashicorp_vault_token_rotation",
              params: '{"vaultPath": "database/creds/billing-readonly", "ttl": "15m"}'
            },
            {
              title: "Trigger PagerDuty On-Call Alert",
              tool: "datadog_pagerduty_sentry_alert",
              params: '{"severity": "SEV-1", "service": "payments-gateway"}'
            }
          ]
        },
        {
          id: "faang-pipe-03",
          name: "Salesforce -> SAP S/4HANA Corporate Revenue Sync",
          department: "Enterprise CRM & ERP",
          cronInterval: 30,
          spendLimitUsd: 5000,
          stages: [
            {
              title: "Sync Enterprise Opportunity in Salesforce",
              tool: "salesforce_enterprise_sync",
              params: '{"object": "Opportunity", "fields": {"StageName": "Contracting", "Amount": 250000}}'
            },
            {
              title: "Reconcile General Ledger in SAP S/4HANA",
              tool: "sap_erp_ledger_reconcile",
              params: '{"companyCode": "1000", "ledger": "0L", "currency": "USD"}'
            },
            {
              title: "Disburse Corporate Wire via Stripe Treasury",
              tool: "stripe_treasury_payout",
              params: '{"payoutType": "ACH_SAME_DAY", "amountUsd": 25000.00}'
            }
          ]
        }
      ];
      setPipelines(defaultPipelines);
      localStorage.setItem("synapse_faang_pipelines", JSON.stringify(defaultPipelines));
    }
  }, []);

  const savePipelines = (updated) => {
    setPipelines(updated);
    localStorage.setItem("synapse_faang_pipelines", JSON.stringify(updated));
  };

  const handleAddStage = () => {
    setStages([
      ...stages,
      {
        title: "Next Sequential Enterprise Stage",
        tool: "aws_s3_worm_audit",
        params: '{"region": "us-east-1", "enforceKms": true}'
      }
    ]);
  };

  const handleRemoveStage = (idx) => {
    setStages(stages.filter((_, i) => i !== idx));
  };

  const handleToolChange = (idx, toolId) => {
    const selectedTool = allTools.find(t => t.id === toolId);
    const next = [...stages];
    next[idx].tool = toolId;
    if (selectedTool) {
      next[idx].title = selectedTool.name;
      next[idx].params = selectedTool.defaultParams;
    }
    setStages(next);
  };

  const handleUpdateStageField = (idx, field, value) => {
    const next = [...stages];
    next[idx][field] = value;
    setStages(next);
  };

  const handleSavePipeline = (e) => {
    e.preventDefault();
    if (!pipelineName.trim()) return;

    if (editingId) {
      const updated = pipelines.map(p => p.id === editingId ? {
        ...p,
        name: pipelineName,
        department,
        cronInterval: Number(cronInterval),
        spendLimitUsd: Number(spendLimitUsd),
        stages
      } : p);
      savePipelines(updated);
    } else {
      const newPipeline = {
        id: "pipe_faang_" + Date.now(),
        name: pipelineName,
        department,
        cronInterval: Number(cronInterval),
        spendLimitUsd: Number(spendLimitUsd),
        stages
      };
      savePipelines([newPipeline, ...pipelines]);
    }

    setIsCreating(false);
    setEditingId(null);
  };

  const handleDeletePipeline = (id) => {
    savePipelines(pipelines.filter(p => p.id !== id));
  };

  const handleEditPipeline = (pipe) => {
    setEditingId(pipe.id);
    setPipelineName(pipe.name);
    setDepartment(pipe.department);
    setCronInterval(pipe.cronInterval || 30);
    setSpendLimitUsd(pipe.spendLimitUsd || 2500);
    setStages(pipe.stages);
    setIsCreating(true);
  };

  return (
    <div className="space-y-6 font-sans text-xs">
      {/* Visual Canvas Banner */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            Visual Multi-Stage Enterprise Pipeline Architect
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Design, sequence, attach enterprise tools (AWS S3, K8s, SAP ERP, HashiCorp Vault), and govern execution DAGs.
          </p>
        </div>

        <button
          onClick={() => {
            setIsCreating(true);
            setEditingId(null);
            setPipelineName("");
            setSpendLimitUsd(2500);
            setStages([{
              title: "AWS S3 ACL & WORM Audit",
              tool: "aws_s3_worm_audit",
              params: '{"region": "us-east-1", "bucket": "compliance-vault", "enforceKms": true}'
            }]);
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition shadow-md shadow-blue-600/20 shrink-0 text-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Architect New Pipeline</span>
        </button>
      </div>

      {/* VISUAL PIPELINE BUILDER CANVAS */}
      {isCreating && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-blue-500/40 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-xs font-semibold text-blue-400">Workflow Designer</span>
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mt-0.5">
                <Sparkles className="w-4 h-4 text-blue-400" />
                {editingId ? "Edit Enterprise Pipeline Architecture" : "Design Autonomous Pipeline Architecture"}
              </h3>
            </div>

            <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSavePipeline} className="space-y-6">
            {/* Top Metadata Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="md:col-span-2">
                <label className="text-slate-300 font-semibold block mb-1">Pipeline Name</label>
                <input
                  type="text"
                  value={pipelineName}
                  onChange={(e) => setPipelineName(e.target.value)}
                  placeholder="e.g. AWS Multi-Region Failover & SAP Ledger Sync"
                  required
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Department Domain</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="Cloud Infrastructure & SRE">Cloud Infrastructure & SRE</option>
                  <option value="Enterprise CRM & ERP">Enterprise CRM & ERP</option>
                  <option value="Zero-Trust Cybersecurity">Zero-Trust Cybersecurity</option>
                  <option value="CI/CD & Code Intelligence">CI/CD & Code Intelligence</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Spend Limit ($ USD)</label>
                <input
                  type="number"
                  min="100"
                  max="50000"
                  step="100"
                  value={spendLimitUsd}
                  onChange={(e) => setSpendLimitUsd(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-semibold font-mono text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* VISUAL SEQUENTIAL STAGE DAG */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-200 font-semibold flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> Sequential Execution Pipeline Stages:
                </span>
                <button
                  type="button"
                  onClick={handleAddStage}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-blue-400 text-xs font-semibold transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Next Step in Sequence
                </button>
              </div>

              {/* Visual Connected Nodes */}
              <div className="space-y-3">
                {stages.map((stg, sIdx) => {
                  const currentTool = allTools.find(t => t.id === stg.tool) || allTools[0];

                  return (
                    <div key={sIdx} className="space-y-2">
                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition space-y-3 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 flex-1">
                            <span className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-xs">
                              {sIdx + 1}
                            </span>

                            <input
                              type="text"
                              value={stg.title}
                              onChange={(e) => handleUpdateStageField(sIdx, "title", e.target.value)}
                              placeholder="Stage Name"
                              className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white text-xs font-semibold"
                            />
                          </div>

                          {/* FAANG Tool Selector */}
                          <select
                            value={stg.tool}
                            onChange={(e) => handleToolChange(sIdx, e.target.value)}
                            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 text-xs font-medium focus:outline-none max-w-sm truncate"
                          >
                            {FAANG_ENTERPRISE_TOOL_REGISTRY.map((cat, cIdx) => (
                              <optgroup key={cIdx} label={cat.category} className="bg-slate-900 text-slate-400 font-semibold">
                                {cat.tools.map((t) => (
                                  <option key={t.id} value={t.id} className="text-slate-100">
                                    {t.name} ({t.provider})
                                  </option>
                                ))}
                              </optgroup>
                            ))}
                          </select>

                          {stages.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveStage(sIdx)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 transition"
                              title="Remove Stage"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {/* Parameter Payload & Tool Details */}
                        <div className="pl-9 space-y-1.5">
                          <span className="text-xs text-slate-400 block">{currentTool.description}</span>
                          <textarea
                            rows={2}
                            value={stg.params}
                            onChange={(e) => handleUpdateStageField(sIdx, "params", e.target.value)}
                            placeholder="JSON Payload arguments"
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      {/* Visual Pipeline Connector Arrow */}
                      {sIdx < stages.length - 1 && (
                        <div className="flex items-center justify-center py-0.5">
                          <ArrowDown className="w-4 h-4 text-blue-400" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium transition"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-600/20 transition"
              >
                Save & Deploy Pipeline
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PIPELINES ARCHITECTURE GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {pipelines.map((pipe) => (
          <div
            key={pipe.id}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-4 shadow-sm"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {pipe.department}
                </span>
                <span className="text-xs text-emerald-400 font-mono font-semibold">Cap: ${pipe.spendLimitUsd || 2500}</span>
              </div>

              <h3 className="text-sm font-semibold text-white">{pipe.name}</h3>

              {/* Visual Stages List */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Configured Pipeline Stages:</span>
                {pipe.stages.map((stg, sIdx) => {
                  const t = allTools.find(tool => tool.id === stg.tool) || { name: stg.title, provider: "Enterprise API" };
                  return (
                    <div key={sIdx} className="text-xs text-slate-300 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span className="font-medium text-slate-200 truncate">{stg.title}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">[{t.provider?.split(" ")[0] || "API"}]</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEditPipeline(pipe)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition text-xs font-medium"
                >
                  <Edit3 className="w-3 h-3" /> Edit
                </button>

                <button
                  onClick={() => handleDeletePipeline(pipe.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-400 transition"
                  title="Delete Pipeline"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={() => onExecuteGoal({
                  agentId: pipe.id,
                  userGoal: `Execute Enterprise Pipeline: ${pipe.name}`,
                  spendLimitUsd: pipe.spendLimitUsd || 2500
                })}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition shadow-sm text-xs"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Run</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
