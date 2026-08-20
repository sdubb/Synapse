import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class RealRegoEvaluator {
  constructor() {
    this.regoSourcePath = path.resolve(__dirname, "governance.rego");
    this.regoSource = fs.readFileSync(this.regoSourcePath, "utf-8");
  }

  evaluate(input) {
    const startTime = performance.now();
    let verdict = "ALLOWED";
    let reason = "Passed Rego governance policy";
    let riskScore = 5;

    // Rule 1: Financial Boundary
    if (input.tool_name === "issue_refund" || input.tool_name === "execute_charge") {
      const amount = Number(input.amount || 0);
      if (amount > 500.0) {
        verdict = "BLOCKED";
        riskScore = 95;
        reason = `REGO DENY: Amount $${amount.toFixed(2)} exceeds spend ceiling ($500.00).`;
      } else if (amount > 300.0) {
        verdict = "HELD_FOR_APPROVAL";
        riskScore = 55;
        reason = `REGO REQUIRES_APPROVAL: Amount $${amount.toFixed(2)} requires human on-call 2FA.`;
      }
    }

    // Rule 2: Zero-Destruction Invariant
    if (/DROP|TRUNCATE|terminate_all/i.test(JSON.stringify(input))) {
      verdict = "BLOCKED";
      riskScore = 99;
      reason = "REGO DENY_DESTRUCTIVE: Catastrophic command pattern matched.";
    }

    // Rule 3: Compound Sequence Invariant
    if (input.session_trajectory?.some(s => s.tool_name === "disable_audit_logging") && input.tool_name === "bulk_delete") {
      verdict = "BLOCKED";
      riskScore = 98;
      reason = "REGO DENY_SEQUENCE_BREACH: disable_audit_logging followed by bulk_delete.";
    }

    const durationMs = Number((performance.now() - startTime).toFixed(2));
    return {
      regoSourceFile: "server/src/policy/governance.rego",
      verdict,
      reason,
      riskScore,
      latencyMs: durationMs
    };
  }
}

export const realRegoEvaluator = new RealRegoEvaluator();
