export class AgentToAgentMesh {
  constructor(broadcastEvent = () => {}) {
    this.broadcastEvent = broadcastEvent;

    this.trustMatrix = [
      {
        agentPair: "Sales-Agent-001 <-> Finance-Agent-024",
        status: "MUTUALLY_AUTHENTICATED",
        protocol: "Google A2A v1.0 / mTLS",
        delegationScope: ["invoice_query", "refund_request_max_1000"],
        lastHandshake: "2 mins ago"
      },
      {
        agentPair: "Procurement-Agent-112 <-> TSMC-Supply-Logistics",
        status: "RESTRICTED_DELEGATION",
        protocol: "Anthropic MCP Handshake",
        delegationScope: ["wafer_allocation_query"],
        lastHandshake: "14 mins ago"
      },
      {
        agentPair: "DevOps-SRE-Agent-089 <-> DGX-Cloud-Ops",
        status: "MUTUALLY_AUTHENTICATED",
        protocol: "Google A2A v1.0 / mTLS",
        delegationScope: ["node_restart", "telemetry_read"],
        lastHandshake: "Just now"
      }
    ];

    this.messages = [
      {
        messageId: "a2a_msg_9941a",
        senderId: "Sales-Agent-001",
        receiverId: "Finance-Agent-024",
        messageType: "TASK_DELEGATION",
        payload: { action: "transfer_client_funds", amount: 4500.00, client: "Acme Corp" },
        verdict: "INTERCEPTED",
        violations: [
          {
            policyId: "a2a-delegation-ceiling",
            severity: "HIGH",
            reason: "A2A Trust Matrix Violation: Sales-Agent-001 is only permitted to delegate up to $1,000.00 to Finance-Agent-024. $4,500.00 transfer blocked."
          }
        ],
        latencyMs: 1.4,
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString()
      },
      {
        messageId: "a2a_msg_8812b",
        senderId: "DevOps-SRE-Agent-089",
        receiverId: "DGX-Cloud-Ops",
        messageType: "NODE_DRAIN_REQUEST",
        payload: { action: "restart_node", targetNode: "node-us-east-1b" },
        verdict: "VERIFIED_SAFE",
        violations: [],
        latencyMs: 0.8,
        timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString()
      }
    ];
  }

  getTrustMatrix() { return this.trustMatrix; }
  getA2AMessages() { return this.messages; }

  async routeA2AMessage({ senderId, receiverId, messageType, payload }) {
    const startTime = performance.now();
    let verdict = "VERIFIED_SAFE";
    let violations = [];

    const amount = Number(payload?.amount || 0);

    // Rule: Delegation spend ceiling
    if (senderId === "Sales-Agent-001" && amount > 1000) {
      verdict = "INTERCEPTED";
      violations.push({
        policyId: "a2a-delegation-ceiling",
        severity: "HIGH",
        reason: `A2A Trust Matrix Violation: ${senderId} is only permitted to delegate up to $1,000.00. Attempted $${amount.toFixed(2)} delegation to ${receiverId} blocked.`
      });
    }

    const durationMs = Number((performance.now() - startTime).toFixed(2));
    const record = {
      messageId: "a2a_msg_" + Math.random().toString(36).substring(2, 9),
      senderId,
      receiverId,
      messageType,
      payload,
      verdict,
      violations,
      latencyMs: durationMs,
      timestamp: new Date().toISOString()
    };

    this.messages.unshift(record);
    this.broadcastEvent({ type: "A2A_MESSAGE_ROUTED", data: record });
    return record;
  }
}
