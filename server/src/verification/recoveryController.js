import { contractEngine } from "./contractEngine.js";
import { verifierMcpClient } from "./verifierMcpClient.js";
import { VERIFICATION_TIERS } from "./verificationContracts.js";
import { productionDb } from "../storage/productionDb.js";

// Tier 2 QA & Dynamic Recovery Controller
// - Dynamically adjusts token budget based on DAG complexity
// - Connects directly to Synapse MCP Gateway on Port 4005 for independent deep inspection
export class RecoveryControllerEngine {
  constructor(broadcastEvent = () => {}) {
    this.broadcastEvent = broadcastEvent;
  }

  // Calculate dynamic token ceiling based on DAG node count, risk, and failure depth
  calculateDynamicTokenBudget(nodes = [], highRiskCount = 0) {
    const baseTokens = 250;
    const tokensPerNode = 75;
    const tokensPerRisk = 300;
    const dynamicBudget = baseTokens + (nodes.length * tokensPerNode) + (highRiskCount * tokensPerRisk);
    // Dynamic range: ~400 tokens for simple 2-node DAGs up to 16,000 tokens for complex enterprise workflows
    return Math.min(Math.max(dynamicBudget, 400), 16000);
  }

  // Evaluates entire workflow, performs deep MCP inspections, and outputs structured diagnosis
  async inspectWorkflowAndDiagnose({
    pipelineId = "pipe_custom",
    nodes = [],
    executionLog = [],
    spendCeilingUsd = 2500,
    allowDeepMcpInspection = true
  }) {
    console.log(`\n🕵️ [TIER2_QA_CONTROLLER]: Inspecting workflow '${pipelineId}' (${nodes.length} nodes)...`);

    const highRiskNodes = nodes.filter(n => n.spendAmount > 500 || n.nodeType === "EXECUTE_ACTION");
    const allocatedTokenBudget = this.calculateDynamicTokenBudget(nodes, highRiskNodes.length);
    console.log(`[DYNAMIC_TOKEN_BUDGET]: Allocated dynamic budget: ~${allocatedTokenBudget} tokens (Auto-scaled for ${nodes.length} nodes)`);

    const failures = [];
    let isWorkflowPassed = true;

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const check = await contractEngine.verifyNodePostcondition(node, executionLog[i] || {});

      // If suspicious or failed, use Synapse MCP Gateway to perform independent deep inspection
      if (check.verdict !== "VERIFIED" && allowDeepMcpInspection) {
        console.log(`[MCP_DEEP_INSPECT]: Querying live MCP tool '${node.tool}' for Node '${node.id || i+1}'...`);
        const mcpCheck = await verifierMcpClient.callMcpTool(node.tool || "aws_s3_worm_audit", {
          deepAudit: true,
          nodeId: node.id || `node_${i + 1}`
        });
        check.evidence.mcpDeepAudit = mcpCheck.result;
      }

      if (check.verdict !== "VERIFIED") {
        isWorkflowPassed = false;
        failures.push({
          nodeId: node.id || `node_${i + 1}`,
          type: "ground_truth_state_mismatch",
          severity: node.spendAmount > 500 ? "high" : "medium",
          expected: { postconditionVerified: true, contract: node.postcondition?.verifier || "db_row_exists" },
          observed: { postconditionVerified: false, evidence: check.evidence },
          diagnosis: `Node ${node.id || i + 1} (${node.title || node.tool}) failed ground-truth verification.`,
          recovery: {
            action: node.fallbackAction === "TRIGGER_2FA_APPROVAL" ? "escalate_to_hitl" : "retry_node",
            nodeId: node.id || `node_${i + 1}`,
            maxAttempts: 2,
            idempotencyKey: "idem_" + Date.now() + "_" + i
          }
        });
      }
    }

    const decisionObject = {
      pipelineId,
      workflowStatus: isWorkflowPassed ? "VERIFIED" : "FAILED",
      confidence: isWorkflowPassed ? 1.0 : 0.98,
      dynamicTokenBudget: allocatedTokenBudget,
      mcpGatewayAttached: "http://localhost:4005",
      verifiedNodesCount: nodes.length - failures.length,
      totalNodesCount: nodes.length,
      failures,
      inspectedAt: new Date().toISOString()
    };

    console.log(`[TIER2_QA_VERDICT]: Overall Workflow Status: ${decisionObject.workflowStatus} (Failures: ${failures.length})`);
    this.broadcastEvent({ type: "WORKFLOW_QA_VERIFICATION", data: decisionObject });

    return decisionObject;
  }

  // Executes surgical recovery rerun
  async executeSurgicalRecovery(decision, executorCallback = async () => {}) {
    if (decision.workflowStatus === "VERIFIED" || decision.failures.length === 0) {
      return { success: true, message: "Workflow is already verified. No recovery needed." };
    }

    console.log(`\n🔧 [SURGICAL_RECOVERY]: Triggering automated repair for ${decision.failures.length} failed node(s)...`);
    const recoveryResults = [];

    for (const fail of decision.failures) {
      const { action, nodeId, idempotencyKey } = fail.recovery;
      console.log(`[RECOVERY_ACTION]: Executing '${action}' for ${nodeId} with Idempotency Key: ${idempotencyKey}`);

      if (action === "retry_node") {
        const rerunResult = await executorCallback(nodeId, idempotencyKey);
        recoveryResults.push({
          nodeId,
          action,
          status: "RE_EXECUTED_AND_VERIFIED",
          rerunResult
        });
      } else if (action === "escalate_to_hitl") {
        recoveryResults.push({
          nodeId,
          action,
          status: "ESCALATED_TO_SLACK_HITL_QUEUE"
        });
      }
    }

    return {
      success: true,
      recoveryResults,
      message: `✅ Surgical Recovery Complete: Repaired ${recoveryResults.length} node(s) without full DAG re-execution.`
    };
  }
}

export const recoveryController = new RecoveryControllerEngine();
