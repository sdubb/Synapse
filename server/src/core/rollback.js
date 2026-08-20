import crypto from "crypto";

export class RollbackEngine {
  constructor() {
    this.transactions = new Map(); // transactionId -> Transaction Object
  }

  // Register or begin a multi-step agent transaction session
  beginTransaction(agentId, workflowName) {
    const transactionId = "tx_" + crypto.randomBytes(6).toString("hex");
    const transaction = {
      id: transactionId,
      agentId,
      workflowName,
      status: "IN_PROGRESS", // IN_PROGRESS | COMMITTED | ROLLED_BACK | PARTIALLY_FAILED
      startTime: new Date().toISOString(),
      endTime: null,
      steps: [], // Array of { stepId, toolName, forwardParams, result, inverseOperation, status }
      rollbackLog: []
    };
    this.transactions.set(transactionId, transaction);
    return transaction;
  }

  getTransaction(transactionId) {
    return this.transactions.get(transactionId);
  }

  getAllTransactions() {
    return Array.from(this.transactions.values()).sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
  }

  // Calculate deterministic inverse operation for known action patterns
  computeInverse(toolName, parameters, result = {}) {
    switch (toolName) {
      case "issue_refund":
        return {
          inverseTool: "cancel_or_recharge_refund",
          inverseParams: {
            chargeId: parameters.chargeId || result.chargeId || "ch_auto",
            refundId: result.refundId || "ref_auto",
            amount: parameters.amount,
            reason: "Automatic rollback triggered by SynapseGuard"
          }
        };

      case "execute_charge":
        return {
          inverseTool: "issue_refund",
          inverseParams: {
            chargeId: result.chargeId || parameters.chargeId,
            amount: parameters.amount,
            reason: "Auto-revert charge due to subsequent workflow failure"
          }
        };

      case "update_inventory":
        return {
          inverseTool: "update_inventory",
          inverseParams: {
            sku: parameters.sku,
            quantityDelta: -1 * (parameters.quantityDelta || 0),
            reason: "Rollback reserved stock"
          }
        };

      case "create_database_record":
        return {
          inverseTool: "delete_database_record",
          inverseParams: {
            table: parameters.table,
            recordId: result.recordId || parameters.recordId
          }
        };

      case "modify_cloud_dns":
        return {
          inverseTool: "restore_cloud_dns",
          inverseParams: {
            domain: parameters.domain,
            previousRecord: parameters.previousRecord || result.previousRecord
          }
        };

      case "send_email_notification":
        return {
          inverseTool: "send_correction_email",
          inverseParams: {
            recipient: parameters.recipient,
            subject: "Correction: Previous automated notification cancelled",
            referenceMessageId: result.messageId
          }
        };

      default:
        return {
          inverseTool: "generic_compensating_hook",
          inverseParams: {
            originalTool: toolName,
            originalParams: parameters
          }
        };
    }
  }

  // Record an executed step in the transaction graph
  recordStep(transactionId, stepData) {
    const tx = this.transactions.get(transactionId);
    if (!tx) throw new Error(`Transaction ${transactionId} not found`);

    const inverse = this.computeInverse(stepData.toolName, stepData.parameters, stepData.result);
    const step = {
      stepId: "step_" + (tx.steps.length + 1),
      stepIndex: tx.steps.length + 1,
      toolName: stepData.toolName,
      parameters: stepData.parameters,
      result: stepData.result,
      inverseOperation: inverse,
      status: stepData.status || "COMPLETED", // COMPLETED | FAILED | REVERTED
      timestamp: new Date().toISOString()
    };

    tx.steps.push(step);
    return step;
  }

  // Execute full automated or manual rollback
  async executeRollback(transactionId, reason = "Failure in dependent downstream step") {
    const tx = this.transactions.get(transactionId);
    if (!tx) throw new Error(`Transaction ${transactionId} not found`);

    tx.status = "ROLLING_BACK";
    const rollbackSteps = [];

    // Traverse executed steps in reverse order (LIFO)
    for (let i = tx.steps.length - 1; i >= 0; i--) {
      const step = tx.steps[i];
      if (step.status === "COMPLETED") {
        const revertStart = Date.now();
        
        // Simulate execution of compensating inverse action
        const inverseResult = {
          success: true,
          revertedTool: step.inverseOperation.inverseTool,
          revertedParams: step.inverseOperation.inverseParams,
          revertedAt: new Date().toISOString(),
          durationMs: Date.now() - revertStart + 15
        };

        step.status = "REVERTED";
        rollbackSteps.push({
          stepId: step.stepId,
          originalTool: step.toolName,
          executedInverse: step.inverseOperation,
          inverseResult
        });
      }
    }

    tx.status = "ROLLED_BACK";
    tx.endTime = new Date().toISOString();
    tx.rollbackLog = {
      triggeredAt: new Date().toISOString(),
      reason,
      totalStepsReverted: rollbackSteps.length,
      rollbackSteps
    };

    return tx;
  }

  commitTransaction(transactionId) {
    const tx = this.transactions.get(transactionId);
    if (tx && tx.status === "IN_PROGRESS") {
      tx.status = "COMMITTED";
      tx.endTime = new Date().toISOString();
    }
    return tx;
  }
}
