import crypto from "crypto";

export const DEFAULT_POLICIES = [
  {
    id: "pol-spend-limit",
    name: "Autonomous Spend Ceiling",
    category: "Financial",
    description: "Blocks any financial transaction or refund exceeding the threshold without human approval.",
    enabled: true,
    severity: "CRITICAL",
    threshold: 500, // Max USD per action
    currency: "USD",
    targetTools: ["issue_refund", "execute_charge", "transfer_funds", "crypto_payout", "purchase_inventory"]
  },
  {
    id: "pol-destructive-ops",
    name: "Zero-Destruction Infrastructure Lock",
    category: "DevOps & Cloud",
    description: "Intercepts and rejects catastrophic commands like DROP TABLE, rm -rf, terminate_instance, or wipe_s3.",
    enabled: true,
    severity: "CRITICAL",
    patterns: [
      /DROP\s+TABLE/i,
      /DROP\s+DATABASE/i,
      /TRUNCATE\s+TABLE/i,
      /DELETE\s+FROM\s+\w+\s*;/i, // Unconditional DELETE
      /rm\s+-rf\s+\//i,
      /format\s+[a-z]:/i,
      /terminate_all/i,
      /wipe_bucket/i
    ],
    targetTools: ["execute_sql", "run_bash_command", "modify_cloud_resources", "manage_database"]
  },
  {
    id: "pol-pii-redact",
    name: "EU AI Act / HIPAA PII & Secret Redactor",
    category: "Compliance & Security",
    description: "Redacts and quarantines SSNs, credit card numbers, private keys, and API tokens before transmission.",
    enabled: true,
    severity: "HIGH",
    patterns: [
      { name: "SSN", regex: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: "[REDACTED_SSN]" },
      { name: "CreditCard", regex: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g, replacement: "[REDACTED_CARD]" },
      { name: "ApiKey", regex: /(?:sk-[a-zA-Z0-9]{20,}|ghp_[a-zA-Z0-9]{20,}|AKIA[0-9A-Z]{16})/g, replacement: "[REDACTED_SECRET_KEY]" },
      { name: "PrivateKey", regex: /-----BEGIN (?:RSA )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA )?PRIVATE KEY-----/g, replacement: "[REDACTED_PRIVATE_KEY]" }
    ],
    targetTools: ["*"]
  },
  {
    id: "pol-rate-governor",
    name: "Agentic Loop & Rate Governor",
    category: "Reliability",
    description: "Halts runaway infinite subagent loops executing more than 20 external actions per minute.",
    enabled: true,
    severity: "MEDIUM",
    maxActionsPerMin: 20,
    targetTools: ["*"]
  }
];

export class GuardrailEngine {
  constructor(initialPolicies = DEFAULT_POLICIES) {
    this.policies = JSON.parse(JSON.stringify(initialPolicies));
    this.actionHistory = [];
  }

  getPolicies() {
    return this.policies;
  }

  updatePolicy(id, updates) {
    const policy = this.policies.find(p => p.id === id);
    if (policy) {
      Object.assign(policy, updates);
      return policy;
    }
    return null;
  }

  evaluate({ agentId, toolName, parameters, context = {} }) {
    const startTime = performance.now();
    const violations = [];
    let sanitizedParameters = JSON.parse(JSON.stringify(parameters || {}));
    let finalVerdict = "ALLOWED"; // ALLOWED | BLOCKED | REDACTED | ESCALATE_HITL

    for (const policy of this.policies) {
      if (!policy.enabled) continue;

      const isTarget = policy.targetTools.includes("*") || policy.targetTools.includes(toolName);
      if (!isTarget) continue;

      // 1. Spend Limits
      if (policy.id === "pol-spend-limit") {
        const amount = Number(parameters.amount || parameters.total || parameters.value || 0);
        if (amount > policy.threshold) {
          violations.push({
            policyId: policy.id,
            policyName: policy.name,
            severity: policy.severity,
            reason: `Requested amount ($${amount.toFixed(2)}) exceeds autonomous authorization ceiling ($${policy.threshold.toFixed(2)}). Human confirmation required.`
          });
          finalVerdict = "BLOCKED";
        }
      }

      // 2. Destructive Operations
      if (policy.id === "pol-destructive-ops") {
        const payloadString = JSON.stringify(parameters);
        for (const pattern of policy.patterns) {
          if (pattern.test(payloadString)) {
            violations.push({
              policyId: policy.id,
              policyName: policy.name,
              severity: policy.severity,
              reason: `Catastrophic destructive signature matched invariant filter [${pattern.source}]. Blocked before reaching target system.`
            });
            finalVerdict = "BLOCKED";
            break;
          }
        }
      }

      // 3. PII & Secret Redaction
      if (policy.id === "pol-pii-redact") {
        let stringified = JSON.stringify(sanitizedParameters);
        let wasRedacted = false;
        const matchedTypes = [];

        for (const p of policy.patterns) {
          if (p.regex.test(stringified)) {
            stringified = stringified.replace(p.regex, p.replacement);
            wasRedacted = true;
            matchedTypes.push(p.name);
          }
        }

        if (wasRedacted) {
          sanitizedParameters = JSON.parse(stringified);
          violations.push({
            policyId: policy.id,
            policyName: policy.name,
            severity: "MEDIUM",
            reason: `Sensitive data intercepted and sanitized: [${matchedTypes.join(", ")}].`
          });
          if (finalVerdict !== "BLOCKED") {
            finalVerdict = "REDACTED";
          }
        }
      }

      // 4. Rate Governor
      if (policy.id === "pol-rate-governor") {
        const now = Date.now();
        const oneMinAgo = now - 60000;
        const recentActions = this.actionHistory.filter(a => a.agentId === agentId && a.timestamp > oneMinAgo);
        if (recentActions.length >= policy.maxActionsPerMin) {
          violations.push({
            policyId: policy.id,
            policyName: policy.name,
            severity: policy.severity,
            reason: `Agent executed ${recentActions.length} actions in the last 60s, breaching safety governor limit of ${policy.maxActionsPerMin}/min.`
          });
          finalVerdict = "BLOCKED";
        }
      }
    }

    const latencyMs = Number((performance.now() - startTime).toFixed(2));
    this.actionHistory.push({ agentId, toolName, timestamp: Date.now() });
    if (this.actionHistory.length > 500) this.actionHistory.shift();

    return {
      verdict: finalVerdict,
      allowed: finalVerdict === "ALLOWED" || finalVerdict === "REDACTED",
      violations,
      sanitizedParameters,
      latencyMs
    };
  }
}
