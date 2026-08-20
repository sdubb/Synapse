import { ADVANCED_AGENT_TOOL_REGISTRY } from "../templates/advancedTools.js";

// Static Pipeline Verifier / Linter for Synapse DAGs
// Audits safety, idempotency, ground-truth verification contracts, and governance invariants.
export class StaticPipelineVerifier {
  constructor() {
    this.allTools = ADVANCED_AGENT_TOOL_REGISTRY.flatMap(cat => cat.tools);
    this.financialTools = [
      "execute_limit_market_order",
      "stripe_treasury_payout",
      "sap_erp_ledger_reconcile",
      "binance_trade_execute",
      "crypto_arbitrage_execute",
      "salesforce_enterprise_sync"
    ];
  }

  verifyPipelineDAG(pipeline) {
    const issues = [];
    const nodes = pipeline.nodes || [];
    const name = pipeline.name || pipeline.pipelineName || "Unnamed Pipeline";

    // 1. Structural DAG Check
    if (nodes.length === 0) {
      issues.push({
        code: "EMPTY_DAG",
        severity: "ERROR",
        message: "Pipeline contains zero executable nodes.",
        autoFixAvailable: false
      });
      return { status: "FAIL", issues, canAutoFix: false, auditedAt: new Date().toISOString() };
    }

    // 2. Spend Hierarchy Check
    const spendCeiling = Number(pipeline.spendCeilingUsd) || 5000;
    const hitlThreshold = Number(pipeline.hitlThresholdUsd) || 1000;
    if (hitlThreshold > spendCeiling) {
      issues.push({
        code: "INVALID_SPEND_HIERARCHY",
        severity: "ERROR",
        message: `Human 2FA threshold ($${hitlThreshold}) exceeds hard spend ceiling ($${spendCeiling}).`,
        autoFixAvailable: true,
        fixAction: "ADJUST_HITL_THRESHOLD",
        recommendedValue: Math.min(hitlThreshold, spendCeiling * 0.5)
      });
    }

    // 3. Node-by-Node Invariant Verification
    nodes.forEach((node, idx) => {
      const nodeNum = idx + 1;
      const nodeTitle = node.title || `Node ${nodeNum}`;
      const toolId = node.tool;

      // Check tool presence
      if (!toolId) {
        issues.push({
          code: "NODE_MISSING_TOOL",
          severity: "ERROR",
          nodeId: node.id || `node_${nodeNum}`,
          nodeIndex: idx,
          message: `Node ${nodeNum} ("${nodeTitle}") has no tool assigned.`,
          autoFixAvailable: true,
          fixAction: "ASSIGN_DEFAULT_TOOL"
        });
      }

      // Check Fallback / Failure Path
      if (!node.fallbackAction) {
        issues.push({
          code: "MISSING_FALLBACK_PATH",
          severity: "WARNING",
          nodeId: node.id || `node_${nodeNum}`,
          nodeIndex: idx,
          message: `Node ${nodeNum} ("${nodeTitle}") has no failure fallback action defined.`,
          autoFixAvailable: true,
          fixAction: "ATTACH_FALLBACK",
          recommendedValue: "ALERT_ON_CALL"
        });
      }

      // Check Financial / Money Movement Postcondition & Idempotency
      const isFinancial = this.financialTools.includes(toolId) ||
        (node.nodeType === "EXECUTE_ACTION" && (toolId?.includes("order") || toolId?.includes("payout") || toolId?.includes("ledger") || toolId?.includes("reconcile") || toolId?.includes("sync")));

      if (isFinancial) {
        if (!node.postcondition || !node.postcondition.verifier) {
          issues.push({
            code: "FINANCIAL_ACTION_UNVERIFIED",
            severity: "ERROR",
            nodeId: node.id || `node_${nodeNum}`,
            nodeIndex: idx,
            message: `Financial/state execution Node ${nodeNum} ("${nodeTitle}") lacks a verification postcondition contract.`,
            autoFixAvailable: true,
            fixAction: "ATTACH_VERIFICATION_CONTRACT",
            recommendedContract: {
              verifier: "idempotency_key_active",
              params: { idempotencyKey: `idem_${node.id || nodeNum}_${Date.now().toString(36)}` }
            }
          });
        }

        // Check Idempotency Key in params if retries enabled
        if (node.retryCount > 1) {
          let hasIdempotency = false;
          try {
            const parsed = typeof node.params === "string" ? JSON.parse(node.params || "{}") : (node.params || {});
            if (parsed.idempotencyKey || (node.postcondition?.verifier === "idempotency_key_active")) {
              hasIdempotency = true;
            }
          } catch (e) {}

          if (!hasIdempotency) {
            issues.push({
              code: "NON_IDEMPOTENT_RETRY_RISK",
              severity: "WARNING",
              nodeId: node.id || `node_${nodeNum}`,
              nodeIndex: idx,
              message: `Node ${nodeNum} ("${nodeTitle}") allows ${node.retryCount} retries on state-changing execution without an explicit idempotency key.`,
              autoFixAvailable: true,
              fixAction: "INJECT_IDEMPOTENCY_KEY"
            });
          }
        }
      }

      // Check params JSON validity if string
      if (typeof node.params === "string" && node.params.trim().length > 0) {
        try {
          JSON.parse(node.params);
        } catch (e) {
          issues.push({
            code: "INVALID_JSON_PARAMS",
            severity: "ERROR",
            nodeId: node.id || `node_${nodeNum}`,
            nodeIndex: idx,
            message: `Node ${nodeNum} parameters contain malformed JSON: ${e.message}`,
            autoFixAvailable: true,
            fixAction: "SANITIZE_JSON"
          });
        }
      }
    });

    const hasErrors = issues.some(i => i.severity === "ERROR");
    const hasWarnings = issues.some(i => i.severity === "WARNING");
    const status = hasErrors ? "FAIL" : (hasWarnings ? "WARNING" : "PASS");

    return {
      status,
      pipelineName: name,
      nodeCount: nodes.length,
      issues,
      canAutoFix: issues.some(i => i.autoFixAvailable),
      auditedAt: new Date().toISOString()
    };
  }

  // Auto-repairs DAG issues found during static preflight audit
  autoRepairDAG(pipeline) {
    const cloned = JSON.parse(JSON.stringify(pipeline));
    const nodes = cloned.nodes || [];
    const audit = this.verifyPipelineDAG(cloned);
    const fixesApplied = [];

    // Fix spend hierarchy
    if (cloned.spendCeilingUsd && cloned.hitlThresholdUsd && cloned.hitlThresholdUsd > cloned.spendCeilingUsd) {
      const oldHitl = cloned.hitlThresholdUsd;
      cloned.hitlThresholdUsd = Math.round(cloned.spendCeilingUsd * 0.4);
      fixesApplied.push(`Adjusted 2FA threshold from $${oldHitl} to $${cloned.hitlThresholdUsd} (under spend ceiling $${cloned.spendCeilingUsd}).`);
    }

    nodes.forEach((node, idx) => {
      const nodeNum = idx + 1;

      // Fix missing fallback
      if (!node.fallbackAction) {
        node.fallbackAction = node.nodeType === "EXECUTE_ACTION" ? "TRIGGER_2FA_APPROVAL" : "ALERT_ON_CALL";
        fixesApplied.push(`Node ${nodeNum}: Attached fallback '${node.fallbackAction}'.`);
      }

      // Fix missing postcondition on financial execution
      const isFinancial = this.financialTools.includes(node.tool) ||
        (node.nodeType === "EXECUTE_ACTION" && (node.tool?.includes("order") || node.tool?.includes("payout") || node.tool?.includes("ledger") || node.tool?.includes("sync")));

      if (isFinancial && (!node.postcondition || !node.postcondition.verifier)) {
        const idemKey = `idem_${node.id || "node_" + nodeNum}_${Date.now().toString(36)}`;
        node.postcondition = {
          verifier: "idempotency_key_active",
          params: { idempotencyKey: idemKey }
        };
        fixesApplied.push(`Node ${nodeNum}: Attached verification contract 'idempotency_key_active' [${idemKey}].`);
      }

      // Sanitize JSON
      if (typeof node.params === "string") {
        try {
          JSON.parse(node.params);
        } catch (e) {
          node.params = "{}";
          fixesApplied.push(`Node ${nodeNum}: Reset corrupted JSON parameters to valid empty object.`);
        }
      }
    });

    cloned.nodes = nodes;
    const postRepairAudit = this.verifyPipelineDAG(cloned);

    return {
      repairedPipeline: cloned,
      fixesApplied,
      originalIssuesCount: audit.issues.length,
      remainingIssuesCount: postRepairAudit.issues.length,
      postRepairStatus: postRepairAudit.status
    };
  }
}

export const staticPipelineVerifier = new StaticPipelineVerifier();
