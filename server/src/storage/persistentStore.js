import fs from "fs";
import path from "path";
import crypto from "crypto";

const DATA_DIR = path.resolve(process.cwd(), "data");

export class PersistentStore {
  constructor() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    this.agentsFile = path.join(DATA_DIR, "agents.json");
    this.txFile = path.join(DATA_DIR, "transactions.json");
    this.auditFile = path.join(DATA_DIR, "audit_ledger.json");
    this.approvalsFile = path.join(DATA_DIR, "approvals.json");
    this.incidentsFile = path.join(DATA_DIR, "incidents.json");
    this.policiesFile = path.join(DATA_DIR, "rego_policies.json");

    this._initDefaultData();
  }

  _read(filePath, defaultVal = []) {
    try {
      if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, "utf-8"));
      }
    } catch (e) {
      console.error(`Read error on ${filePath}:`, e.message);
    }
    return defaultVal;
  }

  _write(filePath, data) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
      console.error(`Write error on ${filePath}:`, e.message);
    }
  }

  _initDefaultData() {
    if (!fs.existsSync(this.agentsFile)) {
      const defaultAgents = [
        {
          id: "agt-claude-finance",
          name: "Financial Treasury & Billing Worker",
          provider: "Anthropic Claude 3.5 Sonnet",
          department: "Finance & Accounting",
          owner: "cfo-ops@enterprise.com",
          status: "ACTIVE",
          securityScore: 88,
          spendCeilingUsd: 500,
          requiresHitlAboveUsd: 300,
          allowedTools: ["query_database", "issue_refund", "send_notification"],
          systemPrompt: "You are an autonomous treasury reconciler. Verify invoice balances before issuing refunds.",
          tasksCount: 142,
          lastAudit: "Today, 10:30 AM"
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
          requiresHitlAboveUsd: 1000,
          allowedTools: ["manage_cloud_resources", "query_database", "send_notification"],
          systemPrompt: "You are an autonomous SRE agent. Continuously monitor node health and execute remediation.",
          tasksCount: 389,
          lastAudit: "Today, 11:15 AM"
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
          requiresHitlAboveUsd: 150,
          allowedTools: ["query_database", "send_notification"],
          systemPrompt: "You are a customer support agent. Resolve queries while redacting PII.",
          tasksCount: 1204,
          lastAudit: "Today, 09:00 AM"
        }
      ];
      this._write(this.agentsFile, defaultAgents);
    }
  }

  getAgents() { return this._read(this.agentsFile); }
  saveAgents(agents) { this._write(this.agentsFile, agents); }

  getTransactions() { return this._read(this.txFile); }
  saveTransactions(txs) { this._write(this.txFile, txs); }

  getAuditLedger() { return this._read(this.auditFile); }
  saveAuditLedger(ledger) { this._write(this.auditFile, ledger); }

  getApprovals() { return this._read(this.approvalsFile); }
  saveApprovals(approvals) { this._write(this.approvalsFile, approvals); }

  getIncidents() { return this._read(this.incidentsFile); }
  saveIncidents(incidents) { this._write(this.incidentsFile, incidents); }

  getPolicies() { return this._read(this.policiesFile); }
  savePolicies(policies) { this._write(this.policiesFile, policies); }
}

export const persistentStore = new PersistentStore();
