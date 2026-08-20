import { dagRuntimeExecutor } from "./server/src/runtime/dagRuntimeExecutor.js";
import { productionDb } from "./server/src/storage/productionDb.js";
import { sandboxedEnvironmentEngine } from "./server/src/runtime/sandboxedEnvironmentEngine.js";

async function runChecks() {
  console.log("================================================================================");
  console.log("  ✦ RUNNING PHASE 1 VERIFICATION CHECKS (RISK VARIANCE & K8S STUB LOGGING)");
  console.log("================================================================================\n");

  // --------------------------------------------------------------------------------
  // CHECK 1: Dynamic Risk Score Variance
  // --------------------------------------------------------------------------------
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("1. RISK SCORE VARIANCE PROOF (CALLING dagRuntimeExecutor WITH DIFFERENT INPUTS)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // Run A: Low risk step ($50 query)
  const lowRiskPipeline = {
    id: "pipe_low_risk_" + Date.now(),
    name: "Low Risk Pipeline",
    domain: "Test",
    cliEngine: "node",
    model: "deepseek-r1",
    spendCeilingUsd: 1000,
    hitlThresholdUsd: 500,
    cronInterval: 0,
    nodes: [
      {
        id: "step_low",
        nodeType: "TOOL_SANDBOX",
        title: "Standard Read Operation",
        tool: "query_database",
        params: { query: "SELECT 1", amount: 50 }
      }
    ]
  };

  productionDb.insertPipeline(lowRiskPipeline);
  await dagRuntimeExecutor.executePipeline(lowRiskPipeline);

  // Run B: Higher risk step ($450 refund on $500 ceiling)
  const highRiskPipeline = {
    id: "pipe_high_risk_" + Date.now(),
    name: "High Risk Pipeline",
    domain: "Test",
    cliEngine: "node",
    model: "deepseek-r1",
    spendCeilingUsd: 500,
    hitlThresholdUsd: 300,
    cronInterval: 0,
    nodes: [
      {
        id: "step_high",
        nodeType: "TOOL_SANDBOX",
        title: "Large Spend Refund Operation",
        tool: "issue_refund",
        params: { amount: 450, reason: "Customer dispute" }
      }
    ]
  };

  productionDb.insertPipeline(highRiskPipeline);
  await dagRuntimeExecutor.executePipeline(highRiskPipeline);

  console.log("\n[EXACT RAW SQLITE AUDIT_LEDGER ROW - LOW RISK RUN]:");
  const lowRiskAudit = productionDb.db.prepare("SELECT block_index, timestamp, agent_id, tool_name, verdict, risk_score, block_hash FROM audit_ledger WHERE agent_id = ? ORDER BY block_index DESC LIMIT 1").get(lowRiskPipeline.id);
  console.log(JSON.stringify(lowRiskAudit, null, 2));

  console.log("\n[EXACT RAW SQLITE AUDIT_LEDGER ROW - HIGH RISK RUN]:");
  const highRiskAudit = productionDb.db.prepare("SELECT block_index, timestamp, agent_id, tool_name, verdict, risk_score, block_hash FROM audit_ledger WHERE agent_id = ? ORDER BY block_index DESC LIMIT 1").get(highRiskPipeline.id);
  console.log(JSON.stringify(highRiskAudit, null, 2));

  // --------------------------------------------------------------------------------
  // CHECK 2: K8s Stub Honesty & Explicit Logging
  // --------------------------------------------------------------------------------
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("2. K8S TOOL STUB HONESTY CHECK (EXECUTING k8s_cluster_drain_restart)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const k8sPipeline = {
    id: "pipe_k8s_test_" + Date.now(),
    name: "K8s Execution Test",
    domain: "Cloud Ops",
    cliEngine: "node",
    model: "deepseek-r1",
    spendCeilingUsd: 2000,
    hitlThresholdUsd: 1000,
    cronInterval: 0,
    nodes: [
      {
        id: "k8s_step",
        nodeType: "TOOL_SANDBOX",
        title: "Drain Cluster Pods",
        tool: "k8s_cluster_drain_restart",
        params: { cluster: "prod-us-east-1", service: "checkout-api" }
      }
    ]
  };

  productionDb.insertPipeline(k8sPipeline);
  const k8sExecResult = await dagRuntimeExecutor.executePipeline(k8sPipeline);

  console.log("\n[K8S STEP OUTPUT OBJECT RETURNED BY EXECUTOR]:");
  console.log(JSON.stringify(k8sExecResult.nodeOutputs["k8s_step"], null, 2));
}

runChecks();
