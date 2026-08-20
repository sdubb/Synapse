import { GuardrailEngine } from "./guardrails.js";
import { RollbackEngine } from "./rollback.js";
import { ShadowSimulator } from "./shadowSimulator.js";
import { AuditLedger } from "./audit.js";

export class SynapseRuntime {
  constructor(broadcastEvent = () => {}) {
    this.guardrails = new GuardrailEngine();
    this.rollback = new RollbackEngine();
    this.shadow = new ShadowSimulator();
    this.audit = new AuditLedger();
    this.broadcastEvent = broadcastEvent;

    // Seed some initial telemetry data so dashboard looks immediately vibrant
    this._seedInitialActivity();
  }

  _seedInitialActivity() {
    this.audit.logEvent({
      agentId: "agent-stripe-reconciler",
      toolName: "issue_refund",
      verdict: "BLOCKED",
      reason: "Requested amount ($4,850.00) exceeds autonomous limit ($500.00)",
      riskScore: 92,
      threatValueUsd: 4850,
      sanitizedParams: { customerId: "cus_8892", amount: 4850.0 }
    });

    this.audit.logEvent({
      agentId: "agent-k8s-sre",
      toolName: "execute_sql",
      verdict: "BLOCKED",
      reason: "Catastrophic destructive signature matched invariant filter [DROP TABLE]",
      riskScore: 99,
      sanitizedParams: { query: "DROP TABLE user_sessions;" }
    });

    this.audit.logEvent({
      agentId: "agent-crm-support",
      toolName: "send_email_notification",
      verdict: "REDACTED",
      reason: "Sensitive data intercepted and sanitized: [SSN, CreditCard]",
      riskScore: 45,
      sanitizedParams: { recipient: "support@external.io", body: "Customer [REDACTED_SSN] requested update" }
    });
  }

  // Primary entrypoint: Intercept tool call from agent
  async interceptAction({ agentId, transactionId, workflowName, toolName, parameters, enableShadow = true }) {
    const totalStart = performance.now();

    // 1. Guardrail evaluation
    const guardrailResult = this.guardrails.evaluate({ agentId, toolName, parameters });

    // 2. Speculative Shadow Simulation (if allowed by basic static guardrails)
    let shadowResult = { simulationPassed: true, riskFactor: "LOW", durationMs: 0 };
    if (guardrailResult.allowed && enableShadow) {
      shadowResult = this.shadow.simulate({ toolName, parameters: guardrailResult.sanitizedParameters });
      if (!shadowResult.simulationPassed) {
        guardrailResult.allowed = false;
        guardrailResult.verdict = "BLOCKED";
        guardrailResult.violations.push({
          policyId: "shadow-sandbox-breach",
          policyName: "Shadow Sandbox Invariant Violation",
          severity: "CRITICAL",
          reason: shadowResult.warningNotes.join("; ")
        });
      }
    }

    // 3. Compute Risk Score (0 - 100)
    let riskScore = 10;
    if (guardrailResult.verdict === "BLOCKED") riskScore = 95;
    else if (guardrailResult.verdict === "REDACTED") riskScore = 48;
    else if (shadowResult.riskFactor === "HIGH") riskScore = 75;

    const latencyMs = Number((performance.now() - totalStart).toFixed(2));

    // 4. Record Audit Log
    const auditBlock = this.audit.logEvent({
      agentId,
      toolName,
      verdict: guardrailResult.verdict,
      reason: guardrailResult.violations.map(v => v.reason).join(" | ") || "Passed all invariant checks & shadow simulation",
      riskScore,
      latencyMs,
      threatValueUsd: parameters.amount ? Number(parameters.amount) : 0,
      sanitizedParams: guardrailResult.sanitizedParameters
    });

    // 5. Transaction State Recording (if transaction context provided and allowed)
    let stepRecord = null;
    if (transactionId && guardrailResult.allowed) {
      stepRecord = this.rollback.recordStep(transactionId, {
        toolName,
        parameters: guardrailResult.sanitizedParameters,
        result: { status: "success", executedAt: new Date().toISOString() }
      });
    }

    const payload = {
      actionId: "act_" + Math.random().toString(36).substr(2, 9),
      agentId,
      transactionId,
      toolName,
      verdict: guardrailResult.verdict,
      allowed: guardrailResult.allowed,
      violations: guardrailResult.violations,
      sanitizedParameters: guardrailResult.sanitizedParameters,
      shadowResult,
      riskScore,
      latencyMs,
      auditHash: auditBlock.hash,
      stepRecord,
      timestamp: new Date().toISOString()
    };

    // Broadcast live event to connected frontend WebSockets
    this.broadcastEvent({ type: "ACTION_INTERCEPTED", data: payload });

    return payload;
  }
}
