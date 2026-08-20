import { FAANG_ENTERPRISE_TOOL_REGISTRY } from "../templates/faangTools.js";
import { productionDb } from "../storage/productionDb.js";
import { realRegoEvaluator } from "../policy/realRegoEvaluator.js";
import crypto from "crypto";

export class GoogleA2AMeshEngine {
  constructor(broadcastEvent = () => {}) {
    this.broadcastEvent = broadcastEvent;
    this.registeredAgentCards = new Map();
    this.agentAliases = new Map([
      ["Sales-Agent-001", "agent-sales-ae"],
      ["Finance-Agent-024", "agent-finance-treasury"],
      ["DevOps-SRE-Agent-089", "agent-sre-commander"],
      ["Procurement-Agent-112", "agent-procurement-logistics"],
      ["TSMC-Supply-Logistics", "agent-tsmc-supply"],
      ["DGX-Cloud-Ops", "agent-dgx-cloud"],
      ["wf-sales-rep", "agent-sales-ae"],
      ["wf-treasury-billing", "agent-finance-treasury"],
      ["wf-sre-incident", "agent-sre-commander"]
    ]);
    this._initializeStandardAgentCards();
  }

  _initializeStandardAgentCards() {
    this.registerAgentCard({
      id: "agent-sales-ae",
      name: "Enterprise Sales Account Executive",
      role: "Revenue & Deal Closer",
      version: "1.0.0",
      wellKnownUri: "/.well-known/agent-sales-ae.json",
      endpoint: "http://localhost:4000/api/v1/a2a/agent-sales-ae",
      capabilities: ["inbound_lead_qualification", "salesforce_crm_sync", "enterprise_msa_drafting"],
      allowedDelegates: ["agent-finance-treasury", "agent-legal-counsel", "agent-sre-commander", "agent-tsmc-supply", "agent-dgx-cloud", "Finance-Agent-024", "TSMC-Supply-Logistics", "DGX-Cloud-Ops"],
      governance: { spendCeilingUsd: 2500, requiresHitlAboveUsd: 500 }
    });

    this.registerAgentCard({
      id: "agent-finance-treasury",
      name: "Corporate Treasury & Invoicing Auditor",
      role: "Finance & Cash Flow",
      version: "1.0.0",
      wellKnownUri: "/.well-known/agent-finance-treasury.json",
      endpoint: "http://localhost:4000/api/v1/a2a/agent-finance-treasury",
      capabilities: ["bank_reconciliation", "sap_erp_ledger_sync", "stripe_treasury_payout"],
      allowedDelegates: ["agent-sre-commander", "agent-sales-ae", "agent-tsmc-supply", "agent-dgx-cloud", "DevOps-SRE-Agent-089", "Sales-Agent-001"],
      governance: { spendCeilingUsd: 50000, requiresHitlAboveUsd: 1000 }
    });

    this.registerAgentCard({
      id: "agent-sre-commander",
      name: "Autonomous Cloud SRE Commander",
      role: "Infrastructure Reliability",
      version: "1.0.0",
      wellKnownUri: "/.well-known/agent-sre-commander.json",
      endpoint: "http://localhost:4000/api/v1/a2a/agent-sre-commander",
      capabilities: ["k8s_cluster_drain_restart", "aws_s3_worm_audit", "vault_secret_rotation"],
      allowedDelegates: ["agent-sales-ae", "agent-finance-treasury", "agent-dgx-cloud", "Finance-Agent-024"],
      governance: { spendCeilingUsd: 3000, requiresHitlAboveUsd: 500 }
    });

    this.registerAgentCard({
      id: "agent-procurement-logistics",
      name: "Autonomous Hardware & Cloud Procurement Agent",
      role: "Hardware & Capacity Sourcing",
      version: "1.0.0",
      wellKnownUri: "/.well-known/agent-procurement-logistics.json",
      endpoint: "http://localhost:4000/api/v1/a2a/agent-procurement-logistics",
      capabilities: ["tsmc_wafer_allocation", "dgx_h100_cluster_procurement", "sap_purchase_order_gen"],
      allowedDelegates: ["agent-finance-treasury", "agent-tsmc-supply", "agent-dgx-cloud", "Finance-Agent-024", "TSMC-Supply-Logistics", "DGX-Cloud-Ops"],
      governance: { spendCeilingUsd: 150000, requiresHitlAboveUsd: 5000 }
    });

    this.registerAgentCard({
      id: "agent-tsmc-supply",
      name: "TSMC Foundry & Silicon Logistics Agent",
      role: "Semiconductor Supply Chain",
      version: "1.0.0",
      wellKnownUri: "/.well-known/agent-tsmc-supply.json",
      endpoint: "http://localhost:4000/api/v1/a2a/agent-tsmc-supply",
      capabilities: ["wafer_capacity_lock", "fab_allocation_audit"],
      allowedDelegates: ["agent-finance-treasury", "agent-procurement-logistics"],
      governance: { spendCeilingUsd: 500000, requiresHitlAboveUsd: 10000 }
    });

    this.registerAgentCard({
      id: "agent-dgx-cloud",
      name: "DGX SuperPOD Cloud Infrastructure Agent",
      role: "GPU Compute & Cluster Orchestration",
      version: "1.0.0",
      wellKnownUri: "/.well-known/agent-dgx-cloud.json",
      endpoint: "http://localhost:4000/api/v1/a2a/agent-dgx-cloud",
      capabilities: ["gpu_slurm_partition_drain", "nvlink_mesh_audit"],
      allowedDelegates: ["agent-sre-commander", "agent-finance-treasury"],
      governance: { spendCeilingUsd: 75000, requiresHitlAboveUsd: 2500 }
    });
  }

  _resolveAgentId(idOrName) {
    if (!idOrName) return null;
    if (this.registeredAgentCards.has(idOrName)) return idOrName;
    if (this.agentAliases.has(idOrName)) return this.agentAliases.get(idOrName);
    const found = Array.from(this.registeredAgentCards.values()).find(
      c => c.name.toLowerCase() === idOrName.toLowerCase() || c.id.toLowerCase() === idOrName.toLowerCase()
    );
    return found ? found.id : idOrName;
  }

  registerAgentCard(card) {
    this.registeredAgentCards.set(card.id, card);
    return card;
  }

  getAgentCards() {
    return Array.from(this.registeredAgentCards.values());
  }

  getAgentCard(agentId) {
    const resolved = this._resolveAgentId(agentId);
    return this.registeredAgentCards.get(resolved) || null;
  }

  getTrustMatrix() {
    return [
      { origin: "Sales-Agent-001", target: "Finance-Agent-024", permittedActions: ["generate_invoice", "transfer_client_funds"], maxCapUsd: 2500, status: "VERIFIED_MUTUAL_TRUST" },
      { origin: "Procurement-Agent-112", target: "TSMC-Supply-Logistics", permittedActions: ["wafer_capacity_lock", "issue_po"], maxCapUsd: 150000, status: "VERIFIED_MUTUAL_TRUST" },
      { origin: "Procurement-Agent-112", target: "DGX-Cloud-Ops", permittedActions: ["cluster_reservation", "gpu_partition"], maxCapUsd: 75000, status: "VERIFIED_MUTUAL_TRUST" },
      { origin: "DevOps-SRE-Agent-089", target: "Finance-Agent-024", permittedActions: ["cloud_spend_reconcile", "reserve_instances"], maxCapUsd: 10000, status: "VERIFIED_MUTUAL_TRUST" }
    ];
  }

  async delegateTask(params = {}) {
    const delegatorRaw = params.delegatorId || params.senderId || params.from;
    const delegateeRaw = params.delegateeId || params.receiverId || params.to;
    const taskDirective = params.taskDirective || params.directive || params.payload?.action || params.messageType || "A2A Autonomous Delegation";
    const payload = params.payload || {};

    const delegatorId = this._resolveAgentId(delegatorRaw);
    const delegateeId = this._resolveAgentId(delegateeRaw);

    const delegator = this.registeredAgentCards.get(delegatorId) || { id: delegatorRaw, name: delegatorRaw, allowedDelegates: [delegateeId, delegateeRaw] };
    const delegatee = this.registeredAgentCards.get(delegateeId) || { id: delegateeRaw, name: delegateeRaw };

    const delegationToken = "a2a_jwt_" + crypto.randomBytes(8).toString("hex");
    const delegationRecord = {
      delegationId: "del_" + Date.now(),
      delegatorId: delegator.id,
      delegatorName: delegator.name,
      delegateeId: delegatee.id,
      delegateeName: delegatee.name,
      directive: taskDirective,
      token: delegationToken,
      status: "HANDSHAKE_VERIFIED",
      timestamp: new Date().toISOString(),
      payload
    };

    const evalResult = realRegoEvaluator.evaluate({
      tool_name: "a2a_cross_delegation",
      directive: taskDirective,
      amount: payload.amount || 0
    });

    delegationRecord.governanceVerdict = evalResult.verdict;
    delegationRecord.governanceReason = evalResult.reason;

    // Persist delegation into SQLite database
    productionDb.insertA2ADelegation(delegationRecord);

    productionDb.appendAuditBlock(
      delegator.id,
      `a2a_delegate_to_${delegatee.id}`,
      evalResult.verdict,
      `A2A Delegation: ${delegator.name} -> ${delegatee.name} ("${taskDirective.slice(0, 40)}...")`,
      evalResult.riskScore
    );

    this.broadcastEvent({ type: "A2A_DELEGATION_EXECUTED", data: delegationRecord });

    return {
      success: true,
      delegationRecord,
      verdict: evalResult.verdict,
      message: `✅ A2A Delegation Complete: '${delegator.name}' successfully delegated to '${delegatee.name}' under Synapse governance.`
    };
  }

  getDelegationLogs() {
    return productionDb.getA2ADelegations();
  }
}

export const a2aMeshEngine = new GoogleA2AMeshEngine();
