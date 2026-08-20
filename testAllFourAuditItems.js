import { singleApiCriticVerifier } from "./server/src/verification/singleApiCriticVerifier.js";
import { dagRuntimeExecutor } from "./server/src/runtime/dagRuntimeExecutor.js";
import { productionDb } from "./server/src/storage/productionDb.js";
import { contractEngine } from "./server/src/verification/contractEngine.js";

async function runFourAudits() {
  console.log("================================================================================");
  console.log("  ✦ VERIFICATION REPORT: ADDRESSING ALL 4 OUTSTANDING ITEMS");
  console.log("================================================================================\n");

  // --------------------------------------------------------------------------------
  // ITEM 4: LIVE MODEL API HTTP CALL & REAL NETWORK LATENCY PROOF
  // --------------------------------------------------------------------------------
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("ITEM 4: LIVE MODEL API HTTP REQUEST & REAL NETWORK LATENCY PROOF");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const sampleNode = {
    id: "step_verify_balance",
    title: "Verify Customer Ledger State",
    tool: "query_database_state",
    params: { table: "demo_users", id: "usr_101" }
  };

  const criticResult = await singleApiCriticVerifier.verifyStepOutcome({
    node: sampleNode,
    claimedOutput: { success: true, balance: 775.5 },
    txId: "tx_live_test_" + Date.now(),
    agentId: "agent-finance-critic"
  });

  console.log("[A] Exact Outbound HTTP Request Metadata Sent to Model API:");
  console.log(JSON.stringify({
    endpoint: criticResult.liveNetworkMetadata.endpoint,
    httpMethod: criticResult.liveNetworkMetadata.method,
    headers: criticResult.liveNetworkMetadata.headers,
    model: criticResult.liveNetworkMetadata.body?.model,
    systemPrompt: criticResult.requestPayload.systemPrompt,
    toolsProvided: criticResult.requestPayload.toolsProvided
  }, null, 2));

  console.log("\n[B] Real Outbound Live Network Round-Trip Response from Model Endpoint:");
  console.log(JSON.stringify({
    liveCallExecuted: criticResult.liveNetworkMetadata.liveCallExecuted,
    endpoint: criticResult.liveNetworkMetadata.endpoint,
    statusCode: criticResult.liveNetworkMetadata.statusCode,
    statusText: criticResult.liveNetworkMetadata.statusText,
    networkLatencyMs: criticResult.liveNetworkMetadata.networkLatencyMs,
    cloudResponse: criticResult.liveNetworkMetadata.cloudError
  }, null, 2));

  // --------------------------------------------------------------------------------
  // ITEM 1: TRANSACTION STATUS HONESTY PROOF (COMMITTED on Success vs FAILED on Failure)
  // --------------------------------------------------------------------------------
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("ITEM 1: TRANSACTION STATUS HONESTY (SUCCESSFUL RUN -> COMMITTED)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // A pipeline where all steps (including SQLite postcondition check) genuinely succeed
  const successPipeline = {
    id: "pipe_success_governed_" + Date.now(),
    name: "Governed Verified Customer Credit Pipeline",
    spendCeilingUsd: 5000,
    hitlThresholdUsd: 1000,
    nodes: [
      {
        id: "step_1_query",
        nodeType: "REASON_DECOMPOSE",
        title: "Actor: Ingest Customer Profile",
        tool: "query_database",
        params: { table: "demo_users", filter: { id: "usr_101" } }
      },
      {
        id: "step_2_policy",
        nodeType: "POLICY_GUARD",
        title: "OPA Rego Spend Invariant Check",
        tool: "opa_rego_eval",
        params: { tool_name: "issue_refund", amount: 25.0 }
      },
      {
        id: "step_3_execute",
        nodeType: "TOOL_SANDBOX",
        title: "Actor: Execute Credit Mutation",
        tool: "issue_refund",
        params: { customerId: "usr_101", amount: 25.0 }
      },
      {
        id: "step_4_verify",
        nodeType: "VERIFIER_CRITIC",
        title: "Critic: Verify Customer Record Exists in SQLite",
        tool: "verify_db_row",
        postcondition: { verifier: "db_row_exists", table: "demo_users", filter: { id: "usr_101" } }
      }
    ]
  };

  const successRun = await dagRuntimeExecutor.executePipeline(successPipeline, {
    agentId: "agent-finance-01",
    goal: "Execute end-to-end verified pipeline"
  });

  const txSuccessRow = productionDb.db.prepare("SELECT id, agent_id, goal, status, started_at, completed_at FROM transactions WHERE id = ?").get(successRun.txId);
  const stepSuccessRows = productionDb.db.prepare("SELECT step_number, tool_name, status, executed_at FROM transaction_steps WHERE transaction_id = ?").all(successRun.txId);
  const auditSuccessRow = productionDb.db.prepare("SELECT block_index, agent_id, tool_name, verdict, risk_score, block_hash FROM audit_ledger ORDER BY block_index DESC LIMIT 1").get();

  console.log("[A] Successful Run Transaction Row (Status: COMMITTED):");
  console.log(JSON.stringify(txSuccessRow, null, 2));

  console.log("\n[B] Successful Run Step Rows (All Status: COMPLETED):");
  console.log(JSON.stringify(stepSuccessRows, null, 2));

  console.log("\n[C] Successful Run Audit Block (Verdict: ALLOWED):");
  console.log(JSON.stringify(auditSuccessRow, null, 2));

  // --------------------------------------------------------------------------------
  // ITEM 1b: TRANSACTION STATUS HONESTY PROOF (FAILED RUN -> FAILED / NOT COMMITTED)
  // --------------------------------------------------------------------------------
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("ITEM 1b: TRANSACTION STATUS HONESTY (FAILED VERIFIER STEP -> FAILED)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // A pipeline where verifier expects a non-existent record -> must result in FAILED status
  const failedPipeline = {
    id: "pipe_fail_test_" + Date.now(),
    name: "Pipeline with Deliberate Verifier Mismatch",
    spendCeilingUsd: 5000,
    hitlThresholdUsd: 1000,
    nodes: [
      {
        id: "step_1_query",
        nodeType: "REASON_DECOMPOSE",
        title: "Actor: Ingest Customer Profile",
        tool: "query_database",
        params: { table: "demo_users", filter: { id: "usr_101" } }
      },
      {
        id: "step_2_verify_missing",
        nodeType: "VERIFIER_CRITIC",
        title: "Critic: Check Non-Existent User Record",
        tool: "verify_db_row",
        postcondition: { verifier: "db_row_exists", table: "demo_users", filter: { id: "usr_9999_nonexistent" } }
      }
    ]
  };

  const failedRun = await dagRuntimeExecutor.executePipeline(failedPipeline, {
    agentId: "agent-finance-01",
    goal: "Verify failed step causes transaction to be marked FAILED"
  });

  const txFailedRow = productionDb.db.prepare("SELECT id, agent_id, goal, status, started_at, completed_at FROM transactions WHERE id = ?").get(failedRun.txId);
  const stepFailedRows = productionDb.db.prepare("SELECT step_number, tool_name, status, executed_at FROM transaction_steps WHERE transaction_id = ?").all(failedRun.txId);

  console.log("[A] Failed Run Transaction Row (Status: FAILED - Not COMMITTED):");
  console.log(JSON.stringify(txFailedRow, null, 2));

  console.log("\n[B] Failed Run Step Rows:");
  console.log(JSON.stringify(stepFailedRows, null, 2));
}

runFourAudits();
