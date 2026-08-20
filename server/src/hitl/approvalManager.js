import crypto from "crypto";
import { persistentStore } from "../storage/persistentStore.js";

export class HitlApprovalManager {
  constructor(broadcastEvent = () => {}) {
    this.broadcastEvent = broadcastEvent;
  }

  getPendingApprovals() {
    const list = persistentStore.getApprovals();
    return list.filter(a => a.status === "PENDING");
  }

  getAllApprovals() {
    return persistentStore.getApprovals();
  }

  createApprovalRequest({ agentId, agentName, txId, toolName, parameters, reason, riskScore }) {
    const approvalId = "appr_" + crypto.randomBytes(4).toString("hex");
    const request = {
      approvalId,
      txId,
      agentId,
      agentName,
      toolName,
      parameters,
      reason,
      riskScore,
      status: "PENDING", // PENDING | APPROVED | REJECTED
      createdAt: new Date().toISOString(),
      decidedAt: null,
      decidedBy: null
    };

    const all = persistentStore.getApprovals();
    all.unshift(request);
    persistentStore.saveApprovals(all);

    this.broadcastEvent({
      type: "HITL_APPROVAL_REQUESTED",
      data: request
    });

    return request;
  }

  resolveApproval(approvalId, decision = "APPROVED", user = "security-oncall@enterprise.com") {
    const all = persistentStore.getApprovals();
    const target = all.find(a => a.approvalId === approvalId);
    if (!target) throw new Error("Approval request not found");

    target.status = decision;
    target.decidedAt = new Date().toISOString();
    target.decidedBy = user;

    persistentStore.saveApprovals(all);

    this.broadcastEvent({
      type: "HITL_APPROVAL_RESOLVED",
      data: target
    });

    return target;
  }
}
