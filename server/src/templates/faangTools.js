export const FAANG_ENTERPRISE_TOOL_REGISTRY = [
  // 1. CLOUD INFRASTRUCTURE & MULTI-REGION SRE (AWS, GCP, K8S)
  {
    category: "Cloud Infrastructure & SRE (AWS / GCP / K8s)",
    tools: [
      {
        id: "aws_s3_worm_audit",
        name: "AWS S3 / CloudTrail Security Auditor",
        provider: "Amazon Web Services (IAM & S3)",
        description: "Audits S3 bucket ACLs, KMS encryption keys, and enforces WORM (Write Once Read Many) compliance policies.",
        defaultParams: '{"region": "us-east-1", "bucket": "enterprise-compliance-vault", "enforceKms": true}'
      },
      {
        id: "k8s_cluster_drain_restart",
        name: "Kubernetes Zero-Downtime Pod Auto-Healer",
        provider: "Kubernetes (K8s API / Istio Mesh)",
        description: "Drains degraded cluster nodes, checks memory leaks, reroutes live traffic via Istio, and triggers zero-downtime rolling restarts.",
        defaultParams: '{"cluster": "prod-us-east-1", "namespace": "payments-core", "maxSurge": "25%", "healthCheckPath": "/healthz"}'
      },
      {
        id: "gcp_bigquery_analytics",
        name: "Google Cloud BigQuery High-Volume Pipeline",
        provider: "Google Cloud Platform (BigQuery)",
        description: "Executes partitioned analytical SQL queries across petabyte-scale data lakes with automatic slot reservation.",
        defaultParams: '{"dataset": "telemetry_analytics_q3", "partitionBy": "timestamp", "maxBilledBytes": 10737418240}'
      },
      {
        id: "aws_lambda_async_dispatch",
        name: "AWS Lambda / EventBridge Microservice Dispatcher",
        provider: "AWS Serverless (EventBridge)",
        description: "Dispatches high-throughput asynchronous events to AWS Lambda microservices with dead-letter queue (DLQ) fallback.",
        defaultParams: '{"eventBus": "enterprise-event-bus", "detailType": "ORDER_RECONCILED", "retryLimit": 3}'
      }
    ]
  },

  // 2. ENTERPRISE CRM, ERP & REVENUE OPS (SALESFORCE, SAP, WORKDAY)
  {
    category: "Enterprise CRM, ERP & Finance (Salesforce / SAP / Stripe)",
    tools: [
      {
        id: "salesforce_enterprise_sync",
        name: "Salesforce CRM Enterprise Account Synchronizer",
        provider: "Salesforce Agentforce / Apex REST",
        description: "Mutates Opportunities, Quotes, and Custom Objects with automated deduplication and stage progression.",
        defaultParams: '{"object": "Opportunity", "fields": {"StageName": "Contracting", "Amount": 150000}, "discountCap": 20}'
      },
      {
        id: "sap_erp_ledger_reconcile",
        name: "SAP S/4HANA Corporate General Ledger",
        provider: "SAP ERP S/4HANA",
        description: "Reconciles multi-company financial postings, verifies VAT compliance, and commits journal entries.",
        defaultParams: '{"companyCode": "1000", "ledger": "0L", "postingKey": "40", "currency": "USD"}'
      },
      {
        id: "stripe_treasury_payout",
        name: "Stripe Corporate Treasury & Global Wire Payout",
        provider: "Stripe Treasury API",
        description: "Executes multi-currency payouts, merchant payouts, and automated chargebacks with dual-authorization verification.",
        defaultParams: '{"payoutType": "ACH_SAME_DAY", "amountUsd": 25000.00, "destination": "bank_account_primary"}'
      }
    ]
  },

  // 3. CYBERSECURITY, SECRETS & ZERO-TRUST IAM (OKTA, HASHICORP, DATADOG)
  {
    category: "Cybersecurity, IAM & Observability (Okta / Vault / Datadog)",
    tools: [
      {
        id: "okta_zero_trust_provision",
        name: "Okta Enterprise Zero-Trust Identity Manager",
        provider: "Okta Identity Cloud",
        description: "Provisions least-privilege SCIM user groups, enforces hardware 2FA policies, and revokes compromised sessions.",
        defaultParams: '{"group": "engineering-prod-readonly", "enforceMfa": "WEBAUTHN_FIDO2", "sessionTtlMinutes": 60}'
      },
      {
        id: "hashicorp_vault_token_rotation",
        name: "HashiCorp Vault Dynamic Secret Injector",
        provider: "HashiCorp Vault",
        description: "Generates on-demand 15-minute dynamic database credentials and rotates KMS master keys.",
        defaultParams: '{"vaultPath": "database/creds/billing-readonly", "ttl": "15m", "leaseRenewable": false}'
      },
      {
        id: "datadog_pagerduty_sentry_alert",
        name: "Datadog / PagerDuty Incident Dispatcher",
        provider: "Datadog & PagerDuty High-Sev API",
        description: "Triggers targeted on-call escalations, records distributed APM trace IDs, and opens Jira Service Management tickets.",
        defaultParams: '{"severity": "SEV-1", "service": "payments-gateway", "pagerSchedule": "security-primary-oncall"}'
      }
    ]
  },

  // 4. SOFTWARE ENGINEERING & GITHUB ACTIONS (GITHUB, SONARQUBE)
  {
    category: "Software Engineering & CI/CD (GitHub / SonarQube)",
    tools: [
      {
        id: "github_pull_request_patch",
        name: "GitHub Monorepo PR Synthesizer & Auto-Merge",
        provider: "GitHub Enterprise API",
        description: "Creates pull requests, applies verified security AST patches, runs automated test suites, and enforces branch protection rules.",
        defaultParams: '{"repository": "enterprise/monorepo", "branch": "patch-auth-fix", "enforcePassingChecks": true}'
      },
      {
        id: "sonarqube_security_sast_scan",
        name: "SonarQube Enterprise SAST & AST Scanner",
        provider: "SonarQube Enterprise",
        description: "Performs static application security testing (SAST), detects race conditions, memory leaks, and OWASP Top 10 vulnerabilities.",
        defaultParams: '{"qualityGate": "FAANG_STRICT", "blockOnNewVulnerabilities": true}'
      }
    ]
  },

  // 5. COMMUNICATIONS & INCIDENT MANAGEMENT (SLACK, TEAMS, SERVICENOW)
  {
    category: "Enterprise Messaging & Ticketing (Slack / ServiceNow)",
    tools: [
      {
        id: "slack_enterprise_block_kit",
        name: "Slack Enterprise Block-Kit Interactive Notifier",
        provider: "Slack Enterprise Grid",
        description: "Posts rich interactive Block-Kit approval cards with inline 2FA button responses directly into secured channels.",
        defaultParams: '{"channel": "#secops-approvals", "allowInline2Fa": true, "redactPii": true}'
      },
      {
        id: "servicenow_itsm_ticket_lifecycle",
        name: "ServiceNow ITSM Enterprise Change Request",
        provider: "ServiceNow ITSM",
        description: "Creates ITIL-compliant Change Requests (CRs) and Incident records linked to enterprise CMDB assets.",
        defaultParams: '{"assignmentGroup": "Cloud-Infrastructure-CAB", "impact": "2-High", "urgency": "2-High"}'
      }
    ]
  }
];
