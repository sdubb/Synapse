import { ADVANCED_AGENT_TOOL_REGISTRY } from "../templates/advancedTools.js";
import { generateDynamicPipelineSkill } from "../templates/dynamicPromptGenerator.js";

// AI DAG Synthesizer: Translates natural language directives into full multi-stage DAGs
export class PipelineSynthesizer {
  constructor() {
    this.allTools = ADVANCED_AGENT_TOOL_REGISTRY.flatMap(cat => cat.tools);
  }

  // Generates complete DAG nodes, verification postconditions, and dynamic system prompt
  synthesizePipelineFromIntent({
    userPrompt = "Build an automated pipeline to monitor BTC orderbook, check risk, and rebalance",
    selectedCli = "aider",
    selectedModel = "deepseek-r1:70b"
  }) {
    console.log(`[AI_DAG_SYNTHESIZER]: Translating prompt into structured DAG: "${userPrompt}"`);
    const promptLower = userPrompt.toLowerCase();

    let domain = "Enterprise Automation & Operations";
    let pipelineName = "Autonomous Enterprise Workflow";
    let nodes = [];
    let spendCeilingUsd = 2500;
    let hitlThresholdUsd = 500;

    // Case 1: Quant / Trading / Crypto / Arbitrage
    if (promptLower.includes("trade") || promptLower.includes("btc") || promptLower.includes("orderbook") || promptLower.includes("arbitrage") || promptLower.includes("stock")) {
      domain = "Quant Trading & Market Execution";
      pipelineName = "Autonomous Market Data Monitor & Algorithmic Rebalancer";
      spendCeilingUsd = 5000;
      hitlThresholdUsd = 1000;
      nodes = [
        {
          id: "node_1",
          nodeType: "MONITOR_STREAM",
          title: "Stream Real-Time L2/L3 Orderbook Depth",
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
          title: "Evaluate Portfolio Risk & VaR Drawdown Gate",
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
          postcondition: { verifier: "idempotency_key_active", params: { idempotencyKey: "idem_rebalance_01" } },
          params: '{"symbol": "NVDA", "action": "BUY", "quantity": 10, "orderType": "LIMIT", "maxSlippageBps": 15}'
        },
        {
          id: "node_4",
          nodeType: "NOTIFICATION",
          title: "Dispatch Execution Summary to Slack 2FA",
          tool: "slack_enterprise_block_kit",
          condition: "ON_SUCCESS",
          retryCount: 3,
          fallbackAction: "LOG_ONLY",
          postcondition: { verifier: "external_endpoint_status", params: { endpoint: "http://localhost:4000/api/v1/stats" } },
          params: '{"channel": "#quant-trading-alerts", "allowInline2Fa": true}'
        }
      ];
    }
    // Case 2: SRE / Infrastructure / Kubernetes / Cloud
    else if (promptLower.includes("k8s") || promptLower.includes("kubernetes") || promptLower.includes("pod") || promptLower.includes("sre") || promptLower.includes("log") || promptLower.includes("apm")) {
      domain = "Cloud Infrastructure & SRE";
      pipelineName = "Kubernetes Zero-Downtime Cluster Auto-Healer";
      spendCeilingUsd = 3000;
      hitlThresholdUsd = 500;
      nodes = [
        {
          id: "node_1",
          nodeType: "MONITOR_STREAM",
          title: "Poll APM Log Stream & P99 Latency Metrics",
          tool: "log_stream_anomaly_detector",
          condition: "ALWAYS_EXECUTE",
          retryCount: 3,
          fallbackAction: "ALERT_ON_CALL",
          postcondition: { verifier: "external_endpoint_status", params: { endpoint: "http://localhost:4000/api/v1/stats" } },
          params: '{"service": "payments-core", "surgeThreshold": "25%"}'
        },
        {
          id: "node_2",
          nodeType: "EXECUTE_ACTION",
          title: "Rotate Ephemeral DB Credentials in HashiCorp Vault",
          tool: "hashicorp_vault_token_rotation",
          condition: "ON_SUCCESS",
          retryCount: 2,
          fallbackAction: "RETRY_WITH_BACKOFF",
          postcondition: { verifier: "db_row_exists", params: { agentId: "agent-sre-lead" } },
          params: '{"vaultPath": "database/creds/billing-readonly", "ttl": "15m"}'
        },
        {
          id: "node_3",
          nodeType: "EXECUTE_ACTION",
          title: "Drain Degraded Kubernetes Pods with Istio Reroute",
          tool: "k8s_cluster_drain_restart",
          condition: "IF_ERROR_SURGE_GT_10PCT",
          retryCount: 1,
          fallbackAction: "TRIGGER_2FA_APPROVAL",
          postcondition: { verifier: "db_row_exists", params: { agentId: "agent-sre-lead" } },
          params: '{"cluster": "prod-us-east-1", "namespace": "payments-core", "maxSurge": "25%"}'
        }
      ];
    }
    // Case 3: Sales / CRM / Invoice / Treasury / Contract
    else {
      domain = "Enterprise Revenue & ERP";
      pipelineName = "Autonomous Enterprise Deal Closer & SAP Invoicing";
      spendCeilingUsd = 50000;
      hitlThresholdUsd = 2500;
      nodes = [
        {
          id: "node_1",
          nodeType: "EXECUTE_ACTION",
          title: "Sync Salesforce Opportunity to Closed-Won",
          tool: "salesforce_enterprise_sync",
          condition: "ALWAYS_EXECUTE",
          retryCount: 3,
          fallbackAction: "RETRY_WITH_BACKOFF",
          postcondition: { verifier: "db_row_exists", params: { agentId: "agent-sales-ae" } },
          params: '{"object": "Opportunity", "stage": "Closed-Won", "amount": 75000}'
        },
        {
          id: "node_2",
          nodeType: "A2A_DELEGATION",
          title: "Delegate Invoice Generation to Treasury via Google A2A",
          tool: "a2a_cross_delegation",
          condition: "ON_SUCCESS",
          retryCount: 2,
          fallbackAction: "TRIGGER_2FA_APPROVAL",
          postcondition: { verifier: "db_row_exists", params: { agentId: "agent-finance-treasury" } },
          params: '{"delegateeId": "agent-finance-treasury", "directive": "Issue Net-30 invoice", "amount": 75000}'
        },
        {
          id: "node_3",
          nodeType: "NOTIFICATION",
          title: "Post Interactive 2FA Block-Kit Confirmation in Slack",
          tool: "slack_enterprise_block_kit",
          condition: "ON_SUCCESS",
          retryCount: 3,
          fallbackAction: "LOG_ONLY",
          postcondition: { verifier: "external_endpoint_status", params: { endpoint: "http://localhost:4000/api/v1/stats" } },
          params: '{"channel": "#sales-executives", "allowInline2Fa": true}'
        }
      ];
    }

    const systemPrompt = generateDynamicPipelineSkill({
      pipelineName,
      domain,
      cliEngine: selectedCli,
      model: selectedModel,
      spendCeilingUsd,
      hitlThresholdUsd,
      nodes
    });

    return {
      success: true,
      pipelineName,
      domain,
      spendCeilingUsd,
      hitlThresholdUsd,
      cronInterval: 15,
      systemPrompt,
      nodes
    };
  }
}

export const pipelineSynthesizer = new PipelineSynthesizer();
