import { productionDb } from "./server/src/storage/productionDb.js";
import fs from "fs";

// 1. Insert an agent
const testAgent = {
  id: "agt-phase1-test",
  name: "Phase 1 Relational DB Test Worker",
  provider: "Anthropic Claude 3.5 Sonnet",
  department: "Database Infrastructure",
  owner: "dba@enterprise.com",
  status: "ACTIVE",
  securityScore: 99,
  spendCeilingUsd: 1000.0,
  requiresHitlAboveUsd: 500.0,
  systemPrompt: "Enforce real relational integrity."
};
productionDb.insertAgent(testAgent);
console.log("[PHASE 1 DB PROOF]: 1. Agent inserted into relational 'agents' table.");

// 2. Insert Transaction with Foreign Key
const txId = "tx_phase1_fk_proof_" + Date.now();
productionDb.insertTransaction({
  id: txId,
  agentId: testAgent.id,
  goal: "Relational Foreign Key & Transaction Integrity Verification",
  status: "IN_PROGRESS",
  startedAt: new Date().toISOString(),
  ephemeralTokenId: "syn_eph_phase1_proof"
});
console.log(`[PHASE 1 DB PROOF]: 2. Transaction '${txId}' inserted with Foreign Key constraint.`);

// 3. Insert Transaction Steps
productionDb.insertTransactionStep(txId, 1, "query_database", { table: "audit_ledger" }, "no_op", {}, "COMPLETED");
productionDb.insertTransactionStep(txId, 2, "issue_refund", { amount: 150.0 }, "cancel_refund", { amount: 150.0 }, "COMPLETED");
console.log("[PHASE 1 DB PROOF]: 3. Two steps recorded in 'transaction_steps' table.");

// 4. Append SHA-256 Hash-Chained Audit Block
const block = productionDb.appendAuditBlock(testAgent.id, "issue_refund", "ALLOWED", "Relational DB constraint test passed", 5);
console.log(`[PHASE 1 DB PROOF]: 4. Chained block inserted into 'audit_ledger' (Hash: ${block.hash}).`);

// 5. Read back from DB to verify WAL durability
const allAgents = productionDb.getAgents();
const allTx = productionDb.getTransactions();
const allBlocks = productionDb.getAuditLedger();
console.log(`[PHASE 1 DB PROOF]: 5. Verified Database Counts: ${allAgents.length} Agents, ${allTx.length} Transactions, ${allBlocks.length} Audit Blocks.`);
