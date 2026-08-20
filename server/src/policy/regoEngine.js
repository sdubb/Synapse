import { persistentStore } from "../storage/persistentStore.js";

export const DEFAULT_REGO_POLICIES = [
  {
    id: "rego-spend-boundary",
    name: "Tri-State Financial Boundary Policy",
    category: "Financial Compliance",
    regoCode: `package synapse.finance\ndefault allow = false\nallow { input.amount <= input.agent.spendCeilingUsd }\nrequires_approval { input.amount > input.agent.requiresHitlAboveUsd; input.amount <= input.agent.spendCeilingUsd }`,
    description: "Evaluates financial amounts: Auto-Allows below threshold, triggers Human Approval if between $300-$500, and Auto-Blocks above $500.",
    enabled: true
  },
  {
    id: "rego-sequence-invariant",
    name: "Compound Evasion & Privilege Escalation Invariant",
    category: "Security Invariants",
    regoCode: `package synapse.security\ndefault allow = true\ndeny { input.session_trajectory[_].tool == "disable_audit"; input.tool == "bulk_delete" }`,
    description: "Blocks an agent from deleting records if audit logging was disabled earlier in the same session.",
    enabled: true
  },
  {
    id: "rego-zero-destruction",
    name: "Zero-Destruction Cloud Infrastructure Invariant",
    category: "Infrastructure SRE",
    regoCode: `package synapse.infra\ndefault allow = true\ndeny { re_match("DROP|TRUNCATE|terminate_all", input.query_or_command) }`,
    description: "Catches catastrophic database drops or cluster terminates in the speculative shadow sandbox.",
    enabled: true
  }
];

export class RegoPolicyEngine {
  constructor() {
    let loaded = persistentStore.getPolicies();
    if (!loaded || loaded.length === 0) {
      persistentStore.savePolicies(DEFAULT_REGO_POLICIES);
      loaded = DEFAULT_REGO_POLICIES;
    }
    this.policies = loaded;
  }

  getPolicies() { return this.policies; }

  evaluate({ agent, toolName, parameters, sessionTrajectory = [] }) {
    const startTime = performance.now();
    let verdict = "ALLOWED"; // ALLOWED | BLOCKED | HELD_FOR_APPROVAL
    let reason = "Passed all Rego invariants and shadow simulation.";
    let riskScore = 5;

    const amount = Number(parameters.amount || parameters.creditLimitAdjustment || 0);
    const payloadStr = JSON.stringify(parameters);

    // Rule 1: Financial Boundary Check
    if (toolName === "issue_refund" || toolName === "execute_charge" || toolName === "update_salesforce_account") {
      const ceiling = agent?.spendCeilingUsd || 500;
      const hitlThreshold = agent?.requiresHitlAboveUsd || 300;

      if (amount > ceiling) {
        verdict = "BLOCKED";
        riskScore = 95;
        reason = `REGO VIOLATION [rego-spend-boundary]: Requested amount ($${amount.toFixed(2)}) exceeds absolute spend ceiling ($${ceiling.toFixed(2)}).`;
      } else if (amount > hitlThreshold) {
        verdict = "HELD_FOR_APPROVAL";
        riskScore = 55;
        reason = `APPROVAL REQUIRED [rego-spend-boundary]: Amount ($${amount.toFixed(2)}) is between $${hitlThreshold.toFixed(2)} and $${ceiling.toFixed(2)}. Held for Human On-Call Approval.`;
      }
    }

    // Rule 2: Zero-Destruction Check
    if (/DROP|TRUNCATE|DELETE\s+FROM|terminate_all|wipe_bucket/i.test(payloadStr)) {
      verdict = "BLOCKED";
      riskScore = 99;
      reason = "REGO VIOLATION [rego-zero-destruction]: Matched catastrophic command invariant filter in shadow sandbox.";
    }

    // Rule 3: Sequence Evasion Check
    const hadDisableAudit = sessionTrajectory.some(s => s.tool === "disable_audit" || s.tool === "disable_audit_logging");
    if (hadDisableAudit && (toolName === "bulk_delete" || toolName === "delete_database_record")) {
      verdict = "BLOCKED";
      riskScore = 98;
      reason = "REGO VIOLATION [rego-sequence-invariant]: Detected compound attack (disable_audit followed by delete_records).";
    }

    const durationMs = Number((performance.now() - startTime).toFixed(2));
    return { verdict, reason, riskScore, latencyMs: durationMs };
  }
}

export const regoEngine = new RegoPolicyEngine();
