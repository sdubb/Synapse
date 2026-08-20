import { productionDb } from "../storage/productionDb.js";
import { staticPipelineVerifier } from "./staticPipelineVerifier.js";
import { generateDynamicPipelineSkill } from "../templates/dynamicPromptGenerator.js";
import { ADVANCED_AGENT_TOOL_REGISTRY } from "../templates/advancedTools.js";

// Central Synapse Pipeline State Engine
// Backs the Pipeline Builder API & MCP Tools with Deterministic Mutations and Revisions
export class PipelineStateEngine {
  constructor(broadcastEvent = () => {}) {
    this.broadcastEvent = broadcastEvent;
    this.workingDrafts = new Map(); // pipelineId -> draftObject
    this.allTools = ADVANCED_AGENT_TOOL_REGISTRY.flatMap(cat => cat.tools);
    this._initializeDefaultsIfEmpty();
  }

  _initializeDefaultsIfEmpty() {
    const existing = productionDb.getPipelines();
    if (existing.length === 0) {
      const defaultPipe = {
        id: "pipe_crypto_arb_01",
        name: "Autonomous BTC/USDT Arbitrage & VaR Risk Rebalancer",
        domain: "Quant Trading & Market Execution",
        cliEngine: "Aider (Git-Native)",
        model: "deepseek-r1:70b",
        spendCeilingUsd: 5000,
        hitlThresholdUsd: 1000,
        cronInterval: 10,
        systemPrompt: "",
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
            title: "Calculate Spread & Evaluate VaR Risk Gate",
            tool: "portfolio_risk_var_analyzer",
            condition: "IF_SPREAD_GT_0_5_PCT",
            retryCount: 2,
            fallbackAction: "HALT_PIPELINE",
            postcondition: { verifier: "external_endpoint_status", params: { endpoint: "http://localhost:4000/api/v1/stats" } },
            params: '{"maxDrawdownPct": 2.5, "targetSharpe": 2.1, "rebalanceThresholdUsd": 50000}'
          },
          {
            id: "node_3",
            nodeType: "EXECUTE_ACTION",
            title: "Execute Algorithmic Limit Arbitrage Order",
            tool: "execute_limit_market_order",
            condition: "IF_PROFITABLE_AND_APPROVED",
            retryCount: 1,
            fallbackAction: "TRIGGER_2FA_APPROVAL",
            postcondition: { verifier: "idempotency_key_active", params: { idempotencyKey: "idem_arb_exec_01" } },
            params: '{"symbol": "BTC/USDT", "action": "BUY", "quantity": 0.5, "orderType": "LIMIT", "maxSlippageBps": 10}'
          },
          {
            id: "node_4",
            nodeType: "NOTIFICATION",
            title: "Post Interactive Block-Kit Confirmation in Slack",
            tool: "slack_enterprise_block_kit",
            condition: "ON_SUCCESS",
            retryCount: 3,
            fallbackAction: "LOG_ONLY",
            postcondition: { verifier: "external_endpoint_status", params: { endpoint: "http://localhost:4000/api/v1/stats" } },
            params: '{"channel": "#quant-trading-alerts", "allowInline2Fa": true}'
          }
        ]
      };
      defaultPipe.systemPrompt = generateDynamicPipelineSkill(defaultPipe);
      productionDb.insertPipeline(defaultPipe);
      productionDb.insertPipelineRevision(defaultPipe.id, defaultPipe, "Initial Seed Pipeline", "System Seed");
    }
  }

  // --- Pipeline Retrieval ---
  listPipelines() {
    return productionDb.getPipelines();
  }

  getPipeline(id) {
    // Return working draft if one is active, otherwise committed pipeline from DB
    if (this.workingDrafts.has(id)) {
      return { ...this.workingDrafts.get(id), isDraft: true };
    }
    const pipe = productionDb.getPipeline(id);
    return pipe ? { ...pipe, isDraft: false } : null;
  }

  getDraft(id) {
    return this.workingDrafts.get(id) || null;
  }

  // --- Pipeline Lifecycle Mutations ---
  createPipeline({
    name = "New Autonomous Pipeline",
    domain = "Enterprise Automation",
    cliEngine = "Aider",
    model = "deepseek-r1:70b",
    spendCeilingUsd = 5000,
    hitlThresholdUsd = 1000,
    cronInterval = 10,
    nodes = [],
    asDraft = true
  }) {
    const id = "pipe_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6);
    const systemPrompt = generateDynamicPipelineSkill({
      pipelineName: name,
      domain,
      cliEngine,
      model,
      spendCeilingUsd,
      hitlThresholdUsd,
      nodes
    });

    const pipelineObj = {
      id,
      name,
      domain,
      cliEngine,
      model,
      spendCeilingUsd: Number(spendCeilingUsd),
      hitlThresholdUsd: Number(hitlThresholdUsd),
      cronInterval: Number(cronInterval),
      systemPrompt,
      nodes: nodes.map((n, i) => ({
        id: n.id || `node_${i + 1}`,
        nodeType: n.nodeType || "EXECUTE_ACTION",
        title: n.title || `Stage ${i + 1}`,
        tool: n.tool || "market_data_orderbook_stream",
        condition: n.condition || "ALWAYS_EXECUTE",
        retryCount: n.retryCount || 2,
        fallbackAction: n.fallbackAction || "ALERT_ON_CALL",
        postcondition: n.postcondition || null,
        params: typeof n.params === "string" ? n.params : JSON.stringify(n.params || {})
      })),
      status: asDraft ? "DRAFT" : "COMMITTED",
      revisionCount: 1
    };

    if (asDraft) {
      this.workingDrafts.set(id, pipelineObj);
    } else {
      productionDb.insertPipeline(pipelineObj);
      productionDb.insertPipelineRevision(id, pipelineObj, "Initial Commit", "Architect CLI");
    }

    this.broadcastEvent({
      type: "PIPELINE_CREATED",
      data: { pipeline: pipelineObj, asDraft }
    });

    return pipelineObj;
  }

  updatePipeline(id, updates = {}) {
    let target = this.workingDrafts.get(id);
    if (!target) {
      const fromDb = productionDb.getPipeline(id);
      if (!fromDb) throw new Error(`Pipeline '${id}' not found.`);
      target = JSON.parse(JSON.stringify(fromDb));
    }

    if (updates.name !== undefined) target.name = updates.name;
    if (updates.domain !== undefined) target.domain = updates.domain;
    if (updates.cliEngine !== undefined) target.cliEngine = updates.cliEngine;
    if (updates.model !== undefined) target.model = updates.model;
    if (updates.spendCeilingUsd !== undefined) target.spendCeilingUsd = Number(updates.spendCeilingUsd);
    if (updates.hitlThresholdUsd !== undefined) target.hitlThresholdUsd = Number(updates.hitlThresholdUsd);
    if (updates.cronInterval !== undefined) target.cronInterval = Number(updates.cronInterval);
    if (updates.nodes !== undefined) target.nodes = updates.nodes;

    // Re-compile dynamic behavioral skill prompt
    target.systemPrompt = generateDynamicPipelineSkill({
      pipelineName: target.name,
      domain: target.domain,
      cliEngine: target.cliEngine,
      model: target.model,
      spendCeilingUsd: target.spendCeilingUsd,
      hitlThresholdUsd: target.hitlThresholdUsd,
      nodes: target.nodes
    });

    this.workingDrafts.set(id, target);

    this.broadcastEvent({
      type: "PIPELINE_UPDATED",
      data: { pipelineId: id, pipeline: target }
    });

    return target;
  }

  renamePipeline(id, newName) {
    return this.updatePipeline(id, { name: newName });
  }

  deletePipeline(id) {
    this.workingDrafts.delete(id);
    productionDb.deletePipeline(id);
    this.broadcastEvent({
      type: "PIPELINE_DELETED",
      data: { pipelineId: id }
    });
    return { success: true, id };
  }

  // --- Deterministic Node Mutations ---
  createNode(pipelineId, nodeData = {}, position = -1) {
    let target = this.getPipeline(pipelineId);
    if (!target) {
      target = this.createPipeline({ name: "Autonomous Pipeline Draft" });
      pipelineId = target.id;
    }

    const nextIdx = target.nodes.length + 1;
    const nodeId = nodeData.id || `node_${nextIdx}_${Date.now().toString(36).substring(3, 7)}`;
    const selectedTool = this.allTools.find(t => t.id === nodeData.tool) || this.allTools[0];

    const newNode = {
      id: nodeId,
      nodeType: nodeData.nodeType || "EXECUTE_ACTION",
      title: nodeData.title || (selectedTool ? selectedTool.name : `Stage ${nextIdx}`),
      tool: nodeData.tool || (selectedTool ? selectedTool.id : "market_data_orderbook_stream"),
      condition: nodeData.condition || "ON_SUCCESS",
      retryCount: Number(nodeData.retryCount) || 2,
      fallbackAction: nodeData.fallbackAction || "ALERT_ON_CALL",
      postcondition: nodeData.postcondition || null,
      params: typeof nodeData.params === "string" ? nodeData.params : JSON.stringify(nodeData.params || JSON.parse(selectedTool?.defaultParams || "{}"))
    };

    const nextNodes = [...target.nodes];
    if (position >= 0 && position < nextNodes.length) {
      nextNodes.splice(position, 0, newNode);
    } else {
      nextNodes.push(newNode);
    }

    target.nodes = nextNodes;
    target.systemPrompt = generateDynamicPipelineSkill(target);
    this.workingDrafts.set(pipelineId, target);

    this.broadcastEvent({
      type: "NODE_CREATED",
      data: { pipelineId, node: newNode, position, totalNodes: nextNodes.length, pipeline: target }
    });

    return { success: true, pipelineId, node: newNode, totalNodes: nextNodes.length };
  }

  updateNode(pipelineId, nodeId, updates = {}) {
    const target = this.getPipeline(pipelineId);
    if (!target) throw new Error(`Pipeline '${pipelineId}' not found.`);

    const nodeIdx = target.nodes.findIndex(n => n.id === nodeId || n.id === `node_${nodeId}` || String(n.id) === String(nodeId));
    if (nodeIdx === -1) {
      throw new Error(`Node '${nodeId}' not found in pipeline '${pipelineId}'.`);
    }

    const existingNode = target.nodes[nodeIdx];
    const updatedNode = {
      ...existingNode,
      ...updates
    };

    if (updates.params && typeof updates.params === "object") {
      updatedNode.params = JSON.stringify(updates.params);
    }

    target.nodes[nodeIdx] = updatedNode;
    target.systemPrompt = generateDynamicPipelineSkill(target);
    this.workingDrafts.set(pipelineId, target);

    this.broadcastEvent({
      type: "NODE_UPDATED",
      data: { pipelineId, nodeId: existingNode.id, nodeIndex: nodeIdx, node: updatedNode, pipeline: target }
    });

    return { success: true, pipelineId, nodeId: existingNode.id, node: updatedNode };
  }

  deleteNode(pipelineId, nodeId) {
    const target = this.getPipeline(pipelineId);
    if (!target) throw new Error(`Pipeline '${pipelineId}' not found.`);

    const nextNodes = target.nodes.filter(n => n.id !== nodeId && n.id !== `node_${nodeId}` && String(n.id) !== String(nodeId));
    target.nodes = nextNodes;
    target.systemPrompt = generateDynamicPipelineSkill(target);
    this.workingDrafts.set(pipelineId, target);

    this.broadcastEvent({
      type: "NODE_DELETED",
      data: { pipelineId, nodeId, totalNodes: nextNodes.length, pipeline: target }
    });

    return { success: true, pipelineId, nodeId, remainingNodes: nextNodes.length };
  }

  moveNode(pipelineId, nodeId, newIndex) {
    const target = this.getPipeline(pipelineId);
    if (!target) throw new Error(`Pipeline '${pipelineId}' not found.`);

    const currentIndex = target.nodes.findIndex(n => n.id === nodeId);
    if (currentIndex === -1) throw new Error(`Node '${nodeId}' not found.`);

    const nextNodes = [...target.nodes];
    const [moved] = nextNodes.splice(currentIndex, 1);
    const targetIndex = Math.max(0, Math.min(newIndex, nextNodes.length));
    nextNodes.splice(targetIndex, 0, moved);

    target.nodes = nextNodes;
    target.systemPrompt = generateDynamicPipelineSkill(target);
    this.workingDrafts.set(pipelineId, target);

    this.broadcastEvent({
      type: "NODE_MOVED",
      data: { pipelineId, nodeId, fromIndex: currentIndex, toIndex: targetIndex, pipeline: target }
    });

    return { success: true, pipelineId, nodeId, fromIndex: currentIndex, toIndex: targetIndex };
  }

  connectNodes(pipelineId, sourceNodeId, targetNodeId, condition = "ON_SUCCESS") {
    return this.updateNode(pipelineId, sourceNodeId, {
      condition,
      nextTargetNodeId: targetNodeId
    });
  }

  // --- Branch Mutations ---
  createBranch(pipelineId, {
    condition = "IF_RISK_APPROVED",
    title = "Conditional Risk Branch Gate",
    tool = "portfolio_risk_var_analyzer",
    params = {},
    fallbackAction = "HALT_PIPELINE",
    position = -1
  }) {
    return this.createNode(pipelineId, {
      nodeType: "CONDITIONAL_BRANCH",
      title,
      tool,
      condition,
      fallbackAction,
      params: typeof params === "string" ? params : JSON.stringify(params)
    }, position);
  }

  updateBranch(pipelineId, nodeId, updates = {}) {
    return this.updateNode(pipelineId, nodeId, {
      nodeType: "CONDITIONAL_BRANCH",
      ...updates
    });
  }

  // --- Verification Contract Mutations ---
  createContract(pipelineId, nodeId, contractData = {}) {
    const target = this.getPipeline(pipelineId);
    if (!target) throw new Error(`Pipeline '${pipelineId}' not found.`);

    const nodeIdx = target.nodes.findIndex(n => n.id === nodeId || n.id === `node_${nodeId}`);
    if (nodeIdx === -1) throw new Error(`Node '${nodeId}' not found in pipeline '${pipelineId}'.`);

    const contract = {
      verifier: contractData.verifier || "idempotency_key_active",
      params: contractData.params || { idempotencyKey: `idem_${nodeId}_${Date.now().toString(36)}` },
      description: contractData.description || "Ground-truth postcondition verification contract"
    };

    target.nodes[nodeIdx].postcondition = contract;
    this.workingDrafts.set(pipelineId, target);

    this.broadcastEvent({
      type: "CONTRACT_CREATED",
      data: { pipelineId, nodeId, contract, pipeline: target }
    });

    return { success: true, pipelineId, nodeId, contract };
  }

  updateContract(pipelineId, nodeId, updates = {}) {
    const target = this.getPipeline(pipelineId);
    if (!target) throw new Error(`Pipeline '${pipelineId}' not found.`);

    const nodeIdx = target.nodes.findIndex(n => n.id === nodeId || n.id === `node_${nodeId}`);
    if (nodeIdx === -1) throw new Error(`Node '${nodeId}' not found.`);

    const existingContract = target.nodes[nodeIdx].postcondition || {};
    const newContract = { ...existingContract, ...updates };

    target.nodes[nodeIdx].postcondition = newContract;
    this.workingDrafts.set(pipelineId, target);

    this.broadcastEvent({
      type: "CONTRACT_UPDATED",
      data: { pipelineId, nodeId, contract: newContract, pipeline: target }
    });

    return { success: true, pipelineId, nodeId, contract: newContract };
  }

  // --- Validation, Diff Preview, Commit & Rollback ---
  validatePipeline(pipelineIdOrObj) {
    const pipe = typeof pipelineIdOrObj === "string" ? this.getPipeline(pipelineIdOrObj) : pipelineIdOrObj;
    if (!pipe) throw new Error("Pipeline not found for validation.");

    const audit = staticPipelineVerifier.verifyPipelineDAG(pipe);
    this.broadcastEvent({
      type: "PIPELINE_VALIDATED",
      data: { pipelineId: pipe.id, audit }
    });
    return audit;
  }

  previewDraft(pipelineId) {
    const draft = this.workingDrafts.get(pipelineId);
    const committed = productionDb.getPipeline(pipelineId);

    if (!draft && !committed) throw new Error(`No pipeline found with ID '${pipelineId}'.`);

    const current = draft || committed;
    const previous = committed || { nodes: [], spendCeilingUsd: 0, hitlThresholdUsd: 0 };

    const validation = staticPipelineVerifier.verifyPipelineDAG(current);

    const diff = {
      pipelineId,
      name: current.name,
      domain: current.domain,
      nodesCount: current.nodes.length,
      previousNodesCount: previous.nodes.length,
      spendCeilingUsd: current.spendCeilingUsd,
      hitlThresholdUsd: current.hitlThresholdUsd,
      addedNodes: current.nodes.filter(n => !previous.nodes.some(p => p.id === n.id)),
      modifiedNodes: current.nodes.filter(n => {
        const p = previous.nodes.find(pn => pn.id === n.id);
        return p && (p.title !== n.title || p.tool !== n.tool || p.params !== n.params || p.condition !== n.condition);
      }),
      contractsAttached: current.nodes.filter(n => n.postcondition && n.postcondition.verifier).map(n => ({
        nodeId: n.id,
        nodeTitle: n.title,
        verifier: n.postcondition.verifier,
        params: n.postcondition.params
      })),
      governanceDiff: {
        spendCeilingChanged: current.spendCeilingUsd !== previous.spendCeilingUsd,
        oldSpendCeiling: previous.spendCeilingUsd,
        newSpendCeiling: current.spendCeilingUsd,
        hitlThresholdChanged: current.hitlThresholdUsd !== previous.hitlThresholdUsd,
        oldHitlThreshold: previous.hitlThresholdUsd,
        newHitlThreshold: current.hitlThresholdUsd
      },
      validation
    };

    return diff;
  }

  commitPipeline(pipelineId, reason = "Committed via AI Architect CLI", committedBy = "Architect CLI / MCP") {
    const draft = this.workingDrafts.get(pipelineId) || productionDb.getPipeline(pipelineId);
    if (!draft) throw new Error(`No draft or pipeline found to commit for '${pipelineId}'.`);

    // Run Static Preflight Validation prior to commit
    const validation = staticPipelineVerifier.verifyPipelineDAG(draft);
    if (validation.status === "FAIL") {
      // Auto-repair if possible
      const repaired = staticPipelineVerifier.autoRepairDAG(draft);
      Object.assign(draft, repaired.repairedPipeline);
    }

    draft.status = "COMMITTED";
    draft.systemPrompt = generateDynamicPipelineSkill(draft);

    productionDb.insertPipeline(draft);
    const revResult = productionDb.insertPipelineRevision(pipelineId, draft, reason, committedBy);

    this.workingDrafts.delete(pipelineId);

    this.broadcastEvent({
      type: "PIPELINE_COMMITTED",
      data: { pipelineId, pipeline: draft, revision: revResult }
    });

    return { success: true, pipelineId, pipeline: draft, revision: revResult };
  }

  rollbackPipeline(pipelineId, targetRevisionNumber = null) {
    const revisions = productionDb.getPipelineRevisions(pipelineId);
    if (revisions.length === 0) throw new Error(`No revision history found for pipeline '${pipelineId}'.`);

    let targetRev;
    if (targetRevisionNumber) {
      targetRev = revisions.find(r => r.revisionNumber === Number(targetRevisionNumber));
    } else {
      // Pick second most recent revision (or oldest if only 1)
      targetRev = revisions.length > 1 ? revisions[1] : revisions[0];
    }

    if (!targetRev) throw new Error(`Target revision not found.`);

    const restoredPipeline = targetRev.snapshot;
    restoredPipeline.status = "COMMITTED";
    productionDb.insertPipeline(restoredPipeline);
    const newRev = productionDb.insertPipelineRevision(pipelineId, restoredPipeline, `Rollback to Rev #${targetRev.revisionNumber}`, "User 1-Click Rollback");

    this.workingDrafts.delete(pipelineId);

    this.broadcastEvent({
      type: "PIPELINE_ROLLED_BACK",
      data: { pipelineId, restoredFromRevision: targetRev.revisionNumber, pipeline: restoredPipeline, newRevision: newRev }
    });

    return { success: true, pipelineId, restoredFromRevision: targetRev.revisionNumber, pipeline: restoredPipeline };
  }

  getRevisions(pipelineId) {
    return productionDb.getPipelineRevisions(pipelineId);
  }
}

export const pipelineStateEngine = new PipelineStateEngine();
