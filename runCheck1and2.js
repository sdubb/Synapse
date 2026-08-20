import { a2aMeshEngine } from "./server/src/a2a/googleA2AMesh.js";
import { productionDb } from "./server/src/storage/productionDb.js";

function run() {
  const testDirective = "Authorize Net-30 Invoice Generation for $75,000";
  const token = a2aMeshEngine.generateDelegationToken(
    "agent-sales-ae",
    "agent-finance-treasury",
    testDirective,
    { amount: 75000, currency: "USD", formattedTotal: "$75,000.00" }
  );

  console.log("=== CHECK 1: JWT PAYLOAD WITH '$75,000' PRESERVED ===");
  console.log(JSON.stringify(a2aMeshEngine.verifyDelegationToken(token), null, 2));

  console.log("\n=== CHECK 2: DYNAMIC TRUST MATRIX FROM SQLITE ROWS ===");
  const agentA = {
    id: "agent_alpha_" + Date.now(),
    name: "Alpha Low-Cap Agent",
    provider: "synapse-worker",
    department: "Legal",
    owner: "lead@synapse",
    status: "ACTIVE",
    securityScore: 90,
    spendCeilingUsd: 1200.0,
    requiresHitlAboveUsd: 250.0,
    systemPrompt: "Legal"
  };

  const agentB = {
    id: "agent_beta_" + Date.now(),
    name: "Beta High-Cap Agent",
    provider: "synapse-worker",
    department: "Cloud",
    owner: "lead@synapse",
    status: "ACTIVE",
    securityScore: 90,
    spendCeilingUsd: 450000.0,
    requiresHitlAboveUsd: 50000.0,
    systemPrompt: "Cloud"
  };

  productionDb.insertAgent(agentA);
  productionDb.insertAgent(agentB);

  const matrix = a2aMeshEngine.getTrustMatrix();
  const matchA = matrix.find(e => e.originId === agentA.id);
  const matchB = matrix.find(e => e.originId === agentB.id);

  console.log("Match Agent A (SQLite Cap $1,200):\n", JSON.stringify(matchA, null, 2));
  console.log("\nMatch Agent B (SQLite Cap $450,000):\n", JSON.stringify(matchB, null, 2));
}

run();
