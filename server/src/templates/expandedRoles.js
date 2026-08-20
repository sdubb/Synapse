export const EXPANDED_ENTERPRISE_ROLES = [
  // 1. REVENUE & GO-TO-MARKET (GTM)
  {
    id: "wf-sales-rep",
    category: "Revenue & Sales",
    name: "Autonomous Enterprise Account Executive (Sales)",
    role: "Inbound/Outbound Deal Closer",
    model: "Anthropic Claude 3.5 Sonnet / Salesforce Agentforce",
    dailyVolume: "1,200 leads/day",
    spendCeilingUsd: 2500,
    badge: "Revenue GTM",
    badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
    description: "Inbound qualification -> CRM enrichment -> Enterprise MSA contract drafting (20% discount cap) -> A2A delegation to Finance -> Executive Slack summary.",
    pipelineSteps: [
      { step: 1, title: "Inbound Lead Qualification", tool: "query_database", params: { company: "Cyberdyne Systems", budget: 75000, leadScore: 94 }, governance: "PII Sanitized." },
      { step: 2, title: "Salesforce CRM Sync", tool: "update_salesforce_account", params: { account: "Cyberdyne Systems", stage: "Contracting", dealValue: 75000 }, governance: "Field permissions cleared." },
      { step: 3, title: "Draft Enterprise Contract", tool: "generate_contract_artifact", params: { discount: 20, terms: "Net-30" }, governance: "Pricing cap verified." },
      { step: 4, title: "A2A Delegation to Finance Agent", tool: "a2a_delegate_task", params: { delegatee: "Finance-Agent-024", action: "generate_invoice", amount: 75000 }, governance: "Google A2A handshake verified." },
      { step: 5, title: "Executive Revenue Summary", tool: "send_notification", params: { channel: "slack-revenue-execs" }, governance: "Zero leak." }
    ]
  },
  {
    id: "wf-growth-marketing",
    category: "Marketing & Growth",
    name: "Autonomous AI Growth & Performance Marketer",
    role: "Campaign Optimizer & Ad Spend Allocator",
    model: "OpenAI GPT-4o / Claude 3.5",
    dailyVolume: "$150k Daily Ad Budget",
    spendCeilingUsd: 5000,
    badge: "Growth Engine",
    badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/40",
    description: "Monitors Google/Meta ad CAC/ROAS -> dynamically rebalances $15,000 ad budget -> synthesizes high-converting copy variants -> tracks conversion attribution.",
    pipelineSteps: [
      { step: 1, title: "Query Real-Time Ad Performance", tool: "query_database", params: { metrics: ["CAC", "ROAS", "CTR"], window: "past_24h" }, governance: "Read metrics." },
      { step: 2, title: "Reallocate Campaign Ad Spend", tool: "manage_cloud_resources", params: { shiftBudgetUsd: 15000, targetChannel: "Google Search High-Intent" }, governance: "Spend ceiling verified under $25,000/day limit." },
      { step: 3, title: "A/B Copy Variant Generation", tool: "generate_contract_artifact", params: { variantsCount: 5, targetPersona: "Enterprise VP of Engineering" }, governance: "Content safety check passed." },
      { step: 4, title: "Publish Campaign Updates", tool: "send_notification", params: { channel: "marketing-ops-slack" }, governance: "Logged in audit ledger." }
    ]
  },

  // 2. FINANCE, LEGAL & TREASURY
  {
    id: "wf-treasury-billing",
    category: "Finance & Accounting",
    name: "Autonomous Corporate Treasury & Invoicing Auditor",
    role: "Billing & Reconciliation",
    model: "Anthropic Claude 3.5 Sonnet",
    dailyVolume: "5,000 invoices/day",
    spendCeilingUsd: 50000,
    badge: "Treasury Guard",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    description: "Reconciles multi-currency Stripe bank payouts -> identifies ledger discrepancies -> auto-collects overdue Net-30 invoices -> executes vendor wire disbursements.",
    pipelineSteps: [
      { step: 1, title: "Bank Payout Reconciliation", tool: "query_database", params: { ledger: "stripe_payouts_q3", currency: "USD", totalBatch: 450000 }, governance: "Multi-currency integrity checked." },
      { step: 2, title: "Investigate Overdue Invoices", tool: "query_database", params: { agingFilter: ">30_days", minAmount: 5000 }, governance: "Identified 3 overdue accounts." },
      { step: 3, title: "Execute Vendor Wire Disbursement", tool: "issue_refund", params: { vendorId: "AWS_INFRA_CORP", amount: 14200.00, purpose: "Cloud Compute Settlement" }, governance: "Within corporate treasury ceiling. Inverse registered." },
      { step: 4, title: "Ledger State Commit", tool: "send_notification", params: { recipient: "cfo-ops@enterprise.com" }, governance: "Audit block signed." }
    ]
  },
  {
    id: "wf-legal-compliance",
    category: "Legal & Risk",
    name: "Autonomous Corporate Legal & NDA Reviewer",
    role: "Contract Risk Analyzer",
    model: "Anthropic Claude 3.5 Sonnet",
    dailyVolume: "200 contracts/day",
    spendCeilingUsd: 500,
    badge: "Risk Mitigation",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    description: "Reviews third-party vendor NDAs & Master Services Agreements -> redlines non-standard indemnification clauses -> enforces liability caps ($1M max).",
    pipelineSteps: [
      { step: 1, title: "Ingest & OCR Third-Party MSA", tool: "query_database", params: { docType: "Vendor_SaaS_MSA", vendor: "CloudData Global" }, governance: "Confidentiality filter active." },
      { step: 2, title: "Detect Non-Standard Indemnity Clauses", tool: "generate_contract_artifact", params: { clauseFlagged: "Unlimited Consequential Damages", riskRating: "CRITICAL" }, governance: "Zero-liability clause violation caught." },
      { step: 3, title: "Apply Standard Corporate Redlines", tool: "generate_contract_artifact", params: { redlinePatch: "Cap total liability at 12 months fees paid ($100k max)" }, governance: "Standard Legal terms enforced." },
      { step: 4, title: "Deliver Redlined Package to Counterparty", tool: "send_notification", params: { recipient: "counsel@clouddata.io" }, governance: "Delivered securely." }
    ]
  },

  // 3. PEOPLE, HR & TALENT
  {
    id: "wf-hr-onboarding",
    category: "HR & People Ops",
    name: "Autonomous Talent Recruiter & Employee Onboarding Lead",
    role: "People Operations",
    model: "Google Gemini 1.5 Pro / GPT-4o",
    dailyVolume: "400 applicants/day",
    spendCeilingUsd: 1000,
    badge: "People & HR",
    badgeColor: "bg-pink-500/20 text-pink-300 border-pink-500/40",
    description: "Screens engineering resumes against rubric -> schedules candidate interview loops -> provisions corporate Okta, Slack, and Google Workspace accounts with Zero-Trust RBAC.",
    pipelineSteps: [
      { step: 1, title: "Candidate Resume Scoring", tool: "query_database", params: { role: "Staff Distributed Systems Engineer", applicantsCount: 45 }, governance: "Bias sanitization & PII masking applied." },
      { step: 2, title: "Schedule Panel Interviews", tool: "send_notification", params: { candidateEmail: "alex.murphy@eng.net", panelSlots: ["Tue 2pm", "Wed 10am"] }, governance: "Calendar sync verified." },
      { step: 3, title: "Provision Corporate Okta Identity", tool: "manage_cloud_resources", params: { newEmployee: "Alex Murphy", role: "Engineering", assignedGroups: ["github-eng", "slack-general"] }, governance: "Least-privilege RBAC enforced (No production root access)." },
      { step: 4, title: "Dispatch Welcome Packet", tool: "send_notification", params: { recipient: "alex.murphy@enterprise.com" }, governance: "Provisioning complete." }
    ]
  },

  // 4. IT, SECURITY & SRE INFRASTRUCTURE
  {
    id: "wf-devops-commander",
    category: "Engineering & SRE",
    name: "Autonomous SRE & Infrastructure Auto-Healing",
    role: "Cloud Reliability Commander",
    model: "Google Antigravity / OpenAI Codex",
    dailyVolume: "Continuous 24/7",
    spendCeilingUsd: 3000,
    badge: "Zero Downtime",
    badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
    description: "Monitors Kubernetes pod health, drains degraded nodes, executes zero-downtime container restarts in isolated sandboxes, and verifies latency SLAs.",
    pipelineSteps: [
      { step: 1, title: "Query Cluster Health Telemetry", tool: "manage_cloud_resources", params: { action: "get_node_metrics", cluster: "prod-us-east-1" }, governance: "Telemetry read approved." },
      { step: 2, title: "Drain and Restart Degraded Pod", tool: "manage_cloud_resources", params: { action: "restart_node", targetNode: "node-us-east-1b" }, governance: "Simulated in shadow sandbox with zero-downtime traffic rerouting." },
      { step: 3, title: "Dispatch SRE Resolution Alert", tool: "send_notification", params: { recipient: "slack-sre-oncall", message: "Node node-us-east-1b healed. Memory at 35% nominal." }, governance: "Operational notice sent." }
    ]
  },
  {
    id: "wf-secops-sentinel",
    category: "Cybersecurity & SecOps",
    name: "Autonomous SOC Analyst & Threat Hunter (SecOps)",
    role: "Security Operations",
    model: "Anthropic Claude 3.5 Sonnet",
    dailyVolume: "100k events/sec",
    spendCeilingUsd: 500,
    badge: "Zero-Trust SecOps",
    badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/40",
    description: "Ingests SIEM / CloudTrail logs -> detects anomalous IAM privilege escalations -> isolates compromised API tokens -> triggers firewall IP blocks.",
    pipelineSteps: [
      { step: 1, title: "SIEM CloudTrail Log Ingestion", tool: "query_database", params: { eventsAnalyzed: 100000, anomalyThreshold: "HIGH" }, governance: "Continuous monitoring active." },
      { step: 2, title: "Detect Rogue IAM Key Escalation", tool: "manage_cloud_resources", params: { flaggedKey: "AKIA_ROGUE_EXPLOIT_99", action: "REVOKE_KEY_IMMEDIATELY" }, governance: "Zero-Day mitigation executed." },
      { step: 3, title: "Block Attacker Subnet IP Range", tool: "manage_cloud_resources", params: { targetSubnet: "185.220.101.0/24", action: "INJECT_WAF_DENY_RULE" }, governance: "Edge WAF updated in 12ms." },
      { step: 4, title: "Disclose Security Incident to CISO", tool: "send_notification", params: { recipient: "ciso-alerts@enterprise.com", severity: "SEV-1_CONTAINED" }, governance: "Audit log sealed." }
    ]
  },

  // 5. PRODUCT, ENGINEERING & CODE SYNTHESIS
  {
    id: "wf-code-synthesizer",
    category: "Product & Engineering",
    name: "Autonomous Full-Stack Code Reviewer & PR Synthesizer",
    role: "Software Engineering",
    model: "OpenAI Codex / Claude 3.5",
    dailyVolume: "50 Pull Requests/day",
    spendCeilingUsd: 500,
    badge: "Code Synthesizer",
    badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/40",
    description: "Inspects GitHub PR diffs -> runs automated static analysis & security linter -> generates missing unit test suites -> creates auto-patch PR.",
    pipelineSteps: [
      { step: 1, title: "Fetch Pull Request Diff", tool: "query_database", params: { repo: "enterprise-monorepo", prNumber: 842 }, governance: "Read repo state." },
      { step: 2, title: "Static Security & Race Condition Scan", tool: "query_database", params: { vulnerabilitiesFound: 0, testCoverage: "84%" }, governance: "Zero vulnerability clearance." },
      { step: 3, title: "Synthesize Unit Tests & Auto-Fix", tool: "generate_contract_artifact", params: { testFile: "tests/auth_test.go", newAssertions: 8 }, governance: "Code artifact compiled." },
      { step: 4, title: "Post GitHub Approval & Merge Request", tool: "send_notification", params: { prNumber: 842, status: "APPROVED_READY_FOR_MERGE" }, governance: "GitHub token scoped." }
    ]
  },

  // 6. SUPPLY CHAIN & PROCUREMENT
  {
    id: "wf-supply-procurement",
    category: "Procurement & Logistics",
    name: "Autonomous Global Procurement & Hardware Logistics Lead",
    role: "Supply Chain & Hardware",
    model: "Anthropic Claude 3.5 Sonnet",
    dailyVolume: "$2M Weekly Orders",
    spendCeilingUsd: 100000,
    badge: "Supply Chain",
    badgeColor: "bg-teal-500/20 text-teal-300 border-teal-500/40",
    description: "Monitors global semiconductor & server component stock -> negotiates volume purchase orders -> coordinates freight tracking -> executes vendor purchase approvals.",
    pipelineSteps: [
      { step: 1, title: "Inventory Level & Lead-Time Audit", tool: "query_database", params: { sku: "NVIDIA_H100_SXM5", stockThreshold: "CRITICAL_LOW", leadTimeDays: 14 }, governance: "Stock shortage flagged." },
      { step: 2, title: "Generate Multi-Vendor RFP", tool: "generate_contract_artifact", params: { unitsNeeded: 64, targetUnitCost: 28500 }, governance: "Pricing cap verified." },
      { step: 3, title: "A2A Delegation to Logistics Mesh", tool: "a2a_delegate_task", params: { delegatee: "TSMC-Supply-Logistics", action: "reserve_wafer_allocation", units: 64 }, governance: "Cross-enterprise A2A trust handshake verified." },
      { step: 4, title: "Dispatch Purchase Order Approval", tool: "send_notification", params: { channel: "slack-hardware-procurement" }, governance: "PO committed." }
    ]
  }
];
