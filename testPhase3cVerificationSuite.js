import { EnterpriseConnectorRegistry } from "./server/src/connectors/enterpriseConnectors.js";
import { realSecretsVault } from "./server/src/secrets/realSecretsVault.js";
import { slackDispatcher } from "./server/src/slack/slackDispatcher.js";
import { qaEngine } from "./server/src/qa/qaEngine.js";
import { pentestEngine } from "./server/src/pentest/pentestEngine.js";
import { dagRuntimeExecutor } from "./server/src/runtime/dagRuntimeExecutor.js";
import { productionDb } from "./server/src/storage/productionDb.js";

async function runPhase3cVerifications() {
  console.log("================================================================================");
  console.log("  ✦ PHASE 3c FINAL VERIFICATION SUITE: CONNECTORS, SLACK, QA ENGINE, PENTEST, DAG");
  console.log("================================================================================\n");

  // --------------------------------------------------------------------------------
  // 1. ENTERPRISE CONNECTOR HONESTY & LIVE NETWORK PROBE
  // --------------------------------------------------------------------------------
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("1. ENTERPRISE CONNECTOR: CREDENTIAL_STORED & REAL HTTPS LIVE NETWORK PROBE");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const registry = new EnterpriseConnectorRegistry();

  // (A) Check without credential
  const unconfiguredHealth = await registry.checkConnectorHealth("conn-amazon-bedrock");
  console.log("[A] Health on Unconfigured Connector (Amazon Bedrock):");
  console.log(JSON.stringify(unconfiguredHealth, null, 2));

  // (B) Store credential and run live HTTPS probe
  realSecretsVault.storeEncryptedCredential("enterprise_tenant", "aws_bedrock_access_key", "AKIA_AWS_LIVE_BEDROCK_MOCK_KEY");
  const liveProbeHealth = await registry.checkConnectorHealth("conn-amazon-bedrock", { attemptLiveProbe: true });
  console.log("\n[B] Health with Credential + Real Outbound HTTPS Live Probe (Amazon Bedrock):");
  console.log(JSON.stringify(liveProbeHealth, null, 2));

  // --------------------------------------------------------------------------------
  // 2. SLACK DISPATCHER: HONEST CONSOLE FALLBACK VS REAL WEBHOOK DISPATCH
  // --------------------------------------------------------------------------------
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("2. SLACK DISPATCHER: HONEST CONSOLE FALLBACK & REAL HTTP ATTEMPT");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // (A) Unconfigured path
  slackDispatcher.webhookUrl = null;
  const fallbackResult = await slackDispatcher.dispatchHitlApproval({
    approvalId: "appr_test_fallback",
    agentName: "Autonomous Financial Worker",
    toolName: "issue_refund",
    amount: 450,
    reason: "Amount ($450) requires human 2FA sign-off."
  });
  console.log("[A] Dispatch Result when SLACK_WEBHOOK_URL is NOT configured (Console Fallback):");
  console.log(JSON.stringify(fallbackResult, null, 2));

  // (B) Configured path (real outbound HTTP POST to probe/mock webhook endpoint)
  slackDispatcher.webhookUrl = "https://httpbin.org/post";
  const realHttpResult = await slackDispatcher.dispatchHitlApproval({
    approvalId: "appr_test_live_slack",
    agentName: "Autonomous Financial Worker",
    toolName: "issue_refund",
    amount: 450,
    reason: "Live Slack Delivery Attempt."
  });
  slackDispatcher.webhookUrl = null; // Reset
  console.log("\n[B] Dispatch Result when SLACK_WEBHOOK_URL is configured (Real Outbound HTTP Call):");
  console.log(JSON.stringify(realHttpResult, null, 2));

  // --------------------------------------------------------------------------------
  // 3. QA ENGINE: DYNAMIC STRUCTURAL DAG PREFLIGHT SCORING
  // --------------------------------------------------------------------------------
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("3. QA ENGINE: DYNAMIC STRUCTURAL PREFLIGHT DAG SCORING");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // Pipeline A: Well-Formed Governance Gated DAG
  const wellFormedDAG = {
    id: "pipe_well_formed",
    name: "Governed Financial Refund Workflow",
    spendCeilingUsd: 5000,
    hitlThresholdUsd: 1000,
    nodes: [
      { id: "node_1", nodeType: "REASON_DECOMPOSE", tool: "query_database" },
      { id: "node_2", nodeType: "POLICY_GUARD", tool: "opa_rego_precheck" },
      { id: "node_3", nodeType: "TOOL_SANDBOX", tool: "issue_refund" },
      { id: "node_4", nodeType: "VERIFIER_CRITIC", tool: "verify_db_row" }
    ]
  };

  // Pipeline B: Unguarded High-Risk DAG (Destructive terminal & refund tool without preceding policy gate)
  const unguardedRiskDAG = {
    id: "pipe_unguarded_risk",
    name: "Unguarded Catastrophic Pipeline",
    spendCeilingUsd: 500000,
    hitlThresholdUsd: 999999, // Inappropriate HITL threshold
    nodes: [
      { id: "node_1", nodeType: "TOOL_SANDBOX", tool: "run_terminal_command" },
      { id: "node_2", nodeType: "TOOL_SANDBOX", tool: "issue_refund" },
      { id: "node_2", nodeType: "INVALID_TYPE", tool: "unknown_tool" } // Duplicate ID + invalid archetype
    ]
  };

  const qaResultWellFormed = qaEngine.evaluatePipelineDAG(wellFormedDAG);
  const qaResultUnguarded = qaEngine.evaluatePipelineDAG(unguardedRiskDAG);

  console.log("[A] QA Preflight Score for Well-Formed Gated DAG:");
  console.log(JSON.stringify(qaResultWellFormed, null, 2));

  console.log("\n[B] QA Preflight Score for Unguarded High-Risk DAG:");
  console.log(JSON.stringify(qaResultUnguarded, null, 2));

  // --------------------------------------------------------------------------------
  // 4. PENTEST SUITE: 13-VECTOR ADVERSARIAL SUITE RUN
  // --------------------------------------------------------------------------------
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("4. PENTEST SUITE: 13-VECTOR REGRESSION TEST");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const pentestOutcome = await pentestEngine.runFullPentest();
  console.log(JSON.stringify({
    testSuite: pentestOutcome.testSuite,
    summary: pentestOutcome.summary,
    totalVectorsTested: pentestOutcome.totalVectorsTested,
    knownVectorsDefended: pentestOutcome.knownVectorsDefended,
    novelVectorsDefended: pentestOutcome.novelVectorsDefended,
    novelSlipThroughs: pentestOutcome.novelSlipThroughs,
    testedAt: pentestOutcome.testedAt
  }, null, 2));

  // --------------------------------------------------------------------------------
  // 5. END-TO-END DAG EXECUTION PROOF
  // --------------------------------------------------------------------------------
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("5. END-TO-END DAG EXECUTION: REAL SQLITE & AUDIT_LEDGER ROW CONFIRMATION");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const testPipeline = {
    id: "pipe_final_e2e_" + Date.now(),
    name: "Final Verification Financial Pipeline",
    spendCeilingUsd: 5000,
    hitlThresholdUsd: 1000,
    nodes: [
      {
        id: "step_1_query",
        nodeType: "REASON_DECOMPOSE",
        title: "Ingest Customer Account Data",
        tool: "query_database",
        params: { table: "demo_users", filter: { id: "usr_101" } }
      },
      {
        id: "step_2_policy_gate",
        nodeType: "POLICY_GUARD",
        title: "OPA Rego Spend & Safety Invariant Pre-Check",
        tool: "opa_rego_eval",
        params: { tool_name: "issue_refund", amount: 45.0 }
      },
      {
        id: "step_3_execute",
        nodeType: "TOOL_SANDBOX",
        title: "Execute Safe Customer Credit",
        tool: "issue_refund",
        params: { customerId: "usr_101", amount: 45.0 }
      }
    ]
  };

  const execResult = await dagRuntimeExecutor.executePipeline(testPipeline, {
    agentId: "agent-sales-ae",
    goal: "Verify end-to-end execution of governed financial pipeline"
  });

  const cleanExecSummary = {
    txId: execResult.txId,
    status: execResult.status,
    pipelineId: execResult.pipelineId,
    executedStepsCount: execResult.executedSteps?.length,
    finalOutput: execResult.finalOutput
  };

  console.log("[A] DAG Execution Summary:");
  console.log(JSON.stringify(cleanExecSummary, null, 2));

  const recordedSteps = productionDb.db.prepare("SELECT step_number, tool_name, status, executed_at FROM transaction_steps WHERE transaction_id = ?").all(execResult.txId);
  const recordedAudit = productionDb.db.prepare("SELECT block_index, agent_id, tool_name, verdict, risk_score, block_hash FROM audit_ledger ORDER BY block_index DESC LIMIT 1").get();

  console.log("\n[B] Raw SQLite transaction_steps Row Records:");
  console.log(JSON.stringify(recordedSteps, null, 2));

  console.log("\n[C] Raw SQLite audit_ledger Block Row Record:");
  console.log(JSON.stringify(recordedAudit, null, 2));
}

runPhase3cVerifications();
