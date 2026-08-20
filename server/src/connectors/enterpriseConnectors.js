export class EnterpriseConnectorRegistry {
  constructor(runtime, broadcastEvent = () => {}) {
    this.runtime = runtime;
    this.broadcastEvent = broadcastEvent;

    this.connectors = [
      {
        id: "conn-salesforce-agentforce",
        name: "Salesforce Agentforce (Atlas Engine)",
        category: "CRM & Customer Service",
        deploymentType: "Zero-Code Named Credential / External Service",
        status: "CONNECTED",
        activeAgentsCount: 4,
        description: "Intercepts autonomous Atlas reasoning actions before mutating Salesforce CRM, Service Cloud, or billing records.",
        setupGuide: {
          step1: "In Salesforce Setup -> Named Credentials, create 'Synapse_Gateway' pointing to https://api.synapseguard.io/v1/intercept",
          step2: "Attach Synapse_Gateway as the HTTP Callout proxy in Agentforce Action Flows",
          step3: "Synapse enforces spend ceilings and registers automatic compensating rollback flows."
        },
        samplePayload: {
          agentId: "Agentforce-Billing-Bot",
          toolName: "update_salesforce_account",
          parameters: { accountId: "0015g00000XyZ1", newDiscountPercent: 40, creditLimitAdjustment: 25000 }
        }
      },
      {
        id: "conn-servicenow-nowassist",
        name: "ServiceNow AI Agents (Now Assist)",
        category: "ITSM, SecOps & Enterprise HR",
        deploymentType: "IntegrationHub REST Flow Hook",
        status: "CONNECTED",
        activeAgentsCount: 2,
        description: "Monitors and governs IT incident auto-remediation, employee offboarding, and enterprise permission grants.",
        setupGuide: {
          step1: "In ServiceNow Flow Designer -> Action Generator, route action triggers via Synapse MidServer / REST Hook",
          step2: "Synapse verifies trajectory sequence invariants before ServiceNow executes automated IT script executions",
          step3: "Zero-destruction filters block unauthorized group permission escalations."
        },
        samplePayload: {
          agentId: "NowAssist-ITSM-AutoFix",
          toolName: "execute_remediation_script",
          parameters: { ticketId: "INC09921", script: "restart_k8s_service", targetCluster: "prod-us-central" }
        }
      },
      {
        id: "conn-amazon-bedrock",
        name: "Amazon Bedrock Agents (AWS AgentCore)",
        category: "Cloud Infrastructure & Bedrock LLMs",
        deploymentType: "AWS Lambda Action Group Layer",
        status: "CONNECTED",
        activeAgentsCount: 6,
        description: "Wraps Bedrock Action Groups in a low-latency Lambda governance layer for full trajectory validation.",
        setupGuide: {
          step1: "Attach the Synapse Lambda Layer (arn:aws:lambda:us-east-1:synapse:layer:guard-v1) to your Action Group Handler",
          step2: "Wrap handler with @synapse.bedrock_protect(spend_limit=1000)",
          step3: "Bedrock agents get automatic shadow simulation and state rollback."
        },
        samplePayload: {
          agentId: "Bedrock-S3-Archival-Worker",
          toolName: "modify_s3_lifecycle",
          parameters: { bucketName: "enterprise-audit-logs", newRetentionDays: 30 }
        }
      },
      {
        id: "conn-langgraph-crewai",
        name: "LangGraph & CrewAI Enterprise",
        category: "Stateful Agent Graphs & Multi-Agent Swarms",
        deploymentType: "Python Checkpointer Class",
        status: "ACTIVE",
        activeAgentsCount: 12,
        description: "Seamlessly intercepts cyclical graph edges, multi-agent messages, and registers inverse states on every node.",
        setupGuide: {
          step1: "pip install synapse-guard",
          step2: "from synapse_guard.langgraph import SynapseGraphSaver; app = workflow.compile(checkpointer=SynapseGraphSaver())",
          step3: "Every node in your state graph is recorded into the time-travel DAG."
        },
        samplePayload: {
          agentId: "LangGraph-Research-Pipeline",
          toolName: "synthesize_code_artifact",
          parameters: { repo: "enterprise-monorepo", branch: "feat/ai-autofix" }
        }
      },
      {
        id: "conn-microsoft-copilot",
        name: "Microsoft Copilot Studio & Azure AI Agent Service",
        category: "Office 365, Power Platform & Azure",
        deploymentType: "Custom Connector Gateway",
        status: "STANDBY",
        activeAgentsCount: 3,
        description: "Governs Copilot plugins accessing SharePoint, Dynamics 365, and Power Automate workflows.",
        setupGuide: {
          step1: "Import Synapse OpenAPI Swagger specification into Power Platform Custom Connectors",
          step2: "Wrap Power Automate execution flows with Synapse approval gates",
          step3: "Enforces PII redaction and trajectory safety across tenant data."
        },
        samplePayload: {
          agentId: "Copilot-SharePoint-Crawler",
          toolName: "query_confidential_docs",
          parameters: { query: "Executive Compensation 2026", department: "HR" }
        }
      }
    ];
  }

  getConnectors() {
    return this.connectors;
  }

  async testConnectorAction(connectorId, payload) {
    const connector = this.connectors.find(c => c.id === connectorId);
    if (!connector) throw new Error("Connector not found");

    const decision = await this.runtime.interceptAction({
      agentId: payload.agentId || connector.name,
      toolName: payload.toolName,
      parameters: payload.parameters,
      enableShadow: true
    });

    this.broadcastEvent({
      type: "ENTERPRISE_CONNECTOR_EVENT",
      data: { connectorId, connectorName: connector.name, decision }
    });

    return { connector: connector.name, decision };
  }
}
