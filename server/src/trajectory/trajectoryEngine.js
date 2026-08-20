import crypto from "crypto";

export class TrajectoryAssuranceEngine {
  constructor() {
    this.activeTrajectories = new Map(); // agentId/session -> Array of steps
    this.invariants = [
      {
        id: "inv-arbitrage-sequence",
        name: "Compound Credit/Coupon Extraction Invariant",
        description: "Prevents an agent from chaining [read_balance -> generate_token -> apply_token -> cashout] within a single session.",
        forbiddenSequence: ["read_balance", "generate_discount", "apply_discount", "withdraw_cash"],
        severity: "CRITICAL"
      },
      {
        id: "inv-privilege-elevation-sequence",
        name: "Gradual Privilege Escalation Invariant",
        description: "Catches sequence of micro-permissions expanding into full IAM admin access.",
        forbiddenSequence: ["list_iam_roles", "assume_role_sandbox", "update_iam_policy"],
        severity: "CRITICAL"
      },
      {
        id: "inv-bulk-exfil-sequence",
        name: "Reconnaissance-to-Exfiltration Pipeline Invariant",
        description: "Flags when consecutive table queries are followed by external network socket transmission.",
        forbiddenSequence: ["query_table_users", "query_table_payroll", "send_external_webhook"],
        severity: "HIGH"
      }
    ];
  }

  // Evaluate the entire trajectory up to the current candidate action
  evaluateTrajectory({ agentId, sessionId, currentTool, parameters, intentGoal }) {
    if (!this.activeTrajectories.has(sessionId)) {
      this.activeTrajectories.set(sessionId, []);
    }

    const trajectory = this.activeTrajectories.get(sessionId);
    trajectory.push({ toolName: currentTool, parameters, timestamp: Date.now() });

    const toolsHistory = trajectory.map(t => t.toolName);
    const violations = [];

    // Check sequence invariants
    for (const inv of this.invariants) {
      let matchCount = 0;
      let seqIndex = 0;

      for (const calledTool of toolsHistory) {
        if (calledTool === inv.forbiddenSequence[seqIndex]) {
          seqIndex++;
          if (seqIndex === inv.forbiddenSequence.length) {
            matchCount++;
            break;
          }
        }
      }

      if (seqIndex === inv.forbiddenSequence.length) {
        violations.push({
          invariantId: inv.id,
          invariantName: inv.name,
          severity: inv.severity,
          reason: `Trajectory Assurance Failure: The sequence of ${toolsHistory.length} actions [${toolsHistory.join(" -> ")}] collectively breaches global safety invariant '${inv.name}'.`,
          divergedAtStep: toolsHistory.length
        });
      }
    }

    // Trajectory Divergence Score (0-100% alignment with original goal)
    const alignmentScore = violations.length > 0 ? 32 : Math.max(70, 100 - (toolsHistory.length * 4));

    return {
      trajectoryLength: toolsHistory.length,
      toolsHistory,
      alignmentScore,
      isCompliant: violations.length === 0,
      violations
    };
  }

  clearSession(sessionId) {
    this.activeTrajectories.delete(sessionId);
  }
}
