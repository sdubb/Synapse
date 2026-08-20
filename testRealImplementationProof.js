import assert from "assert";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { productionDb } from "./server/src/storage/productionDb.js";
import { realRegoEvaluator } from "./server/src/policy/realRegoEvaluator.js";
import { dagRuntimeExecutor } from "./server/src/runtime/dagRuntimeExecutor.js";
import { contractEngine } from "./server/src/verification/contractEngine.js";
import { ADVANCED_AGENT_TOOL_REGISTRY } from "./server/src/templates/advancedTools.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runRealImplementationProof() {
  console.log("================================================================================");
  console.log("  ✦ SYNAPSEGUARD: CONCRETE IMPLEMENTATION & AUDIT PROOF SUITE");
  console.log("================================================================================\n");

  // --------------------------------------------------------------------------------
  // REQUIREMENT 1: Concrete TOOL_SANDBOX Node Execution (Signatures, Schema & Hard Assertions)
  // --------------------------------------------------------------------------------
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("1. CONCRETE NODE TYPE: TOOL_SANDBOX");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const testNode = {
    id: "node_k8s_drain_01",
    nodeType: "TOOL_SANDBOX",
    title: "Execute Surgical Canary Drain & Safe Pod Restart",
    tool: "k8s_cluster_drain_restart",
    postcondition: {
      verifier: "idempotency_key_active",
      params: { idempotencyKey: "idem_k8s_drain_prod_01" }
    },
    params: {
      cluster: "prod-us-east-1",
      service: "checkout-api",
      gracePeriodSeconds: 30,
      idempotencyKey: "idem_k8s_drain_prod_01"
    }
  };

  const testContext = {
    txId: "tx_proof_" + Date.now(),
    pipelineId: "pipe_proof_k8s",
    pipelineName: "K8s Auto-Healer Proof",
    spendCeilingUsd: 3000,
    hitlThresholdUsd: 500,
    accumulatedSpendUsd: 0,
    state: {},
    nodeOutputs: {},
    stepIndex: 1,
    isHalted: false,
    haltReason: null
  };

  console.log("\n[INPUT SCHEMA]:");
  console.log(JSON.stringify({
    functionSignature: "executeSandboxedTool(toolId: string, params: Object, context: ExecutionContext)",
    nodeId: testNode.id,
    tool: testNode.tool,
    parameters: testNode.params
  }, null, 2));

  // Execute the TOOL_SANDBOX handler
  const toolOutput = await dagRuntimeExecutor._executeSandboxedTool(testNode.tool, testNode.params, testContext);

  console.log("\n[OUTPUT SCHEMA RETURNED]:");
  console.log(JSON.stringify(toolOutput, null, 2));

  // Hard Assertions
  assert.strictEqual(typeof toolOutput, "object", "Output must be an object");
  assert.strictEqual(toolOutput.action, "DRAIN_AND_RESTART", "Tool action must be DRAIN_AND_RESTART");
  assert.strictEqual(toolOutput.cluster, "prod-us-east-1", "Cluster must match input parameter");
  assert.strictEqual(toolOutput.service, "checkout-api", "Service must match input parameter");
  assert.strictEqual(toolOutput.status, "ZERO_DOWNTIME_SUCCESS", "Status must be ZERO_DOWNTIME_SUCCESS");
  assert.strictEqual(toolOutput.idempotencyKey, "idem_k8s_drain_prod_01", "Idempotency key must be active");
  assert.strictEqual(typeof toolOutput.podsRestarted, "number", "Pods restarted count must be numeric");

  // Postcondition Contract Check on Output
  const contractCheck = await contractEngine.verifyNodePostcondition(testNode, toolOutput);
  assert.strictEqual(contractCheck.verdict, "VERIFIED", "Contract check must verify idempotency key");

  console.log("\n✅ [PASS] Requirement 1: TOOL_SANDBOX input/output schema and hard assertions verified.");

  // --------------------------------------------------------------------------------
  // REQUIREMENT 2: Open Policy Agent (OPA) Rego Policy File & Rule Evaluations
  // --------------------------------------------------------------------------------
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("2. OPA REGO POLICY EVALUATION & PROOF");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const regoPath = path.resolve(__dirname, "server/src/policy/governance.rego");
  const regoContent = fs.readFileSync(regoPath, "utf-8");

  console.log(`[REGO POLICY SOURCE FILE]: ${regoPath}`);
  console.log("────────────────────────────────────────────────────────────────────────────────");
  console.log(regoContent.trim());
  console.log("────────────────────────────────────────────────────────────────────────────────");

  // Test Rego Rule 1: Financial Auto-Allow (<= $300)
  const evalRule1 = realRegoEvaluator.evaluate({ tool_name: "issue_refund", amount: 150.00 });
  assert.strictEqual(evalRule1.verdict, "ALLOWED", "Rule 1: Refund <= $300 must be ALLOWED");
  assert.strictEqual(evalRule1.riskScore, 5, "Rule 1: Risk score for allowed transaction must be 5");
  console.log(`\n• Test Rule 1 (Refund $150 <= $300): Verdict = ${evalRule1.verdict} (Latency: ${evalRule1.latencyMs}ms)`);

  // Test Rego Rule 2: Tri-State HITL Approval ($300 < amount <= $500)
  const evalRule2 = realRegoEvaluator.evaluate({ tool_name: "issue_refund", amount: 450.00 });
  assert.strictEqual(evalRule2.verdict, "HELD_FOR_APPROVAL", "Rule 2: Refund $450 must be HELD_FOR_APPROVAL");
  assert.strictEqual(evalRule2.riskScore, 55, "Rule 2: Risk score for 2FA must be 55");
  console.log(`• Test Rule 2 (Refund $450 in $300-$500 window): Verdict = ${evalRule2.verdict} (${evalRule2.reason})`);

  // Test Rego Rule 2 (Deny): Exceeds hard ceiling (> $500)
  const evalRule2Deny = realRegoEvaluator.evaluate({ tool_name: "issue_refund", amount: 1200.00 });
  assert.strictEqual(evalRule2Deny.verdict, "BLOCKED", "Rule 2 (Deny): Refund $1200 > $500 must be BLOCKED");
  assert.strictEqual(evalRule2Deny.riskScore, 95, "Rule 2 (Deny): High risk score for ceiling breach");
  console.log(`• Test Rule 2 (Refund $1200 > $500 ceiling): Verdict = ${evalRule2Deny.verdict} (${evalRule2Deny.reason})`);

  // Test Rego Rule 3: Zero-Destruction Invariant (DROP table / terminate_all)
  const evalRule3 = realRegoEvaluator.evaluate({ tool_name: "query_database", query_or_command: "DROP TABLE audit_ledger;" });
  assert.strictEqual(evalRule3.verdict, "BLOCKED", "Rule 3: DROP command must be BLOCKED");
  assert.strictEqual(evalRule3.riskScore, 99, "Rule 3: Max risk score for destructive command");
  console.log(`• Test Rule 3 (Destructive command 'DROP TABLE'): Verdict = ${evalRule3.verdict} (${evalRule3.reason})`);

  // Test Rego Rule 4: Compound Sequence Invariant (disable_audit followed by bulk_delete)
  const evalRule4 = realRegoEvaluator.evaluate({
    tool_name: "bulk_delete",
    session_trajectory: [{ tool_name: "disable_audit_logging" }]
  });
  assert.strictEqual(evalRule4.verdict, "BLOCKED", "Rule 4: disable_audit followed by bulk_delete must be BLOCKED");
  console.log(`• Test Rule 4 (Compound Evasion: disable_audit -> bulk_delete): Verdict = ${evalRule4.verdict} (${evalRule4.reason})`);

  console.log("\n✅ [PASS] Requirement 2: All 4 Rego policy rules verified with hard assertions.");

  // --------------------------------------------------------------------------------
  // REQUIREMENT 3: End-to-End Real Pipeline Execution & SQLite Audit Ledger Proof
  // --------------------------------------------------------------------------------
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("3. END-TO-END PIPELINE RUN & SQLITE AUDIT LEDGER PROOF");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const livePipeline = {
    id: "pipe_live_k8s_healer",
    name: "Kubernetes Canary Auto-Healer & SLA Guard",
    domain: "Cloud Infrastructure & SRE",
    cliEngine: "Aider",
    model: "deepseek-r1:70b",
    spendCeilingUsd: 3000,
    hitlThresholdUsd: 500,
    cronInterval: 15,
    nodes: [
      {
        id: "node_1",
        nodeType: "MONITOR_STREAM",
        title: "Ingest APM Telemetry & Memory Leak Anomaly",
        tool: "log_stream_anomaly_detector",
        condition: "ALWAYS_EXECUTE",
        params: { service: "checkout-api", metric: "memory_leak_surge", surgePercent: 35 }
      },
      {
        id: "node_2",
        nodeType: "CONDITIONAL_BRANCH",
        title: "Evaluate SLA Breach Risk Boundary",
        tool: "cloudwatch_datadog_alarm_poll",
        condition: "IF_METRIC_BREACH",
        fallbackAction: "HALT_PIPELINE",
        params: { volatility: 3.2, errorRateThreshold: 0.05 }
      },
      {
        id: "node_3",
        nodeType: "EXECUTE_ACTION",
        title: "Drain Canary Pod & Execute Zero-Downtime Restart",
        tool: "k8s_cluster_drain_restart",
        fallbackAction: "ALERT_ON_CALL",
        postcondition: { verifier: "idempotency_key_active", params: { idempotencyKey: "idem_k8s_healer_01" } },
        params: { cluster: "prod-us-east-1", service: "checkout-api", idempotencyKey: "idem_k8s_healer_01" }
      }
    ]
  };

  // Save pipeline to SQLite DB
  productionDb.insertPipeline(livePipeline);

  // Execute the real pipeline DAG
  const executionResult = await dagRuntimeExecutor.executePipeline(livePipeline);

  assert.strictEqual(executionResult.status, "COMMITTED", "Pipeline execution must commit successfully");
  assert.strictEqual(Object.keys(executionResult.nodeOutputs).length, 3, "All 3 nodes must produce outputs");

  // Query Real SQLite Database Rows
  console.log("\n[SQLITE DATABASE: TRANSACTIONS ROW]");
  const dbTx = productionDb.db.prepare("SELECT * FROM transactions WHERE id = ?").get(executionResult.txId);
  console.table([dbTx]);

  console.log("\n[SQLITE DATABASE: TRANSACTION_STEPS ROWS]");
  const dbSteps = productionDb.db.prepare("SELECT step_number, tool_name, status, parameters_json, executed_at FROM transaction_steps WHERE transaction_id = ?").all(executionResult.txId);
  console.table(dbSteps);

  console.log("\n[SQLITE DATABASE: AUDIT_LEDGER CRYPTOGRAPHIC HASH CHAIN (LATEST 3 BLOCKS)]");
  const auditBlocks = productionDb.db.prepare("SELECT block_index, timestamp, agent_id, tool_name, verdict, reason, risk_score, prev_hash, block_hash FROM audit_ledger ORDER BY block_index DESC LIMIT 3").all();
  console.table(auditBlocks);

  // Assertions on SQLite state
  assert.ok(dbTx, "Transaction row must exist in SQLite");
  assert.strictEqual(dbTx.status, "COMMITTED", "Transaction status in SQLite must be COMMITTED");
  assert.strictEqual(dbSteps.length, 3, "SQLite must contain 3 executed step records");
  assert.ok(auditBlocks.length >= 3, "Audit ledger must contain cryptographic block records");
  
  // Verify hash-chain linkage (Block N prev_hash matches Block N-1 block_hash)
  if (auditBlocks.length >= 2) {
    const blockN = auditBlocks[0];
    const blockNMinus1 = auditBlocks[1];
    assert.strictEqual(blockN.prev_hash, blockNMinus1.block_hash, "Cryptographic hash chain must be strictly linked (Block N prev_hash == Block N-1 block_hash)");
    console.log("🔗 [HASH CHAIN VERIFIED]: Block #" + blockN.block_index + " prev_hash matches Block #" + blockNMinus1.block_index + " block_hash.");
  }

  console.log("\n✅ [PASS] Requirement 3: Real SQLite database records and cryptographic audit chain verified.");

  console.log("\n================================================================================");
  console.log("  ✦ ALL 3 REAL IMPLEMENTATION PROOFS PASSED WITH ZERO MOCKS");
  console.log("================================================================================");
}

runRealImplementationProof();
