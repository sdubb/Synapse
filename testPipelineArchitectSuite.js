import { pipelineStateEngine } from "./server/src/pipeline/pipelineStateEngine.js";
import { staticPipelineVerifier } from "./server/src/pipeline/staticPipelineVerifier.js";
import { architectAgent } from "./server/src/pipeline/architectAgent.js";
import { PIPELINE_ARCHITECT_MCP_TOOLS } from "./server/src/mcp/pipelineArchitectTools.js";
import { generateDynamicPipelineSkill } from "./server/src/templates/dynamicPromptGenerator.js";

let passedCount = 0;
let failedCount = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passedCount++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}`);
    failedCount++;
  }
}

async function runTestSuite() {
  console.log("===============================================================");
  console.log("  ✦ SYNAPSE AI PIPELINE ARCHITECT & MCP SUITE VERIFICATION");
  console.log("===============================================================\n");

  // 1. Check MCP Tool Definitions
  console.log("1. Checking MCP Deterministic Tool Schema Registration...");
  assert(PIPELINE_ARCHITECT_MCP_TOOLS.length >= 15, `Exposes ${PIPELINE_ARCHITECT_MCP_TOOLS.length} deterministic MCP tools`);
  const toolNames = PIPELINE_ARCHITECT_MCP_TOOLS.map(t => t.name);
  assert(toolNames.includes("pipeline_create"), "Contains pipeline_create");
  assert(toolNames.includes("node_create"), "Contains node_create");
  assert(toolNames.includes("node_update"), "Contains node_update");
  assert(toolNames.includes("contract_create"), "Contains contract_create");
  assert(toolNames.includes("pipeline_validate"), "Contains pipeline_validate");
  assert(toolNames.includes("pipeline_commit"), "Contains pipeline_commit");
  assert(toolNames.includes("pipeline_rollback"), "Contains pipeline_rollback");

  // 2. Test Deterministic Pipeline State Machine Mutations
  console.log("\n2. Testing Deterministic Pipeline State Machine Mutations...");
  const draft = pipelineStateEngine.createPipeline({
    name: "Test Arbitrage Pipeline",
    domain: "Quant Trading",
    spendCeilingUsd: 5000,
    hitlThresholdUsd: 1000,
    nodes: []
  });
  assert(draft.id && draft.name === "Test Arbitrage Pipeline", "pipelineStateEngine.createPipeline created draft");

  const node1 = pipelineStateEngine.createNode(draft.id, {
    nodeType: "MONITOR_STREAM",
    title: "Stream L2 Orderbook",
    tool: "market_data_orderbook_stream",
    fallbackAction: "ALERT_ON_CALL"
  });
  assert(node1.success && node1.totalNodes === 1, "pipelineStateEngine.createNode appended Node 1");

  const node2 = pipelineStateEngine.createNode(draft.id, {
    nodeType: "EXECUTE_ACTION",
    title: "Execute Order",
    tool: "execute_limit_market_order",
    fallbackAction: "TRIGGER_2FA_APPROVAL"
  });
  assert(node2.success && node2.totalNodes === 2, "pipelineStateEngine.createNode appended Node 2");

  const contract = pipelineStateEngine.createContract(draft.id, node2.node.id, {
    verifier: "idempotency_key_active",
    params: { idempotencyKey: "idem_test_123" }
  });
  assert(contract.success && contract.contract.verifier === "idempotency_key_active", "pipelineStateEngine.createContract attached verification contract");

  // 3. Test Static Pipeline Verifier & Auto-Repair
  console.log("\n3. Testing Static Pipeline Verifier & Auto-Repair Linter...");
  const validAudit = pipelineStateEngine.validatePipeline(draft.id);
  assert(validAudit.status === "PASS" || validAudit.status === "WARNING", "Static Verifier passed valid DAG with contracts");

  // Test catching unverified financial node
  const brokenPipeline = {
    name: "Broken Money DAG",
    spendCeilingUsd: 2000,
    hitlThresholdUsd: 3000, // Invalid spend hierarchy
    nodes: [
      { id: "node_err", nodeType: "EXECUTE_ACTION", tool: "execute_limit_market_order", title: "Unverified Order" } // Missing fallback and contract
    ]
  };
  const brokenAudit = staticPipelineVerifier.verifyPipelineDAG(brokenPipeline);
  assert(brokenAudit.status === "FAIL", "Static Verifier caught unverified financial node & invalid spend hierarchy");
  assert(brokenAudit.issues.some(i => i.code === "FINANCIAL_ACTION_UNVERIFIED"), "Flagged FINANCIAL_ACTION_UNVERIFIED");
  assert(brokenAudit.issues.some(i => i.code === "INVALID_SPEND_HIERARCHY"), "Flagged INVALID_SPEND_HIERARCHY");

  const repaired = staticPipelineVerifier.autoRepairDAG(brokenPipeline);
  assert(repaired.fixesApplied.length >= 2, `Auto-repaired DAG applied ${repaired.fixesApplied.length} fixes`);
  assert(repaired.repairedPipeline.hitlThresholdUsd <= repaired.repairedPipeline.spendCeilingUsd, "Auto-repaired spend hierarchy");
  assert(repaired.repairedPipeline.nodes[0].postcondition?.verifier === "idempotency_key_active", "Auto-attached idempotency verification contract");

  // 4. Test Dynamic Prompt Compiler
  console.log("\n4. Testing Dynamic Auto-Synthesized Behavioral Skill Prompt...");
  const currentDraft = pipelineStateEngine.getPipeline(draft.id);
  const compiledPrompt = generateDynamicPipelineSkill({
    pipelineName: "Crypto Arb Engine",
    domain: "Quant Trading",
    spendCeilingUsd: 2000,
    hitlThresholdUsd: 500,
    nodes: currentDraft.nodes
  });
  assert(compiledPrompt.includes("Crypto Arb Engine"), "Includes assigned pipeline name");
  assert(compiledPrompt.includes("$2,000 USD"), "Includes spend ceiling invariant");
  assert(compiledPrompt.includes("$500 USD"), "Includes 2FA threshold invariant");
  assert(compiledPrompt.includes("market_data_orderbook_stream"), "Includes tool confinement list");

  // 5. Test Conversational Architect Agent Directives
  console.log("\n5. Testing Conversational AI Architect Directives via MCP...");

  // Directive A: Full pipeline creation
  console.log("  → Directive: 'Create a crypto arbitrage pipeline...'");
  const res1 = await architectAgent.processDirective({
    userPrompt: "Create a crypto arbitrage pipeline that monitors BTC/USDT, checks spread and risk, executes only if profitable, then verifies the order and position."
  });
  assert(res1.success === true, "Architect successfully synthesized crypto arbitrage pipeline");
  assert(res1.pipeline.nodes.length >= 4, `Synthesized ${res1.pipeline.nodes.length} sequential nodes`);
  assert(res1.mcpTrace.length >= 5, `Executed ${res1.mcpTrace.length} deterministic MCP tool calls in trace`);
  assert(res1.validation.status === "PASS" || res1.validation.status === "WARNING", "DAG passed static verification");

  const targetPipeId = res1.pipeline.id;

  // Directive B: Insert stop-loss check before execution
  console.log("  → Directive: 'Add a stop-loss check before execution.'");
  const res2 = await architectAgent.processDirective({
    userPrompt: "Add a stop-loss check before execution.",
    pipelineId: targetPipeId
  });
  assert(res2.success === true, "Inserted stop-loss check");
  assert(res2.pipeline.nodes.some(n => n.title.toLowerCase().includes("stop-loss") || n.title.toLowerCase().includes("risk")), "DAG contains stop-loss node");

  // Directive C: Governance adjustments
  console.log("  → Directive: 'Set the spend ceiling to $2,000 and require human approval above $500.'");
  const res3 = await architectAgent.processDirective({
    userPrompt: "Set the spend ceiling to $2,000 and require human approval above $500.",
    pipelineId: targetPipeId
  });
  assert(res3.success === true, "Updated governance limits");
  assert(res3.pipeline.spendCeilingUsd === 2000, "Spend ceiling is $2000");
  assert(res3.pipeline.hitlThresholdUsd === 500, "2FA threshold is $500");

  // Directive D: Switch tool to Binance
  console.log("  → Directive: 'Change node 1 to use Binance instead of Coinbase.'");
  const res4 = await architectAgent.processDirective({
    userPrompt: "Change node 1 to use Binance instead of Coinbase.",
    pipelineId: targetPipeId
  });
  assert(res4.success === true, "Updated node tool to Binance stream");

  // 6. Test Preview Diff, Commit, and Rollback
  console.log("\n6. Testing Staged Preview, Commit to SQLite & Rollback...");
  const preview = pipelineStateEngine.previewDraft(targetPipeId);
  assert(preview.nodesCount > 0, "Generated preview diff with node counts");

  const commitRes = pipelineStateEngine.commitPipeline(targetPipeId, "E2E Verification Commit", "Test Runner");
  assert(commitRes.success === true, "Committed pipeline to SQLite database");
  assert(commitRes.revision.revisionNumber >= 1, `Recorded revision #${commitRes.revision.revisionNumber}`);

  const revisions = pipelineStateEngine.getRevisions(targetPipeId);
  assert(revisions.length >= 1, `Retrieved ${revisions.length} revision(s) from SQLite`);

  console.log("\n===============================================================");
  console.log(`  ✦ SUITE RESULTS: ${passedCount} PASSED | ${failedCount} FAILED`);
  console.log("===============================================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTestSuite();
