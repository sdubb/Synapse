/**
 * Continuous Quantitative Risk Scoring Engine
 * 
 * Computes continuous risk scores [0.0, 100.0] as a function of:
 * 1. Base Tool Blast Radius (Read-Only vs State-Mutating vs System Command)
 * 2. Relative Budget Consumption: (RequestedAmount / SpendCeiling)^2
 * 3. Threshold Proximity (HITL 2FA distance penalty)
 * 4. Token Destructiveness & Sequence Invariant Penalties
 */
export class QuantitativeRiskEngine {
  /**
   * Blast radius baseline score per tool category
   */
  static getBaseToolBlastRadius(toolName) {
    if (!toolName) return 5.0;
    const lower = toolName.toLowerCase();

    // High-Impact / Destructive Operations
    if (lower.includes("drain") || lower.includes("restart") || lower.includes("reconcile") || lower.includes("delete") || lower.includes("refund")) {
      return 25.0;
    }
    // Mutation Operations
    if (lower.includes("mutate") || lower.includes("execute") || lower.includes("order") || lower.includes("trade") || lower.includes("update")) {
      return 15.0;
    }
    // Read-Only / Telemetry / Analysis
    return 5.0;
  }

  /**
   * Calculates continuous risk score [0.0 - 100.0]
   */
  static calculateRisk({
    toolName,
    amount = 0,
    spendCeilingUsd = 500,
    hitlThresholdUsd = 300,
    isDestructive = false,
    hasSequenceAnomaly = false,
    extraFactors = {}
  }) {
    const numAmount = Number(amount) || 0;
    const ceiling = Math.max(1, Number(spendCeilingUsd) || 500);
    const threshold = Math.max(1, Number(hitlThresholdUsd) || 300);

    // 1. Base Tool Risk [5 - 25]
    const baseRisk = this.getBaseToolBlastRadius(toolName);

    // 2. Continuous Financial Budget Consumption Risk [0 - 75]
    let financialRisk = 0.0;
    if (numAmount > 0) {
      const budgetRatio = numAmount / ceiling;

      if (numAmount > ceiling) {
        // Exceeds Hard Ceiling: baseline 70 + scaled excess penalty
        const excessRatio = (numAmount - ceiling) / ceiling;
        financialRisk = Math.min(75.0, 65.0 + (excessRatio * 20.0));
      } else if (numAmount > threshold) {
        // Between HITL Threshold and Hard Ceiling: proportional scaling + 2FA penalty
        const spanRatio = (numAmount - threshold) / (ceiling - threshold);
        financialRisk = 25.0 + (spanRatio * 35.0); // 25.0 to 60.0
      } else {
        // Below HITL Threshold: quadratic non-linear curve for low amounts
        financialRisk = Math.pow(numAmount / threshold, 1.8) * 20.0; // 0.0 to 20.0
      }
    }

    // 3. Security Penalties
    const destructivePenalty = isDestructive ? 60.0 : 0.0;
    const sequencePenalty = hasSequenceAnomaly ? 50.0 : 0.0;

    // 4. Composite Risk Calculation clamped to [1.0, 100.0]
    const rawScore = baseRisk + financialRisk + destructivePenalty + sequencePenalty;
    const finalScore = Math.min(100.0, Math.max(1.0, rawScore));

    return {
      score: Number(finalScore.toFixed(2)),
      breakdown: {
        baseToolRisk: baseRisk,
        financialRisk: Number(financialRisk.toFixed(2)),
        destructivePenalty,
        sequencePenalty,
        budgetConsumptionRatio: numAmount > 0 ? Number((numAmount / ceiling).toFixed(4)) : 0.0
      }
    };
  }
}
