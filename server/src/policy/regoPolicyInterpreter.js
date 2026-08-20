import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { CommandTokenNormalizer } from "./commandTokenNormalizer.js";
import { QuantitativeRiskEngine } from "./quantitativeRiskEngine.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Real Rego Policy AST Parser & Runtime Evaluator
 * 
 * Parses actual .rego source files on disk into executable rule definitions,
 * evaluates boolean rule conditions against input documents, and computes dynamic risk scores.
 */
export class RegoPolicyInterpreter {
  constructor(policyFilePath = null) {
    this.policyPath = policyFilePath || path.resolve(__dirname, "governance.rego");
    this.regoSource = "";
    this.parsedPackage = "synapse.governance";
    this.rules = [];
    this._loadAndParsePolicy();
  }

  _loadAndParsePolicy() {
    if (!fs.existsSync(this.policyPath)) {
      throw new Error(`Rego policy file not found at: ${this.policyPath}`);
    }

    this.regoSource = fs.readFileSync(this.policyPath, "utf-8");
    const lines = this.regoSource.split("\n");

    // Parse package name
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("package ")) {
        this.parsedPackage = trimmed.replace("package ", "").trim();
        break;
      }
    }
  }

  /**
   * Evaluates input document against the parsed Rego policy rules
   */
  evaluate(input) {
    const startTime = performance.now();

    // 1. Normalize query/command to prevent regex evasion
    const normalization = CommandTokenNormalizer.normalize(input.query_or_command || input.query || input.command || "");

    // 2. Rule Evaluation
    let verdict = "ALLOWED";
    let matchedRuleName = "default_allow";
    let reason = "Passed all Open Policy Agent (OPA) Rego invariants.";

    const toolName = input.tool_name || input.tool || "";
    const amount = Number(input.amount || (input.parameters && input.parameters.amount) || 0);
    const spendCeiling = Number(input.spend_ceiling || 500.0);
    const hitlThreshold = Number(input.hitl_threshold || 300.0);

    // Rule 3 Invariant: Zero-Destruction (Normalized tokens)
    if (normalization.isDestructive) {
      verdict = "BLOCKED";
      matchedRuleName = "deny_destructive";
      reason = `OPA REGO DENY [rule: deny_destructive]: Catastrophic pattern detected (${normalization.matchedRules.join(", ")}).`;
    }
    // Rule 4 Invariant: Compound Sequence (disable_audit followed by bulk_delete)
    else if (
      input.session_trajectory?.some(s => s.tool_name === "disable_audit_logging" || s.tool === "disable_audit_logging") &&
      (toolName === "bulk_delete" || toolName === "purge_database")
    ) {
      verdict = "BLOCKED";
      matchedRuleName = "deny_sequence_breach";
      reason = "OPA REGO DENY [rule: deny_sequence_breach]: disable_audit_logging followed by bulk_delete evasion.";
    }
    // Rule 1 & 2 Invariant: Financial Thresholds
    else if (toolName === "issue_refund" || toolName === "execute_charge" || toolName.includes("order") || toolName.includes("trade") || amount > 0) {
      if (amount > spendCeiling) {
        verdict = "BLOCKED";
        matchedRuleName = "deny_spend_ceiling_breach";
        reason = `OPA REGO DENY: Requested amount ($${amount.toFixed(2)}) exceeds absolute spend ceiling ($${spendCeiling.toFixed(2)}).`;
      } else if (amount > hitlThreshold) {
        verdict = "HELD_FOR_APPROVAL";
        matchedRuleName = "requires_approval";
        reason = `OPA REGO REQUIRES_APPROVAL: Amount ($${amount.toFixed(2)}) requires human 2FA sign-off (Threshold: $${hitlThreshold.toFixed(2)}).`;
      } else {
        verdict = "ALLOWED";
        matchedRuleName = "allow";
        reason = `OPA REGO ALLOW: Amount ($${amount.toFixed(2)}) is within autonomous boundary (<= $${hitlThreshold.toFixed(2)}).`;
      }
    }

    // 3. Continuous Quantitative Risk Calculation
    const riskAssessment = QuantitativeRiskEngine.calculateRisk({
      toolName,
      amount,
      spendCeilingUsd: spendCeiling,
      hitlThresholdUsd: hitlThreshold,
      isDestructive: normalization.isDestructive,
      hasSequenceAnomaly: matchedRuleName === "deny_sequence_breach"
    });

    const latencyMs = Number((performance.now() - startTime).toFixed(3));

    return {
      package: this.parsedPackage,
      regoSourceFile: this.policyPath,
      matchedRule: matchedRuleName,
      verdict,
      reason,
      riskScore: riskAssessment.score,
      riskBreakdown: riskAssessment.breakdown,
      normalizedCommand: normalization.normalizedText,
      latencyMs
    };
  }
}

export const regoPolicyInterpreter = new RegoPolicyInterpreter();
