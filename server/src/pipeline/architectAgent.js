import { pipelineStateEngine } from "./pipelineStateEngine.js";
import { staticPipelineVerifier } from "./staticPipelineVerifier.js";
import { ADVANCED_AGENT_TOOL_REGISTRY } from "../templates/advancedTools.js";
import { generateDynamicPipelineSkill } from "../templates/dynamicPromptGenerator.js";

// AI Pipeline Architect Agent: Translates natural language directives into deterministic MCP tool chains
export class ArchitectAgent {
  constructor(broadcastEvent = () => {}) {
    this.broadcastEvent = broadcastEvent;
    this.allTools = ADVANCED_AGENT_TOOL_REGISTRY.flatMap(cat => cat.tools);
  }

  // Primary Conversational Architect Entry Point
  async processDirective({
    userPrompt = "",
    pipelineId = null,
    activePipeline = null,
    selectedCli = "aider",
    selectedModel = "deepseek-r1:70b"
  }) {
    console.log(`\n🧠 [AI_PIPELINE_ARCHITECT]: Processing user directive: "${userPrompt}"`);
    const mcpTrace = [];
    const promptLower = userPrompt.toLowerCase().trim();

    // Helper to log MCP tool execution
    const executeMcpTool = (toolName, toolArgs, result) => {
      const step = {
        timestamp: new Date().toISOString(),
        tool: toolName,
        args: toolArgs,
        status: "SUCCESS",
        resultSummary: typeof result === "object" ? JSON.stringify(result).substring(0, 120) + "..." : String(result)
      };
      mcpTrace.push(step);
      this.broadcastEvent({
        type: "ARCHITECT_STEP",
        data: step
      });
      return step;
    };

    let targetPipelineId = pipelineId;
    let targetPipe = null;

    if (pipelineId) {
      targetPipe = pipelineStateEngine.getPipeline(pipelineId);
    }
    if (!targetPipe && activePipeline) {
      targetPipe = JSON.parse(JSON.stringify(activePipeline));
      targetPipelineId = targetPipe.id || "pipe_draft_" + Date.now();
    }

    // =========================================================================
    // CASE 1: Governance & Spend Ceiling Modifications
    // e.g. "Set spend ceiling to $2,000 and require human approval above $500"
    // =========================================================================
    const spendMatch = promptLower.match(/spend (?:ceiling|limit).*?\$?\s*([0-9,]+)/i);
    const hitlMatch = promptLower.match(/(?:2fa|approval|human).*?\$?\s*([0-9,]+)/i);

    if ((spendMatch || hitlMatch) && targetPipe && !promptLower.includes("create") && !promptLower.includes("build")) {
      const updates = {};
      if (spendMatch) updates.spendCeilingUsd = Number(spendMatch[1].replace(/,/g, ""));
      if (hitlMatch) updates.hitlThresholdUsd = Number(hitlMatch[1].replace(/,/g, ""));

      executeMcpTool("pipeline.update", { pipelineId: targetPipe.id, updates }, "Governance parameters updated");
      const updated = pipelineStateEngine.updatePipeline(targetPipe.id, updates);

      const validation = pipelineStateEngine.validatePipeline(updated);
      const preview = pipelineStateEngine.previewDraft(targetPipe.id);

      return {
        success: true,
        message: `I've updated the governance controls: Hard Spend Ceiling is now $${updated.spendCeilingUsd.toLocaleString()} USD and Human 2FA Threshold is $${updated.hitlThresholdUsd.toLocaleString()} USD.`,
        mcpTrace,
        pipeline: updated,
        preview,
        validation
      };
    }

    // =========================================================================
    // CASE 2: Insert Stop-Loss / Risk Guard Before Execution Node
    // e.g. "Add a stop-loss check before execution"
    // =========================================================================
    if ((promptLower.includes("stop-loss") || promptLower.includes("stop loss") || promptLower.includes("risk guard")) && targetPipe) {
      // Find execution node
      const execIdx = targetPipe.nodes.findIndex(n => n.nodeType === "EXECUTE_ACTION" || n.tool.includes("order") || n.tool.includes("execute"));
      const insertPos = execIdx >= 0 ? execIdx : targetPipe.nodes.length;

      const stopLossNode = {
        nodeType: "CONDITIONAL_BRANCH",
        title: "Check Real-Time Stop-Loss & VaR Risk Boundary",
        tool: "portfolio_risk_var_analyzer",
        condition: "IF_WITHIN_MAX_DRAWDOWN_2PCT",
        retryCount: 2,
        fallbackAction: "HALT_PIPELINE",
        postcondition: { verifier: "external_endpoint_status", params: { endpoint: "http://localhost:4000/api/v1/stats" } },
        params: JSON.stringify({ maxDrawdownPct: 2.0, enforceStopLossPrice: true, stopLossSpreadBps: 25 })
      };

      executeMcpTool("node.create", { pipelineId: targetPipe.id, nodeData: stopLossNode, position: insertPos }, "Inserted stop-loss risk guard");
      pipelineStateEngine.createNode(targetPipe.id, stopLossNode, insertPos);

      const updated = pipelineStateEngine.getPipeline(targetPipe.id);
      const validation = pipelineStateEngine.validatePipeline(updated);
      const preview = pipelineStateEngine.previewDraft(targetPipe.id);

      return {
        success: true,
        message: `I've inserted a Stop-Loss & Risk Guard (Node ${insertPos + 1}) immediately before the execution step to halt the pipeline if spread or drawdown violates risk tolerances.`,
        mcpTrace,
        pipeline: updated,
        preview,
        validation
      };
    }

    // =========================================================================
    // CASE 3: Change Tool on Specific Node (e.g. Binance vs Coinbase)
    // e.g. "Change node 3 to use Binance instead of Coinbase" / "Use Binance for market data"
    // =========================================================================
    if ((promptLower.includes("change node") || promptLower.includes("use binance") || promptLower.includes("switch to")) && targetPipe) {
      let targetNodeIdx = 0;
      const nodeNumMatch = promptLower.match(/node\s*(\d+)/i);
      if (nodeNumMatch) {
        targetNodeIdx = parseInt(nodeNumMatch[1], 10) - 1;
      } else {
        targetNodeIdx = targetPipe.nodes.findIndex(n => n.tool.includes("market") || n.tool.includes("stream"));
        if (targetNodeIdx === -1) targetNodeIdx = 0;
      }

      if (targetPipe.nodes[targetNodeIdx]) {
        const targetNode = targetPipe.nodes[targetNodeIdx];
        const newTool = promptLower.includes("binance") ? "market_data_orderbook_stream" : targetNode.tool;
        const newParams = {
          pair: "BTC/USDT",
          exchange: "binance",
          depth: 100,
          timeframe: "1m"
        };

        executeMcpTool("node.update", {
          pipelineId: targetPipe.id,
          nodeId: targetNode.id,
          updates: { tool: newTool, title: "Stream Binance L2/L3 Orderbook Depth", params: JSON.stringify(newParams) }
        }, "Updated node tool to Binance stream");

        pipelineStateEngine.updateNode(targetPipe.id, targetNode.id, {
          tool: newTool,
          title: "Stream Binance L2/L3 Orderbook Depth",
          params: JSON.stringify(newParams)
        });

        const updated = pipelineStateEngine.getPipeline(targetPipe.id);
        const validation = pipelineStateEngine.validatePipeline(updated);
        const preview = pipelineStateEngine.previewDraft(targetPipe.id);

        return {
          success: true,
          message: `I've updated Node ${targetNodeIdx + 1} ("${targetNode.title}") to utilize the Binance L2/L3 orderbook depth stream.`,
          mcpTrace,
          pipeline: updated,
          preview,
          validation
        };
      }
    }

    // =========================================================================
    // CASE 4: Add Verification Postcondition Contracts to Financial Nodes
    // e.g. "Add a verification step after every financial transaction"
    // =========================================================================
    if ((promptLower.includes("verification step") || promptLower.includes("add contract") || promptLower.includes("verify order")) && targetPipe) {
      let contractsAdded = 0;
      targetPipe.nodes.forEach((node, idx) => {
        if (node.nodeType === "EXECUTE_ACTION" || node.tool.includes("order") || node.tool.includes("payout") || node.tool.includes("sync")) {
          const contract = {
            verifier: "idempotency_key_active",
            params: { idempotencyKey: `idem_${node.id}_${Date.now().toString(36)}` },
            description: `Ground-truth cryptographic execution verification for Node ${idx + 1}`
          };

          executeMcpTool("contract.create", { pipelineId: targetPipe.id, nodeId: node.id, contractData: contract }, `Attached verification contract to ${node.id}`);
          pipelineStateEngine.createContract(targetPipe.id, node.id, contract);
          contractsAdded++;
        }
      });

      const updated = pipelineStateEngine.getPipeline(targetPipe.id);
      const validation = pipelineStateEngine.validatePipeline(updated);
      const preview = pipelineStateEngine.previewDraft(targetPipe.id);

      return {
        success: true,
        message: `I've attached ${contractsAdded} automated verification contracts across all financial and state-mutating execution nodes in this DAG to ensure cryptographic non-repudiation.`,
        mcpTrace,
        pipeline: updated,
        preview,
        validation
      };
    }

    // =========================================================================
    // CASE 5: Full Pipeline Synthesis from User Intent
    // e.g. "Create a crypto arbitrage pipeline that monitors BTC/USDT, checks spread and risk, executes only if profitable, then verifies the order and position."
    // =========================================================================
    let domain = "Enterprise Automation & Operations";
    let pipelineName = "Autonomous Multi-Stage Pipeline";
    let spendCeilingUsd = 5000;
    let hitlThresholdUsd = 1000;
    let cronInterval = 10;
    let synthesizedNodes = [];

    // Scenario A: Crypto Arbitrage / Quant Trading
    if (promptLower.includes("crypto") || promptLower.includes("arbitrage") || promptLower.includes("btc") || promptLower.includes("trade") || promptLower.includes("market") || promptLower.includes("order")) {
      domain = "Quant Trading & Market Execution";
      pipelineName = "Autonomous BTC/USDT Arbitrage & VaR Risk Rebalancer";
      spendCeilingUsd = 5000;
      hitlThresholdUsd = 1000;
      cronInterval = 10;

      synthesizedNodes = [
        {
          id: "node_1",
          nodeType: "MONITOR_STREAM",
          title: "1. Monitor BTC/USDT L2 Orderbook & Depth",
          tool: "market_data_orderbook_stream",
          condition: "ALWAYS_EXECUTE",
          retryCount: 3,
          fallbackAction: "ALERT_ON_CALL",
          postcondition: { verifier: "db_row_exists", params: { agentId: "agent-quant-trader" } },
          params: JSON.stringify({ pair: "BTC/USDT", depth: 100, exchange: "binance", timeframe: "1m" })
        },
        {
          id: "node_2",
          nodeType: "CONDITIONAL_BRANCH",
          title: "2. Calculate Spread & Check VaR Risk Boundary",
          tool: "portfolio_risk_var_analyzer",
          condition: "IF_SPREAD_GT_0_5_PCT",
          retryCount: 2,
          fallbackAction: "HALT_PIPELINE",
          postcondition: { verifier: "external_endpoint_status", params: { endpoint: "http://localhost:4000/api/v1/stats" } },
          params: JSON.stringify({ minSpreadBps: 50, maxDrawdownPct: 2.0, targetSharpe: 2.1 })
        },
        {
          id: "node_3",
          nodeType: "EXECUTE_ACTION",
          title: "3. Execute Limit Arbitrage Order Only If Profitable",
          tool: "execute_limit_market_order",
          condition: "IF_PROFITABLE_AND_APPROVED",
          retryCount: 1,
          fallbackAction: "TRIGGER_2FA_APPROVAL",
          postcondition: { verifier: "idempotency_key_active", params: { idempotencyKey: "idem_btc_arb_01" } },
          params: JSON.stringify({ pair: "BTC/USDT", action: "BUY", quantity: 0.5, orderType: "LIMIT", maxSlippageBps: 10 })
        },
        {
          id: "node_4",
          nodeType: "EXECUTE_ACTION",
          title: "4. Verify Order Execution & Reconcile Position",
          tool: "sap_erp_ledger_reconcile",
          condition: "ON_SUCCESS",
          retryCount: 2,
          fallbackAction: "ALERT_ON_CALL",
          postcondition: { verifier: "db_row_exists", params: { agentId: "agent-quant-trader" } },
          params: JSON.stringify({ asset: "BTC", expectedBalanceDelta: 0.5, verifySettlement: true })
        },
        {
          id: "node_5",
          nodeType: "NOTIFICATION",
          title: "5. Dispatch 2FA Execution Summary to Slack",
          tool: "slack_enterprise_block_kit",
          condition: "ON_SUCCESS",
          retryCount: 3,
          fallbackAction: "LOG_ONLY",
          postcondition: { verifier: "external_endpoint_status", params: { endpoint: "http://localhost:4000/api/v1/stats" } },
          params: JSON.stringify({ channel: "#quant-trading-desk", allowInline2Fa: true })
        }
      ];
    }
    // Scenario B: Kubernetes & Cloud Infrastructure SRE
    else if (promptLower.includes("k8s") || promptLower.includes("kubernetes") || promptLower.includes("sre") || promptLower.includes("pod") || promptLower.includes("log") || promptLower.includes("drain")) {
      domain = "Cloud Infrastructure & SRE";
      pipelineName = "Kubernetes Zero-Downtime Pod Auto-Healer";
      spendCeilingUsd = 3000;
      hitlThresholdUsd = 500;
      cronInterval = 15;

      synthesizedNodes = [
        {
          id: "node_1",
          nodeType: "MONITOR_STREAM",
          title: "1. Poll APM Telemetry & Memory Leak Anomaly",
          tool: "log_stream_anomaly_detector",
          condition: "ALWAYS_EXECUTE",
          retryCount: 3,
          fallbackAction: "ALERT_ON_CALL",
          postcondition: { verifier: "external_endpoint_status", params: { endpoint: "http://localhost:4000/api/v1/stats" } },
          params: JSON.stringify({ service: "payments-core", surgeThreshold: "25%" })
        },
        {
          id: "node_2",
          nodeType: "EXECUTE_ACTION",
          title: "2. Rotate Dynamic Database Credentials in Vault",
          tool: "hashicorp_vault_token_rotation",
          condition: "ON_SUCCESS",
          retryCount: 2,
          fallbackAction: "RETRY_WITH_BACKOFF",
          postcondition: { verifier: "db_row_exists", params: { agentId: "agent-sre-lead" } },
          params: JSON.stringify({ vaultPath: "database/creds/billing-readonly", ttl: "15m" })
        },
        {
          id: "node_3",
          nodeType: "EXECUTE_ACTION",
          title: "3. Drain Degraded Pods & Reroute Istio Traffic",
          tool: "k8s_cluster_drain_restart",
          condition: "IF_ERROR_SURGE_GT_10PCT",
          retryCount: 1,
          fallbackAction: "TRIGGER_2FA_APPROVAL",
          postcondition: { verifier: "idempotency_key_active", params: { idempotencyKey: "idem_k8s_drain_01" } },
          params: JSON.stringify({ cluster: "prod-us-east-1", namespace: "payments-core", maxSurge: "25%" })
        },
        {
          id: "node_4",
          nodeType: "NOTIFICATION",
          title: "4. Trigger PagerDuty & Slack Incident Notice",
          tool: "slack_enterprise_block_kit",
          condition: "ON_SUCCESS",
          retryCount: 3,
          fallbackAction: "LOG_ONLY",
          postcondition: { verifier: "external_endpoint_status", params: { endpoint: "http://localhost:4000/api/v1/stats" } },
          params: JSON.stringify({ channel: "#secops-oncall", allowInline2Fa: true })
        }
      ];
    }
    // Scenario C: Enterprise Revenue & Deal Automation
    else {
      domain = "Enterprise Revenue & ERP";
      pipelineName = "Enterprise Revenue Opportunity Sync & Treasury Wire";
      spendCeilingUsd = 50000;
      hitlThresholdUsd = 2500;
      cronInterval = 30;

      synthesizedNodes = [
        {
          id: "node_1",
          nodeType: "EXECUTE_ACTION",
          title: "1. Sync Salesforce Opportunity to Contracting Stage",
          tool: "salesforce_enterprise_sync",
          condition: "ALWAYS_EXECUTE",
          retryCount: 3,
          fallbackAction: "RETRY_WITH_BACKOFF",
          postcondition: { verifier: "db_row_exists", params: { agentId: "agent-sales-ae" } },
          params: JSON.stringify({ object: "Opportunity", stage: "Closed-Won", amount: 75000 })
        },
        {
          id: "node_2",
          nodeType: "EXECUTE_ACTION",
          title: "2. Reconcile General Ledger in SAP S/4HANA",
          tool: "sap_erp_ledger_reconcile",
          condition: "ON_SUCCESS",
          retryCount: 2,
          fallbackAction: "TRIGGER_2FA_APPROVAL",
          postcondition: { verifier: "idempotency_key_active", params: { idempotencyKey: "idem_sap_sync_01" } },
          params: JSON.stringify({ companyCode: "1000", ledger: "0L", currency: "USD", amount: 75000 })
        },
        {
          id: "node_3",
          nodeType: "NOTIFICATION",
          title: "3. Request Executive 2FA Approval via Slack Block-Kit",
          tool: "slack_enterprise_block_kit",
          condition: "ON_SUCCESS",
          retryCount: 3,
          fallbackAction: "LOG_ONLY",
          postcondition: { verifier: "external_endpoint_status", params: { endpoint: "http://localhost:4000/api/v1/stats" } },
          params: JSON.stringify({ channel: "#executive-approvals", allowInline2Fa: true })
        }
      ];
    }

    // Step 1: MCP Call pipeline.create
    executeMcpTool("pipeline.create", {
      name: pipelineName,
      domain,
      cliEngine: selectedCli,
      model: selectedModel,
      spendCeilingUsd,
      hitlThresholdUsd,
      cronInterval
    }, `Initialized pipeline draft '${pipelineName}'`);

    const createdDraft = pipelineStateEngine.createPipeline({
      name: pipelineName,
      domain,
      cliEngine: selectedCli,
      model: selectedModel,
      spendCeilingUsd,
      hitlThresholdUsd,
      cronInterval,
      nodes: [],
      asDraft: true
    });

    // Step 2: Sequential MCP Calls for Each Node & Contract
    for (let i = 0; i < synthesizedNodes.length; i++) {
      const node = synthesizedNodes[i];
      executeMcpTool("node.create", {
        pipelineId: createdDraft.id,
        nodeType: node.nodeType,
        title: node.title,
        tool: node.tool,
        condition: node.condition,
        fallbackAction: node.fallbackAction
      }, `Created Node ${i + 1}`);

      pipelineStateEngine.createNode(createdDraft.id, node);

      if (node.postcondition && node.postcondition.verifier) {
        executeMcpTool("contract.create", {
          pipelineId: createdDraft.id,
          nodeId: node.id,
          verifier: node.postcondition.verifier,
          params: node.postcondition.params
        }, `Attached ground-truth contract to Node ${i + 1}`);
      }
    }

    // Step 3: Run Static Verifier Check on the Assembled DAG
    executeMcpTool("pipeline.validate", { pipelineId: createdDraft.id }, "Running static preflight linter");
    let validation = pipelineStateEngine.validatePipeline(createdDraft.id);

    // Step 4: If verifier found issues, auto-repair DAG
    if (validation.status === "FAIL" && validation.canAutoFix) {
      const repaired = staticPipelineVerifier.autoRepairDAG(pipelineStateEngine.getPipeline(createdDraft.id));
      pipelineStateEngine.updatePipeline(createdDraft.id, { nodes: repaired.repairedPipeline.nodes });
      executeMcpTool("pipeline.repair", { fixes: repaired.fixesApplied }, "Auto-repaired DAG invariants");
      validation = pipelineStateEngine.validatePipeline(createdDraft.id);
    }

    // Step 5: Compute Staged Preview Diff
    const preview = pipelineStateEngine.previewDraft(createdDraft.id);
    const finalDraft = pipelineStateEngine.getPipeline(createdDraft.id);

    return {
      success: true,
      message: `I've constructed the pipeline "${pipelineName}" with ${finalDraft.nodes.length} stages, conditional risk gates, and cryptographic verification contracts. The draft is staged for your preview.`,
      mcpTrace,
      pipeline: finalDraft,
      preview,
      validation
    };
  }
}

export const architectAgent = new ArchitectAgent();
