export const ENTERPRISE_WORKFLOW_TEMPLATES = [
  {
    id: "wf-sales-rep",
    name: "Autonomous Enterprise Sales Representative (Full-Day Pipeline)",
    role: "Enterprise SDR & Account Executive",
    model: "Anthropic Claude 3.5 Sonnet / Salesforce Agentforce",
    department: "Sales & Revenue Ops",
    spendCeilingUsd: 1500,
    dailyTasksCount: "1,200 leads/day",
    summary: "Executes continuous inbound qualification, Salesforce CRM enrichment, contract drafting with dynamic pricing, and A2A delegation to Finance for invoice creation.",
    pipelineSteps: [
      {
        step: 1,
        title: "Lead Qualification & Enrichment",
        tool: "query_database",
        params: { source: "inbound_web_form", company: "Cyberdyne Systems", budget: 75000, leadScore: 94 },
        governance: "Sanitizes lead data; scrubs personal contact phone numbers."
      },
      {
        step: 2,
        title: "CRM Record Creation & Pipeline Sync",
        tool: "update_salesforce_account",
        params: { accountName: "Cyberdyne Systems", stage: "Proposal/Price Quote", dealValue: 75000 },
        governance: "Verifies CRM field permissions and checks for duplicate account records."
      },
      {
        step: 3,
        title: "Draft Enterprise MSA & Discount Schedule",
        tool: "generate_contract_artifact",
        params: { template: "Enterprise_MSA_v3", customDiscountPercent: 20, netPaymentTerms: "Net-30" },
        governance: "Enforces max 20% discount cap (over 20% triggers HITL 2FA approval)."
      },
      {
        step: 4,
        title: "A2A Delegation to Finance Agent (Google A2A Mesh)",
        tool: "a2a_delegate_task",
        params: { delegatee: "Finance-Agent-024", action: "generate_preliminary_invoice", amount: 75000 },
        governance: "A2A Trust Matrix verifies cryptographic signature & delegation ceiling."
      },
      {
        step: 5,
        title: "Executive Revenue Summary Dispatch",
        tool: "send_notification",
        params: { channel: "slack-revenue-execs", message: "🎉 Qualified Cyberdyne Systems ($75k ARR) moved to Contract Stage." },
        governance: "Dispatched securely to authorized Slack channel with zero PII leakage."
      }
    ]
  },
  {
    id: "wf-customer-support",
    name: "Tier-2 Customer Care & Retention Lead",
    role: "Support Operations",
    model: "Anthropic Claude 3.5 Sonnet",
    department: "Customer Success",
    spendCeilingUsd: 500,
    dailyTasksCount: "2,500 tickets/day",
    summary: "Triages Zendesk tickets, investigates customer account ledger, applies retention credits up to $300, and escalates platform bugs.",
    pipelineSteps: [
      {
        step: 1,
        title: "Triage Inbound Support Ticket",
        tool: "query_database",
        params: { ticketId: "ZD-9912", customerId: "usr_101", priority: "HIGH" },
        governance: "Read-only query passed."
      },
      {
        step: 2,
        title: "Issue Retention Credit to Account",
        tool: "issue_refund",
        params: { customerId: "usr_101", amount: 150.00, reason: "Service Degradation Apology" },
        governance: "Within $300 autonomous limit. Inverse rollback registered in DAG."
      },
      {
        step: 3,
        title: "Close Ticket & Email Customer",
        tool: "send_notification",
        params: { recipient: "sarah@cyberdyne.io", subject: "Ticket Resolved: $150 credit added" },
        governance: "Outbound communication scrubbed."
      }
    ]
  },
  {
    id: "wf-devops-commander",
    name: "Autonomous SRE & Infrastructure Auto-Healing",
    role: "Cloud Reliability",
    model: "Google Antigravity / OpenAI Codex",
    department: "Engineering",
    spendCeilingUsd: 3000,
    dailyTasksCount: "Continuous 24/7 Monitoring",
    summary: "Monitors Kubernetes pod health, drains degraded nodes, executes container restarts, and verifies latency SLAs.",
    pipelineSteps: [
      {
        step: 1,
        title: "Query Cluster Health Telemetry",
        tool: "manage_cloud_resources",
        params: { action: "get_node_metrics", cluster: "prod-us-east-1" },
        governance: "Telemetry read approved."
      },
      {
        step: 2,
        title: "Drain and Restart Degraded Pod",
        tool: "manage_cloud_resources",
        params: { action: "restart_node", targetNode: "node-us-east-1b" },
        governance: "Simulated in shadow sandbox with zero-downtime traffic rerouting."
      },
      {
        step: 3,
        title: "Dispatch SRE Resolution Alert",
        tool: "send_notification",
        params: { recipient: "slack-sre-oncall", message: "Node node-us-east-1b healed. Memory at 35% nominal." },
        governance: "Operational notice sent."
      }
    ]
  }
];
