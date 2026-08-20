/* Core Data Store for Synapse Control Plane */
import crypto from "crypto";

export class SynapseDataStore {
  constructor() {
    this.agents = [
      {
        id: "agt-claude-finance",
        name: "Financial Treasury & Billing Worker",
        provider: "Anthropic Claude 3.5 Sonnet",
        department: "Finance & Accounting",
        owner: "cfo-ops@enterprise.com",
        status: "ACTIVE",
        securityScore: 88,
        spendCeilingUsd: 500,
        allowedTools: ["query_database", "issue_refund", "send_notification"],
        systemPrompt: "You are an autonomous treasury reconciler. Verify invoice balances before issuing any refund. Never exceed $500.",
        lastAudit: "Today, 10:30 AM",
        tasksCount: 142
      },
      {
        id: "agt-antigravity-sre",
        name: "Antigravity Autonomous Cloud SRE",
        provider: "Google Antigravity / Gemini",
        department: "Cloud Infrastructure",
        owner: "sre-lead@enterprise.com",
        status: "ACTIVE",
        securityScore: 92,
        spendCeilingUsd: 2000,
        allowedTools: ["manage_cloud_resources", "query_database", "send_notification"],
        systemPrompt: "You are an autonomous SRE agent. Continuously monitor node health and execute zero-downtime container remediation.",
        lastAudit: "Today, 11:15 AM",
        tasksCount: 389
      },
      {
        id: "agt-codex-dev",
        name: "Codex Full-Stack Code Synthesizer",
        provider: "OpenAI Codex / GPT-4o",
        department: "Engineering",
        owner: "eng-director@enterprise.com",
        status: "ACTIVE",
        securityScore: 74,
        spendCeilingUsd: 100,
        allowedTools: ["execute_code_sandbox", "query_database", "send_notification"],
        systemPrompt: "You are an autonomous software developer. Inspect repository states and generate bugfixes with unit tests.",
        lastAudit: "Yesterday",
        tasksCount: 812
      },
      {
        id: "agt-salesforce-crm",
        name: "Salesforce Agentforce Support Bot",
        provider: "Salesforce Agentforce (Atlas)",
        department: "Customer Service",
        owner: "support-head@enterprise.com",
        status: "ACTIVE",
        securityScore: 95,
        spendCeilingUsd: 250,
        allowedTools: ["query_database", "send_notification"],
        systemPrompt: "You are a customer support agent. Resolve customer queries while redacting PII and enforcing refund caps.",
        lastAudit: "Today, 09:00 AM",
        tasksCount: 1204
      }
    ];

    this.virtualDB = {
      customers: [
        { id: "usr_101", name: "Sarah Connor", email: "sarah@cyberdyne.io", balance: 450.0, tier: "Enterprise" },
        { id: "usr_102", name: "John Wick", email: "john@continental.org", balance: 12500.0, tier: "VIP" },
        { id: "usr_103", name: "Alex Murphy", email: "alex@omnicorp.detroit", balance: 80.0, tier: "Standard" }
      ],
      orders: [
        { id: "ord_501", customerId: "usr_101", amount: 150.0, status: "PAID", item: "Cloud GPU Cluster Allocation" },
        { id: "ord_502", customerId: "usr_102", amount: 8500.0, status: "PAID", item: "Dedicated Datacenter SuperPOD" }
      ],
      cloudNodes: [
        { id: "node-us-east-1a", cpuPercent: 42, memoryPercent: 55, status: "HEALTHY" },
        { id: "node-us-east-1b", cpuPercent: 98, memoryPercent: 94, status: "DEGRADED (High Memory Leak)" }
      ]
    };

    this.transactions = [];
    this.auditLedger = [];
    this.pentestReports = [];
  }

  getAgents() { return this.agents; }
  getAgent(id) { return this.agents.find(a => a.id === id); }
  
  toggleAgentKillSwitch(id, reason) {
    const agent = this.getAgent(id);
    if (agent) {
      agent.status = agent.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
      agent.suspendReason = agent.status === "SUSPENDED" ? reason : null;
      return agent;
    }
    return null;
  }

  addAgent(agentData) {
    const id = "agt-" + agentData.name.toLowerCase().replace(/\s+/g, "-") + "-" + crypto.randomBytes(2).toString("hex");
    const newAgent = {
      id,
      name: agentData.name,
      provider: agentData.provider || "Anthropic Claude 3.5 Sonnet",
      department: agentData.department || "General Operations",
      owner: agentData.owner || "admin@enterprise.com",
      status: "ACTIVE",
      securityScore: 85,
      spendCeilingUsd: Number(agentData.spendCeilingUsd) || 500,
      allowedTools: agentData.allowedTools || ["query_database", "send_notification"],
      systemPrompt: agentData.systemPrompt || "Operate autonomously with strict safety bounds.",
      lastAudit: "Just created",
      tasksCount: 0
    };
    this.agents.unshift(newAgent);
    return newAgent;
  }

  getDatabaseState() {
    return this.virtualDB;
  }
}

export const store = new SynapseDataStore();
