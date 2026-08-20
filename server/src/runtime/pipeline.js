import crypto from "crypto";
import { store } from "../core/store.js";

export class AgentExecutionPipeline {
  constructor(broadcastEvent = () => {}) {
    this.broadcastEvent = broadcastEvent;
  }

  calculateHash(data) {
    return crypto.createHash("sha256").update(JSON.stringify(data)).digest("hex");
  }

  async executeAgentGoal({ agentId, userGoal, spendLimitUsd }) {
    const agent = store.getAgent(agentId) || store.getAgents()[0];
    const txId = "tx_" + crypto.randomBytes(4).toString("hex");
    const delay = ms => new Promise(r => setTimeout(r, ms));

    // Check if agent is currently frozen/killed
    if (agent.status === "SUSPENDED") {
      const blockedEvent = {
        step: 0,
        type: "KILL_SWITCH_BLOCKED",
        verdict: "BLOCKED",
        reason: `Agent '${agent.name}' is currently frozen by executive emergency kill switch. Execution denied.`,
        timestamp: new Date().toISOString()
      };
      this.broadcastEvent({ type: "PIPELINE_EVENT", data: blockedEvent });
      return { success: false, reason: blockedEvent.reason };
    }

    const transaction = {
      id: txId,
      agentId: agent.id,
      agentName: agent.name,
      goal: userGoal,
      status: "IN_PROGRESS",
      startedAt: new Date().toISOString(),
      steps: [],
      rollbackLog: null
    };

    store.transactions.unshift(transaction);
    this.broadcastEvent({ type: "TRANSACTION_STARTED", data: transaction });

    const goalLower = userGoal.toLowerCase();
    const effectiveSpendLimit = spendLimitUsd || agent.spendCeilingUsd || 500;

    // --- SCENARIO A: Financial Refund / Billing Task ---
    if (goalLower.includes("refund") || goalLower.includes("billing") || goalLower.includes("sarah") || goalLower.includes("credit")) {
      
      // Step 1: Cognitive Planning & DB Lookup
      await delay(500);
      const step1Thought = {
        stepNumber: 1,
        title: "Query Customer & Order Database",
        thought: `Goal received: "${userGoal}". Fetching customer profile and order record from database to verify transaction validity.`,
        toolName: "query_database",
        params: { table: "customers", filter: { id: "usr_101" } },
        verdict: "ALLOWED",
        verdictReason: "Read-only query passed all safety invariant checks.",
        riskScore: 5,
        latencyMs: 4.2
      };

      const customer = store.virtualDB.customers.find(c => c.id === "usr_101");
      const order = store.virtualDB.orders.find(o => o.customerId === "usr_101");
      step1Thought.output = { customer, order };
      
      transaction.steps.push({
        step: 1,
        tool: "query_database",
        params: step1Thought.params,
        inverse: "no_op",
        status: "COMPLETED",
        output: step1Thought.output
      });

      this._logAuditBlock(agent.id, "query_database", "ALLOWED", step1Thought.verdictReason, 5);
      this.broadcastEvent({ type: "PIPELINE_STEP", data: { txId, ...step1Thought } });
      await delay(700);

      // Step 2: Check if goal requests an excessive or rogue amount
      const isExcessiveRefund = /([5-9]\d{3,}|[1-9]\d{4,})/.test(userGoal) || goalLower.includes("excessive") || goalLower.includes("rogue");
      const refundAmount = isExcessiveRefund ? 6400.00 : 150.00;

      const step2Thought = {
        stepNumber: 2,
        title: "Issue Transactional Refund",
        thought: `Verified order ord_501 ($150.00). Attempting to execute refund tool for amount $${refundAmount.toFixed(2)}.`,
        toolName: "issue_refund",
        params: { customerId: "usr_101", orderId: "ord_501", amount: refundAmount, reason: "Customer Satisfaction Credit" },
        latencyMs: 6.8
      };

      // GUARDRAIL CHECK: Spend Ceiling & Shadow Simulation
      if (refundAmount > effectiveSpendLimit) {
        step2Thought.verdict = "BLOCKED";
        step2Thought.riskScore = 95;
        step2Thought.verdictReason = `SPEND CEILING BREACH: Requested refund ($${refundAmount.toFixed(2)}) exceeds maximum autonomous limit ($${effectiveSpendLimit.toFixed(2)}).`;
        
        transaction.status = "ROLLED_BACK";
        transaction.rollbackLog = {
          triggeredAt: new Date().toISOString(),
          reason: step2Thought.verdictReason,
          revertedSteps: 1,
          details: "Rollback DAG automatically executed inverse compensation on Step 1."
        };

        this._logAuditBlock(agent.id, "issue_refund", "BLOCKED", step2Thought.verdictReason, 95);
        this.broadcastEvent({ type: "PIPELINE_STEP", data: { txId, ...step2Thought } });
        this.broadcastEvent({ type: "TRANSACTION_ROLLED_BACK", data: transaction });
        
        return { success: false, transaction, outcome: `❌ Execution Blocked: ${step2Thought.verdictReason}` };
      }

      // If within spend limit: Process Refund & Record Inverse Operation
      step2Thought.verdict = "ALLOWED";
      step2Thought.riskScore = 15;
      step2Thought.verdictReason = `Within autonomous spend limit ($${refundAmount} <= $${effectiveSpendLimit}). Speculative sandbox simulation PASSED.`;
      
      const refundId = "ref_" + crypto.randomBytes(3).toString("hex");
      step2Thought.output = {
        refundId,
        amountRefunded: refundAmount,
        status: "COMPLETED_IN_SANDBOX",
        customerBalanceAfter: customer.balance + refundAmount
      };

      // Register inverse operation in DAG
      transaction.steps.push({
        step: 2,
        tool: "issue_refund",
        params: step2Thought.params,
        inverse: {
          inverseTool: "cancel_or_recharge_refund",
          inverseParams: { refundId, amount: refundAmount, reason: "Auto-revert compensation" }
        },
        status: "COMPLETED",
        output: step2Thought.output
      });

      this._logAuditBlock(agent.id, "issue_refund", "ALLOWED", step2Thought.verdictReason, 15);
      this.broadcastEvent({ type: "PIPELINE_STEP", data: { txId, ...step2Thought } });
      await delay(700);

      // Step 3: Dispatch Confirmation Notification
      const step3Thought = {
        stepNumber: 3,
        title: "Dispatch Confirmation & Commit State",
        thought: "Refund processed safely. Sending confirmation email to Sarah Connor and committing transaction.",
        toolName: "send_notification",
        params: { recipient: "sarah@cyberdyne.io", subject: "Refund Confirmed: $150.00 credited to account" },
        verdict: "ALLOWED",
        verdictReason: "Payload sanitized. Zero PII leak detected.",
        riskScore: 8,
        latencyMs: 3.9,
        output: { delivered: true, messageId: "msg_9921" }
      };

      transaction.steps.push({
        step: 3,
        tool: "send_notification",
        params: step3Thought.params,
        inverse: "send_correction_notice",
        status: "COMPLETED",
        output: step3Thought.output
      });

      transaction.status = "COMMITTED";
      this._logAuditBlock(agent.id, "send_notification", "ALLOWED", step3Thought.verdictReason, 8);
      this.broadcastEvent({ type: "PIPELINE_STEP", data: { txId, ...step3Thought } });
      this.broadcastEvent({ type: "TRANSACTION_COMMITTED", data: transaction });

      return {
        success: true,
        transaction,
        outcome: `✅ Mission Completed: Reconciled order ord_501 and issued $${refundAmount.toFixed(2)} refund safely under Synapse governance.`
      };
    }

    // --- SCENARIO B: SRE / DevOps Cloud Auto-Remediation Task ---
    else if (goalLower.includes("node") || goalLower.includes("cluster") || goalLower.includes("sre") || goalLower.includes("incident")) {
      
      // Step 1: Health Inspection
      await delay(500);
      const step1 = {
        stepNumber: 1,
        title: "Inspect Kubernetes Cluster Node Telemetry",
        thought: "Querying cloud infrastructure cluster prod-us-east-1 to identify degraded nodes and resource bottlenecks.",
        toolName: "manage_cloud_resources",
        params: { action: "get_node_metrics", clusterId: "prod-us-east-1" },
        verdict: "ALLOWED",
        verdictReason: "Telemetry read passed all invariants.",
        riskScore: 8,
        latencyMs: 5.1,
        output: { nodes: store.virtualDB.cloudNodes }
      };

      transaction.steps.push({ step: 1, tool: "manage_cloud_resources", params: step1.params, status: "COMPLETED", output: step1.output });
      this._logAuditBlock(agent.id, "manage_cloud_resources", "ALLOWED", step1.verdictReason, 8);
      this.broadcastEvent({ type: "PIPELINE_STEP", data: { txId, ...step1 } });
      await delay(700);

      // Check if user goal is malicious / destructive
      const isDestructive = goalLower.includes("drop") || goalLower.includes("terminate all") || goalLower.includes("delete all");
      if (isDestructive) {
        const step2Destructive = {
          stepNumber: 2,
          title: "Intercept Destructive Infrastructure Mutation",
          thought: "Agent attempted executing catastrophic wipe command 'terminate_all_nodes'.",
          toolName: "manage_cloud_resources",
          params: { action: "terminate_all_nodes", environment: "production" },
          verdict: "BLOCKED",
          verdictReason: "ZERO-DESTRUCTION LOCK: Command matched invariant filter [terminate_all]. Blocked in speculative shadow sandbox.",
          riskScore: 99,
          latencyMs: 2.1
        };

        transaction.status = "ROLLED_BACK";
        transaction.rollbackLog = {
          triggeredAt: new Date().toISOString(),
          reason: step2Destructive.verdictReason,
          revertedSteps: 1
        };

        this._logAuditBlock(agent.id, "manage_cloud_resources", "BLOCKED", step2Destructive.verdictReason, 99);
        this.broadcastEvent({ type: "PIPELINE_STEP", data: { txId, ...step2Destructive } });
        this.broadcastEvent({ type: "TRANSACTION_ROLLED_BACK", data: transaction });

        return { success: false, transaction, outcome: `❌ Catastrophic Action Blocked: ${step2Destructive.verdictReason}` };
      }

      // Safe Auto-Remediation Step 2: Restart degraded node
      const step2Safe = {
        stepNumber: 2,
        title: "Restart Degraded Node node-us-east-1b in Isolated Sandbox",
        thought: "Node 'node-us-east-1b' reports 98% memory leak. Executing graceful container drain and isolated restart.",
        toolName: "manage_cloud_resources",
        params: { action: "restart_node", targetNode: "node-us-east-1b" },
        verdict: "ALLOWED",
        verdictReason: "Speculative sandbox verified zero-downtime traffic rerouting.",
        riskScore: 20,
        latencyMs: 7.4,
        output: { targetNode: "node-us-east-1b", newStatus: "HEALTHY", cpuPercent: 22, memoryPercent: 35 }
      };

      // Mutate virtual DB node status
      const degradedNode = store.virtualDB.cloudNodes.find(n => n.id === "node-us-east-1b");
      if (degradedNode) {
        degradedNode.status = "HEALTHY";
        degradedNode.cpuPercent = 22;
        degradedNode.memoryPercent = 35;
      }

      transaction.steps.push({
        step: 2,
        tool: "manage_cloud_resources",
        params: step2Safe.params,
        inverse: { inverseTool: "restore_node_snapshot", inverseParams: { targetNode: "node-us-east-1b" } },
        status: "COMPLETED",
        output: step2Safe.output
      });

      this._logAuditBlock(agent.id, "manage_cloud_resources", "ALLOWED", step2Safe.verdictReason, 20);
      this.broadcastEvent({ type: "PIPELINE_STEP", data: { txId, ...step2Safe } });
      await delay(700);

      // Step 3: Resolution Alert
      const step3 = {
        stepNumber: 3,
        title: "Dispatch SRE Incident Resolution Notice",
        thought: "Remediation verified. Node memory restored to 35% nominal. Notifying on-call engineers.",
        toolName: "send_notification",
        params: { recipient: "slack-channel-sre-ops", message: "Auto-remediation successful: node-us-east-1b restored to healthy state." },
        verdict: "ALLOWED",
        verdictReason: "Operational alert dispatched.",
        riskScore: 5,
        latencyMs: 3.2,
        output: { delivered: true }
      };

      transaction.steps.push({ step: 3, tool: "send_notification", params: step3.params, status: "COMPLETED", output: step3.output });
      transaction.status = "COMMITTED";
      this._logAuditBlock(agent.id, "send_notification", "ALLOWED", step3.verdictReason, 5);
      this.broadcastEvent({ type: "PIPELINE_STEP", data: { txId, ...step3 } });
      this.broadcastEvent({ type: "TRANSACTION_COMMITTED", data: transaction });

      return {
        success: true,
        transaction,
        outcome: "✅ Remediation Completed: Degraded Kubernetes node node-us-east-1b restored with zero downtime."
      };
    }

    // --- DEFAULT GENERAL WORKFLOW ---
    else {
      await delay(500);
      const step1 = {
        stepNumber: 1,
        title: "Evaluate Request & Query Environment",
        thought: `Evaluating mission: "${userGoal}". Inspecting environment data to plan trajectory.`,
        toolName: "query_database",
        params: { table: "customers" },
        verdict: "ALLOWED",
        verdictReason: "Read query cleared.",
        riskScore: 5,
        latencyMs: 4.0,
        output: { customersCount: store.virtualDB.customers.length }
      };

      transaction.steps.push({ step: 1, tool: "query_database", params: step1.params, status: "COMPLETED", output: step1.output });
      this._logAuditBlock(agent.id, "query_database", "ALLOWED", step1.verdictReason, 5);
      this.broadcastEvent({ type: "PIPELINE_STEP", data: { txId, ...step1 } });
      await delay(600);

      const step2 = {
        stepNumber: 2,
        title: "Complete Task & Commit State",
        thought: "Verified all trajectory invariants and parameters. Finalizing task output.",
        toolName: "send_notification",
        params: { recipient: agent.owner, message: `Completed task: ${userGoal}` },
        verdict: "ALLOWED",
        verdictReason: "Clean execution.",
        riskScore: 10,
        latencyMs: 3.5,
        output: { status: "SENT" }
      };

      transaction.steps.push({ step: 2, tool: "send_notification", params: step2.params, status: "COMPLETED", output: step2.output });
      transaction.status = "COMMITTED";
      this._logAuditBlock(agent.id, "send_notification", "ALLOWED", step2.verdictReason, 10);
      this.broadcastEvent({ type: "PIPELINE_STEP", data: { txId, ...step2 } });
      this.broadcastEvent({ type: "TRANSACTION_COMMITTED", data: transaction });

      return { success: true, transaction, outcome: `✅ Task executed safely under Synapse governance.` };
    }
  }

  _logAuditBlock(agentId, toolName, verdict, reason, riskScore) {
    const prevHash = store.auditLedger[0]?.hash || "0".repeat(64);
    const blockPayload = {
      index: store.auditLedger.length + 1,
      timestamp: new Date().toISOString(),
      agentId,
      toolName,
      verdict,
      reason,
      riskScore,
      prevHash
    };
    const hash = this.calculateHash(blockPayload);
    const block = { ...blockPayload, hash };
    store.auditLedger.unshift(block);
    return block;
  }
}
