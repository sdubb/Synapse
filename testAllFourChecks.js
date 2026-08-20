import { a2aMeshEngine } from "./server/src/a2a/googleA2AMesh.js";
import { productionDb } from "./server/src/storage/productionDb.js";
import { pentestEngine } from "./server/src/pentest/pentestEngine.js";
import { universalCliManager } from "./server/src/runtime/universalCliManager.js";

async function runFourChecks() {
  console.log("================================================================================");
  console.log("  ✦ PHASE 2 COMPLETION: VERIFYING ALL 4 CRITICAL CHECKS");
  console.log("================================================================================\n");

  // --------------------------------------------------------------------------------
  // CHECK 1: JWT Payload Construction & '$' Character Integrity
  // --------------------------------------------------------------------------------
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("1. JWT PAYLOAD STRING INTEGRITY: '$75,000' PRESERVATION PROOF");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const testDirective = "Authorize Net-30 Invoice Generation for $75,000";
  const token = a2aMeshEngine.generateDelegationToken(
    "agent-sales-ae",
    "agent-finance-treasury",
    testDirective,
    { amount: 75000, currency: "USD", formattedTotal: "$75,000.00" }
  );

  console.log("[A] Generated JWT Token String:");
  console.log(token);

  const decoded = a2aMeshEngine.verifyDelegationToken(token);
  console.log("\n[B] Decoded JWT Payload (Verifying '$' character is intact):");
  console.log(JSON.stringify(decoded, null, 2));

  // --------------------------------------------------------------------------------
  // CHECK 2: Dynamic getTrustMatrix() Pulled from SQLite Rows
  // --------------------------------------------------------------------------------
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("2. DYNAMIC TRUST MATRIX PROOF: INSERTING 2 AGENTS INTO SQLITE");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // Agent 1: Low cap agent
  const testAgentA = {
    id: "agent_alpha_low_cap_" + Date.now(),
    name: "Alpha Low-Cap Compliance Worker",
    provider: "compliance_linter",
    department: "Legal & Regulatory",
    owner: "compliance-lead@synapse",
    status: "ACTIVE",
    securityScore: 95,
    spendCeilingUsd: 1200.0,
    requiresHitlAboveUsd: 250.0,
    systemPrompt: "Audit regulatory compliance"
  };

  // Agent 2: High cap agent
  const testAgentB = {
    id: "agent_beta_high_cap_" + Date.now(),
    name: "Beta High-Cap Infrastructure Scaler",
    provider: "aws_fleet_scaler",
    department: "Cloud Infrastructure",
    owner: "cloud-architect@synapse",
    status: "ACTIVE",
    securityScore: 88,
    spendCeilingUsd: 450000.0,
    requiresHitlAboveUsd: 50000.0,
    systemPrompt: "Scale global cloud fleet"
  };

  console.log("• Inserting Agent A into SQLite (Spend Ceiling: $1,200)...");
  productionDb.insertAgent(testAgentA);

  console.log("• Inserting Agent B into SQLite (Spend Ceiling: $450,000)...");
  productionDb.insertAgent(testAgentB);

  const fullTrustMatrix = a2aMeshEngine.getTrustMatrix();
  const matrixEntryA = fullTrustMatrix.find(e => e.originId === testAgentA.id);
  const matrixEntryB = fullTrustMatrix.find(e => e.originId === testAgentB.id);

  console.log("\n[DYNAMIC TRUST MATRIX ENTRY FOR AGENT A (PULLED FROM SQLITE)]:");
  console.log(JSON.stringify(matrixEntryA, null, 2));

  console.log("\n[DYNAMIC TRUST MATRIX ENTRY FOR AGENT B (PULLED FROM SQLITE)]:");
  console.log(JSON.stringify(matrixEntryB, null, 2));

  // --------------------------------------------------------------------------------
  // CHECK 3: Pentest Engine with 10 Known + 3 Novel Vectors & Honest Reporting
  // --------------------------------------------------------------------------------
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("3. PENTEST ENGINE: 10 KNOWN + 3 NOVEL VECTORS HONEST REPORT");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const pentestResult = await pentestEngine.runFullPentest();
  console.log(JSON.stringify(pentestResult, null, 2));

  // --------------------------------------------------------------------------------
  // CHECK 4: universalCliManager Real OS Process PID Verification
  // --------------------------------------------------------------------------------
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("4. REAL OS PROCESS PID IN universalCliManager (NO RANDOM PIDS)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  console.log("• Executing native_daemon CLI driver via universalCliManager...");
  const cliExecResult = await universalCliManager.executeWithSelectedCli({
    cliId: "native_daemon",
    agentId: testAgentA.id,
    goal: "Verify real process handle capture",
    model: "node-runtime",
    spendCeilingUsd: 1000
  });

  console.log("\n[universalCliManager EXECUTION RESULT]:");
  console.log(JSON.stringify(cliExecResult, null, 2));

  console.log("\n--- EXACT RAW SQLITE STEP RECORD CONFIRMING REAL PID ---");
  const stepRow = productionDb.db.prepare("SELECT step_number, tool_name, parameters_json, status, executed_at FROM transaction_steps WHERE transaction_id = ?").all(cliExecResult.txId);
  console.log(JSON.stringify(stepRow, null, 2));
}

runFourChecks();
