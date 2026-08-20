import crypto from "crypto";

export class AgentIdentityDirectory {
  constructor() {
    this.workforce = [
      {
        id: "Finance-Agent-024",
        name: "Autonomous Invoice & Refund Reconciler",
        department: "Finance & Accounting",
        ownerEmail: "cfo-ops@enterprise.com",
        model: "claude-3-5-sonnet",
        modelProvider: "Anthropic",
        status: "ACTIVE", // ACTIVE | QUARANTINED | SUSPENDED | TESTING
        securityScore: 88,
        reliabilityScore: 99.2,
        riskLevel: "LOW",
        spendLimitUsd: 500.0,
        allowedTools: ["fetch_invoice_details", "execute_charge", "issue_refund"],
        delegationWhitelist: ["Billing-Agent-001", "Support-Agent-108"],
        tasksExecuted: 14203,
        lastPentest: "4 hours ago",
        passportSignature: "a1f9e832049b819f"
      },
      {
        id: "DevOps-SRE-Agent-089",
        name: "Cloud Auto-Remediation & K8s SRE",
        department: "Cloud Infrastructure",
        ownerEmail: "sre-lead@enterprise.com",
        model: "gpt-4o",
        modelProvider: "OpenAI",
        status: "ACTIVE",
        securityScore: 42,
        reliabilityScore: 84.5,
        riskLevel: "HIGH",
        spendLimitUsd: 2500.0,
        allowedTools: ["check_cluster_health", "scale_pods", "restart_service"],
        delegationWhitelist: ["Security-Agent-007"],
        tasksExecuted: 8920,
        lastPentest: "1 day ago",
        passportSignature: "f48c218e00192a77"
      },
      {
        id: "HR-Support-Agent-301",
        name: "Global Employee Triage & Helpdesk",
        department: "Human Resources",
        ownerEmail: "people-ops@enterprise.com",
        model: "gemini-1-5-pro",
        modelProvider: "Google Cloud",
        status: "ACTIVE",
        securityScore: 94,
        reliabilityScore: 98.7,
        riskLevel: "LOW",
        spendLimitUsd: 0.0,
        allowedTools: ["lookup_policy", "send_slack_message", "create_ticket"],
        delegationWhitelist: [],
        tasksExecuted: 31050,
        lastPentest: "2 hours ago",
        passportSignature: "cc3918bf8841a0e3"
      },
      {
        id: "Procurement-Agent-112",
        name: "Vendor Negotiation & PO Dispatcher",
        department: "Supply Chain",
        ownerEmail: "procure@enterprise.com",
        model: "llama-3-70b-custom",
        modelProvider: "Self-Hosted On-Prem",
        status: "QUARANTINED",
        securityScore: 31,
        reliabilityScore: 68.0,
        riskLevel: "CRITICAL",
        spendLimitUsd: 10000.0,
        allowedTools: ["draft_po", "dispatch_rfp", "vendor_payout"],
        delegationWhitelist: ["Finance-Agent-024"],
        tasksExecuted: 4120,
        lastPentest: "30 mins ago",
        passportSignature: "00918fa9c339a112"
      }
    ];
  }

  getWorkforce() {
    return this.workforce;
  }

  getAgent(agentId) {
    return this.workforce.find(a => a.id === agentId);
  }

  updateAgent(agentId, updates) {
    const agent = this.workforce.find(a => a.id === agentId);
    if (agent) {
      Object.assign(agent, updates);
      return agent;
    }
    return null;
  }

  toggleKillSwitch(agentId, reason = "Manual emergency shutdown triggered by CTO") {
    const agent = this.workforce.find(a => a.id === agentId);
    if (agent) {
      agent.status = agent.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
      agent.killSwitchReason = agent.status === "SUSPENDED" ? reason : null;
      return agent;
    }
    return null;
  }

  registerAgent(agentData) {
    const newAgent = {
      id: agentData.id || "Agent-" + crypto.randomBytes(3).toString("hex").toUpperCase(),
      name: agentData.name || "Custom AI Worker",
      department: agentData.department || "Engineering",
      ownerEmail: agentData.ownerEmail || "admin@enterprise.com",
      model: agentData.model || "gpt-4o",
      modelProvider: agentData.modelProvider || "OpenAI",
      status: "TESTING",
      securityScore: 60,
      reliabilityScore: 80.0,
      riskLevel: "MEDIUM",
      spendLimitUsd: agentData.spendLimitUsd || 100.0,
      allowedTools: agentData.allowedTools || [],
      delegationWhitelist: agentData.delegationWhitelist || [],
      tasksExecuted: 0,
      lastPentest: "Pending initial red-team",
      passportSignature: crypto.randomBytes(8).toString("hex")
    };
    this.workforce.push(newAgent);
    return newAgent;
  }
}
