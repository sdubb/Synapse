import crypto from "crypto";
import { productionDb } from "../storage/productionDb.js";

/**
 * Real SQLite-Backed Human-In-The-Loop (HITL) 2FA Approval Manager
 */
export class HitlApprovalManager {
  constructor(broadcastEvent = () => {}) {
    this.broadcastEvent = broadcastEvent;
    this.productionDb = productionDb;
  }

  getPendingApprovals() {
    const list = this.productionDb.getApprovals();
    return list.filter(a => a.status === "PENDING");
  }

  getAllApprovals() {
    return this.productionDb.getApprovals();
  }

  createApprovalRequest({ agentId, agentName, txId, toolName, parameters, reason, riskScore }) {
    const approvalId = "appr_" + crypto.randomBytes(4).toString("hex");
    const request = {
      approvalId,
      txId: txId || "tx_auto_" + Date.now(),
      agentId,
      agentName: agentName || agentId,
      toolName,
      parameters,
      reason,
      riskScore: riskScore || 50
    };

    const inserted = this.productionDb.insertApproval(request);

    this.broadcastEvent({
      type: "HITL_APPROVAL_REQUESTED",
      data: inserted
    });

    return inserted;
  }

  resolveApproval(approvalId, decision = "APPROVED", user = "security-oncall@enterprise.com") {
    const resolved = this.productionDb.resolveApproval(approvalId, decision, user);

    this.broadcastEvent({
      type: "HITL_APPROVAL_RESOLVED",
      data: resolved
    });

    return resolved;
  }
}

export const hitlApprovalManager = new HitlApprovalManager();
