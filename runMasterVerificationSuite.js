let passedCount = 0;
let failedCount = 0;

function assert(cond, name) {
  if (cond) {
    console.log(`  ✅ [PASS] ${name}`);
    passedCount++;
  } else {
    console.error(`  ❌ [FAIL] ${name}`);
    failedCount++;
  }
}

async function runMasterSuite() {
  console.log("===============================================================");
  console.log("  SYNAPSE UNIVERSAL VERIFICATION & CONTROL PLANE MASTER TEST");
  console.log("===============================================================\n");

  const BASE = "http://localhost:4000/api/v1";

  // 1. Agent Creation Preflight
  console.log("1. Testing Agent Creation Preflight Verifier...");
  const agentRes = await fetch(`${BASE}/verification/agent/preflight`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Unguarded SRE Agent",
      tools: ["k8s_cluster_drain_restart"],
      hitlThresholdUsd: 0
    })
  }).then(r => r.json());
  assert(agentRes.status === "NEEDS_FIX", "Preflight: Correctly blocked unguarded destructive agent capability");

  // 2. DAG Design Preflight
  console.log("\n2. Testing DAG Design Preflight Verifier...");
  const dagRes = await fetch(`${BASE}/verification/dag/preflight`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Clean Quant Pipeline",
      nodes: [
        { title: "Stream Orderbook", tool: "market_data_orderbook_stream", nodeType: "MONITOR_STREAM", fallbackAction: "ALERT_ON_CALL" },
        { title: "Execute Limit Order", tool: "execute_limit_market_order", nodeType: "EXECUTE_ACTION", fallbackAction: "TRIGGER_2FA_APPROVAL", postcondition: { verifier: "db_row_exists" } }
      ]
    })
  }).then(r => r.json());
  assert(dagRes.status === "READY" && dagRes.nodeCount === 2, "Preflight: Certified clean DAG workflow design");

  // 3. Runtime Verification & Dynamic Early Termination
  console.log("\n3. Testing Runtime Verification & MCP Deep Inspection...");
  const runtimeRes = await fetch(`${BASE}/verification/workflow/diagnose`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pipelineId: "pipe_master_e2e",
      nodes: [
        { id: "node_1", title: "Valid Check", tool: "aws_s3_worm_audit", postcondition: { verifier: "db_row_exists", params: { agentId: "agent-sales-ae" } } },
        { id: "node_2", title: "Failed Check", tool: "hashicorp_vault_token_rotation", postcondition: { verifier: "file_hash_matches", params: { filePath: "missing.json" } } }
      ]
    })
  }).then(r => r.json());
  assert(runtimeRes.workflowStatus === "FAILED", "Runtime Verifier: Identified ground-truth state failure");
  assert(runtimeRes.failures.length === 1 && runtimeRes.failures[0].nodeId === "node_2", "Runtime Verifier: Formulated machine-readable diagnosis JSON");

  // 4. Policy-Gated Surgical Recovery
  console.log("\n4. Testing Policy-Gated Surgical Recovery Rerun...");
  const recoveryRes = await fetch(`${BASE}/verification/workflow/recover`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ decision: runtimeRes })
  }).then(r => r.json());
  assert(recoveryRes.success === true, "Policy Engine: Approved idempotent surgical recovery action");
  assert(recoveryRes.recoveryResults[0].status === "RE_EXECUTED_AND_VERIFIED", "Recovery Controller: Repaired single node without full DAG rerun");

  // 5. Universal CLI Dispatcher Verification
  console.log("\n5. Testing Multi-CLI Driver Spawning (Aider / Goose)...");
  const cliRes = await fetch(`${BASE}/engine/cli/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cliId: "aider", goal: "E2E Master Verification Task" })
  }).then(r => r.json());
  assert(cliRes.success === true && cliRes.pid > 0, "CLI Driver: Supervised OS subprocess spawned with MCP injection");

  console.log("\n===============================================================");
  console.log(`  MASTER SUITE RESULTS: ${passedCount} PASSED | ${failedCount} FAILED`);
  console.log("===============================================================");
}

runMasterSuite();
