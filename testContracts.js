import { contractEngine } from "./server/src/verification/contractEngine.js";
import { recoveryController } from "./server/src/verification/recoveryController.js";

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

async function runContractSuite() {
  console.log("===============================================================");
  console.log("  SYNAPSE VERIFICATION CONTRACT & RECOVERY CONTROLLER TEST");
  console.log("===============================================================\n");

  // 1. Tier 1 Ground-Truth DB Check
  console.log("1. Testing Tier 1 Ground-Truth Verification (No LLM Tokens)...");
  const check1 = await contractEngine.verifyNodePostcondition({
    id: "node_db_1",
    postcondition: { verifier: "db_row_exists", params: { agentId: "agent-sales-ae" } }
  });
  assert(check1.verdict === "VERIFIED" && check1.evidence.recordFound === true, "Tier 1: Ground-truth DB row verified in SQLite");

  // 2. Tier 1 File Hash Ground-Truth Check
  const check2 = await contractEngine.verifyNodePostcondition({
    id: "node_hash_1",
    postcondition: { verifier: "file_hash_matches", params: { filePath: "server/src/index.js" } }
  });
  assert(check2.verdict === "VERIFIED" && check2.evidence.actualHash.length === 64, "Tier 1: SHA-256 ground-truth hash matched");

  // 3. Tier 2 QA & Diagnostic Controller
  console.log("\n2. Testing Tier 2 QA & Structured Diagnosis Generation...");
  const mockNodes = [
    { id: "node_1", title: "Valid Step", tool: "query_db", postcondition: { verifier: "db_row_exists", params: { agentId: "agent-sales-ae" } } },
    { id: "node_2", title: "Failed Step", tool: "bad_file", fallbackAction: "RETRY_WITH_BACKOFF", postcondition: { verifier: "file_hash_matches", params: { filePath: "non_existent.js" } } }
  ];

  const diagnosis = await recoveryController.inspectWorkflowAndDiagnose({
    pipelineId: "pipe_test_e2e",
    nodes: mockNodes
  });

  assert(diagnosis.workflowStatus === "FAILED", "Tier 2: Caught ground-truth failure in workflow");
  assert(diagnosis.failures.length === 1 && diagnosis.failures[0].nodeId === "node_2", "Tier 2: Formulated structured machine-readable diagnosis JSON");
  assert(diagnosis.failures[0].recovery.action === "retry_node", "Tier 2: Correctly assigned 'retry_node' recovery action");

  // 4. Surgical Recovery Rerun
  console.log("\n3. Testing Surgical Recovery Execution (No Full DAG Re-Run)...");
  const recoveryResult = await recoveryController.executeSurgicalRecovery(diagnosis, async (nodeId, idempotencyKey) => {
    return { reExecutedNode: nodeId, idempotencyKey, success: true };
  });

  assert(recoveryResult.success === true, "Recovery Controller: Executed surgical rerun of failed node");
  assert(recoveryResult.recoveryResults[0].status === "RE_EXECUTED_AND_VERIFIED", "Recovery Controller: Single node repaired and verified");

  console.log("\n===============================================================");
  console.log(`  VERIFICATION TEST RESULTS: ${passedCount} PASSED | ${failedCount} FAILED`);
  console.log("===============================================================");
}

runContractSuite();
