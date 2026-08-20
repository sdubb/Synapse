import { realRegoEvaluator } from "./server/src/policy/realRegoEvaluator.js";
import fs from "fs";

console.log("[PHASE 4 REGO PROOF]: 1. Raw Rego Source File (server/src/policy/governance.rego):");
console.log("--------------------------------------------------");
console.log(fs.readFileSync("./server/src/policy/governance.rego", "utf-8"));
console.log("--------------------------------------------------");

// Test Case A: Normal allowed amount ($150)
const resA = realRegoEvaluator.evaluate({ tool_name: "issue_refund", amount: 150.0 });
console.log("\n[PHASE 4 REGO PROOF]: 2. Eval Input: { amount: 150.00 } -> Verdict:", resA.verdict, `(${resA.latencyMs}ms)`);

// Test Case B: HITL required amount ($350)
const resB = realRegoEvaluator.evaluate({ tool_name: "issue_refund", amount: 350.0 });
console.log("[PHASE 4 REGO PROOF]: 3. Eval Input: { amount: 350.00 } -> Verdict:", resB.verdict, `(${resB.latencyMs}ms)`);

// Test Case C: Compound sequence invariant breach (disable_audit -> bulk_delete)
const resC = realRegoEvaluator.evaluate({
  tool_name: "bulk_delete",
  session_trajectory: [{ tool_name: "disable_audit_logging" }]
});
console.log("[PHASE 4 REGO PROOF]: 4. Eval Input: Compound sequence breach -> Verdict:", resC.verdict, `(${resC.latencyMs}ms)`);
console.log("   Reason:", resC.reason);
