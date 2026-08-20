import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";

import { EXPANDED_ENTERPRISE_ROLES } from "../templates/expandedRoles.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_FILE = path.resolve(__dirname, "../../data/synapse_production.db");

export class ProductionDatabase {
  constructor() {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    this.db = new Database(DB_FILE);
    this.db.pragma("foreign_keys = ON");
    this.db.pragma("journal_mode = WAL");
    this._createTables();
    this._seedDefaultRolesIfEmpty();
  }

  _seedDefaultRolesIfEmpty() {
    try {
      const count = this.db.prepare("SELECT count(*) as cnt FROM agents").get().cnt;
      if (count < 9) {
        for (const role of EXPANDED_ENTERPRISE_ROLES) {
          this.insertAgent({
            id: role.id,
            name: role.name,
            provider: role.model,
            department: role.category,
            owner: "admin@enterprise.com",
            status: "ACTIVE",
            securityScore: 92,
            spendCeilingUsd: role.spendCeilingUsd,
            requiresHitlAboveUsd: 300.0,
            systemPrompt: `Operate autonomously as ${role.role} under Synapse OPA Rego governance.`
          });
        }
      }
    } catch (e) {
      console.error("Auto-seed error:", e);
    }
  }

  _createTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        provider TEXT NOT NULL,
        department TEXT NOT NULL,
        owner TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'ACTIVE',
        security_score INTEGER DEFAULT 85,
        spend_ceiling_usd REAL DEFAULT 500.0,
        requires_hitl_above_usd REAL DEFAULT 300.0,
        system_prompt TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL,
        goal TEXT NOT NULL,
        status TEXT NOT NULL,
        started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        ephemeral_token_id TEXT,
        rollback_reason TEXT,
        reverted_steps INTEGER DEFAULT 0,
        FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS transaction_steps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transaction_id TEXT NOT NULL,
        step_number INTEGER NOT NULL,
        tool_name TEXT NOT NULL,
        parameters_json TEXT NOT NULL,
        inverse_tool TEXT,
        inverse_params_json TEXT,
        status TEXT NOT NULL,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS audit_ledger (
        block_index INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        agent_id TEXT NOT NULL,
        tool_name TEXT NOT NULL,
        verdict TEXT NOT NULL,
        reason TEXT NOT NULL,
        risk_score INTEGER NOT NULL,
        prev_hash TEXT NOT NULL,
        block_hash TEXT NOT NULL UNIQUE
      );

      CREATE TABLE IF NOT EXISTS approvals (
        approval_id TEXT PRIMARY KEY,
        transaction_id TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        agent_name TEXT NOT NULL,
        tool_name TEXT NOT NULL,
        parameters_json TEXT NOT NULL,
        reason TEXT NOT NULL,
        risk_score INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        decided_at DATETIME,
        decided_by TEXT,
        FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS incidents (
        incident_id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL,
        agent_name TEXT NOT NULL,
        trigger_type TEXT NOT NULL,
        severity TEXT NOT NULL,
        reason TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'TRIGGERED_STATE_FROZEN',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        transaction_id TEXT,
        runbook_json TEXT NOT NULL,
        resolved_action TEXT,
        resolved_by TEXT,
        resolved_at DATETIME
      );

      -- 7. Google A2A Cross-Agent Delegation Ledger Table
      CREATE TABLE IF NOT EXISTS a2a_delegations (
        delegation_id TEXT PRIMARY KEY,
        delegator_id TEXT NOT NULL,
        delegator_name TEXT NOT NULL,
        delegatee_id TEXT NOT NULL,
        delegatee_name TEXT NOT NULL,
        directive TEXT NOT NULL,
        token TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        status TEXT NOT NULL,
        governance_verdict TEXT NOT NULL,
        governance_reason TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- 8. Visual Multi-Stage Pipeline Storage & Revisions
      CREATE TABLE IF NOT EXISTS pipelines (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        domain TEXT NOT NULL,
        cli_engine TEXT NOT NULL,
        model TEXT NOT NULL,
        spend_ceiling_usd REAL DEFAULT 5000.0,
        hitl_threshold_usd REAL DEFAULT 1000.0,
        cron_interval INTEGER DEFAULT 10,
        system_prompt TEXT,
        nodes_json TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'COMMITTED',
        revision_count INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS pipeline_revisions (
        revision_id TEXT PRIMARY KEY,
        pipeline_id TEXT NOT NULL,
        revision_number INTEGER NOT NULL,
        snapshot_json TEXT NOT NULL,
        commit_reason TEXT,
        committed_by TEXT DEFAULT 'Architect CLI / MCP',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pipeline_id) REFERENCES pipelines(id) ON DELETE CASCADE
      );
    `);
  }

  // --- Agents ---
  getAgents() {
    return this.db.prepare("SELECT * FROM agents ORDER BY created_at DESC").all().map(a => ({
      id: a.id,
      name: a.name,
      provider: a.provider,
      department: a.department,
      owner: a.owner,
      status: a.status,
      securityScore: a.security_score,
      spendCeilingUsd: a.spend_ceiling_usd,
      requiresHitlAboveUsd: a.requires_hitl_above_usd,
      systemPrompt: a.system_prompt
    }));
  }

  insertAgent(agent) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO agents (id, name, provider, department, owner, status, security_score, spend_ceiling_usd, requires_hitl_above_usd, system_prompt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      agent.id,
      agent.name,
      agent.provider,
      agent.department,
      agent.owner,
      agent.status || "ACTIVE",
      agent.securityScore || 85,
      agent.spendCeilingUsd || 500.0,
      agent.requiresHitlAboveUsd || 300.0,
      agent.systemPrompt || ""
    );
    return agent;
  }

  toggleAgentStatus(id) {
    const agent = this.db.prepare("SELECT * FROM agents WHERE id = ?").get(id);
    if (!agent) return null;
    const newStatus = agent.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
    this.db.prepare("UPDATE agents SET status = ? WHERE id = ?").run(newStatus, id);
    return { ...agent, status: newStatus };
  }

  // --- Transactions ---
  getTransactions() {
    const txRows = this.db.prepare("SELECT * FROM transactions ORDER BY started_at DESC LIMIT 50").all();
    const getStepsStmt = this.db.prepare("SELECT * FROM transaction_steps WHERE transaction_id = ? ORDER BY step_number ASC");

    return txRows.map(t => {
      const steps = getStepsStmt.all(t.id).map(s => ({
        step: s.step_number,
        tool: s.tool_name,
        params: JSON.parse(s.parameters_json),
        inverse: s.inverse_tool,
        status: s.status
      }));

      return {
        id: t.id,
        agentId: t.agent_id,
        goal: t.goal,
        status: t.status,
        startedAt: t.started_at,
        ephemeralTokenId: t.ephemeral_token_id,
        steps,
        rollbackLog: t.rollback_reason ? {
          reason: t.rollback_reason,
          revertedSteps: t.reverted_steps
        } : null
      };
    });
  }

  insertTransaction(tx) {
    const stmt = this.db.prepare(`
      INSERT INTO transactions (id, agent_id, goal, status, started_at, ephemeral_token_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(tx.id, tx.agentId, tx.goal, tx.status, tx.startedAt, tx.ephemeralTokenId);
  }

  updateTransactionStatus(id, status, rollbackReason = null, revertedSteps = 0) {
    const stmt = this.db.prepare(`
      UPDATE transactions
      SET status = ?, rollback_reason = ?, reverted_steps = ?, completed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(status, rollbackReason, revertedSteps, id);
  }

  insertTransactionStep(txId, stepNumber, toolName, params, inverseTool, inverseParams, status) {
    const stmt = this.db.prepare(`
      INSERT INTO transaction_steps (transaction_id, step_number, tool_name, parameters_json, inverse_tool, inverse_params_json, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(txId, stepNumber, toolName, JSON.stringify(params), inverseTool, JSON.stringify(inverseParams), status);
  }

  // --- Audit Ledger ---
  getAuditLedger() {
    return this.db.prepare("SELECT * FROM audit_ledger ORDER BY block_index DESC LIMIT 50").all().map(b => ({
      index: b.block_index,
      timestamp: b.timestamp,
      agentId: b.agent_id,
      toolName: b.tool_name,
      verdict: b.verdict,
      reason: b.reason,
      riskScore: b.risk_score,
      prevHash: b.prev_hash,
      hash: b.block_hash
    }));
  }

  appendAuditBlock(agentId, toolName, verdict, reason, riskScore) {
    const lastBlock = this.db.prepare("SELECT block_hash FROM audit_ledger ORDER BY block_index DESC LIMIT 1").get();
    const prevHash = lastBlock ? lastBlock.block_hash : "0".repeat(64);

    const payload = { timestamp: new Date().toISOString(), agentId, toolName, verdict, reason, riskScore, prevHash };
    const blockHash = crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");

    const stmt = this.db.prepare(`
      INSERT INTO audit_ledger (agent_id, tool_name, verdict, reason, risk_score, prev_hash, block_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(agentId, toolName, verdict, reason, riskScore, prevHash, blockHash);
    return { ...payload, hash: blockHash };
  }

  // --- Approvals ---
  getApprovals() {
    return this.db.prepare("SELECT * FROM approvals ORDER BY created_at DESC LIMIT 50").all().map(a => ({
      approvalId: a.approval_id,
      txId: a.transaction_id,
      agentId: a.agent_id,
      agentName: a.agent_name,
      toolName: a.tool_name,
      parameters: JSON.parse(a.parameters_json),
      reason: a.reason,
      riskScore: a.risk_score,
      status: a.status,
      createdAt: a.created_at,
      decidedAt: a.decided_at,
      decidedBy: a.decided_by
    }));
  }

  insertApproval(approval) {
    const stmt = this.db.prepare(`
      INSERT INTO approvals (approval_id, transaction_id, agent_id, agent_name, tool_name, parameters_json, reason, risk_score, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      approval.approvalId,
      approval.txId,
      approval.agentId,
      approval.agentName,
      approval.toolName,
      JSON.stringify(approval.parameters),
      approval.reason,
      approval.riskScore,
      approval.status || "PENDING",
      approval.createdAt || new Date().toISOString()
    );
  }

  resolveApproval(approvalId, decision, user) {
    this.db.prepare(`
      UPDATE approvals
      SET status = ?, decided_by = ?, decided_at = CURRENT_TIMESTAMP
      WHERE approval_id = ?
    `).run(decision, user, approvalId);
    return this.db.prepare("SELECT * FROM approvals WHERE approval_id = ?").get(approvalId);
  }

  // --- Incidents ---
  getIncidents() {
    return this.db.prepare("SELECT * FROM incidents ORDER BY created_at DESC LIMIT 50").all().map(i => ({
      incidentId: i.incident_id,
      agentId: i.agent_id,
      agentName: i.agent_name,
      triggerType: i.trigger_type,
      severity: i.severity,
      reason: i.reason,
      status: i.status,
      createdAt: i.created_at,
      txId: i.transaction_id,
      runbookExecution: JSON.parse(i.runbook_json),
      resolution: i.resolved_action ? {
        action: i.resolved_action,
        resolvedBy: i.resolved_by,
        resolvedAt: i.resolved_at
      } : null
    }));
  }

  insertIncident(incident) {
    const stmt = this.db.prepare(`
      INSERT INTO incidents (incident_id, agent_id, agent_name, trigger_type, severity, reason, status, created_at, transaction_id, runbook_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      incident.incidentId,
      incident.agentId,
      incident.agentName,
      incident.triggerType,
      incident.severity,
      incident.reason,
      incident.status || "TRIGGERED_STATE_FROZEN",
      incident.createdAt || new Date().toISOString(),
      incident.txId,
      JSON.stringify(incident.runbookExecution)
    );
  }

  resolveIncident(incidentId, action, notes, resolvedBy) {
    this.db.prepare(`
      UPDATE incidents
      SET status = ?, resolved_action = ?, resolved_by = ?, resolved_at = CURRENT_TIMESTAMP
      WHERE incident_id = ?
    `).run(action === "SAFE_RESUME" ? "RESOLVED_SAFE_RESUME" : "PERMANENT_TERMINATED", action, resolvedBy, incidentId);
    return this.db.prepare("SELECT * FROM incidents WHERE incident_id = ?").get(incidentId);
  }

  // --- A2A Delegations ---
  getA2ADelegations() {
    return this.db.prepare("SELECT * FROM a2a_delegations ORDER BY created_at DESC LIMIT 50").all().map(d => ({
      delegationId: d.delegation_id,
      delegatorId: d.delegator_id,
      delegatorName: d.delegator_name,
      delegateeId: d.delegatee_id,
      delegateeName: d.delegatee_name,
      directive: d.directive,
      token: d.token,
      payload: JSON.parse(d.payload_json),
      status: d.status,
      governanceVerdict: d.governance_verdict,
      governanceReason: d.governance_reason,
      createdAt: d.created_at
    }));
  }

  insertA2ADelegation(record) {
    const stmt = this.db.prepare(`
      INSERT INTO a2a_delegations (delegation_id, delegator_id, delegator_name, delegatee_id, delegatee_name, directive, token, payload_json, status, governance_verdict, governance_reason, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      record.delegationId,
      record.delegatorId,
      record.delegatorName,
      record.delegateeId,
      record.delegateeName,
      record.directive,
      record.token,
      JSON.stringify(record.payload || {}),
      record.status,
      record.governanceVerdict,
      record.governanceReason,
      record.timestamp || new Date().toISOString()
    );
  }

  // --- Visual Pipelines & Revisions ---
  getPipelines() {
    try {
      const rows = this.db.prepare("SELECT * FROM pipelines ORDER BY updated_at DESC").all();
      return rows.map(r => ({
        id: r.id,
        name: r.name,
        domain: r.domain,
        cliEngine: r.cli_engine,
        model: r.model,
        spendCeilingUsd: r.spend_ceiling_usd,
        hitlThresholdUsd: r.hitl_threshold_usd,
        cronInterval: r.cron_interval,
        systemPrompt: r.system_prompt,
        nodes: JSON.parse(r.nodes_json || "[]"),
        status: r.status,
        revisionCount: r.revision_count,
        createdAt: r.created_at,
        updatedAt: r.updated_at
      }));
    } catch (e) {
      return [];
    }
  }

  getPipeline(id) {
    try {
      const r = this.db.prepare("SELECT * FROM pipelines WHERE id = ?").get(id);
      if (!r) return null;
      return {
        id: r.id,
        name: r.name,
        domain: r.domain,
        cliEngine: r.cli_engine,
        model: r.model,
        spendCeilingUsd: r.spend_ceiling_usd,
        hitlThresholdUsd: r.hitl_threshold_usd,
        cronInterval: r.cron_interval,
        systemPrompt: r.system_prompt,
        nodes: JSON.parse(r.nodes_json || "[]"),
        status: r.status,
        revisionCount: r.revision_count,
        createdAt: r.created_at,
        updatedAt: r.updated_at
      };
    } catch (e) {
      return null;
    }
  }

  insertPipeline(pipeline) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO pipelines (id, name, domain, cli_engine, model, spend_ceiling_usd, hitl_threshold_usd, cron_interval, system_prompt, nodes_json, status, revision_count, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    stmt.run(
      pipeline.id,
      pipeline.name,
      pipeline.domain || "Enterprise Automation",
      pipeline.cliEngine || "Aider",
      pipeline.model || "deepseek-r1:70b",
      pipeline.spendCeilingUsd || 5000.0,
      pipeline.hitlThresholdUsd || 1000.0,
      pipeline.cronInterval || 10,
      pipeline.systemPrompt || "",
      JSON.stringify(pipeline.nodes || []),
      pipeline.status || "COMMITTED",
      pipeline.revisionCount || 1
    );
    return pipeline;
  }

  deletePipeline(id) {
    this.db.prepare("DELETE FROM pipelines WHERE id = ?").run(id);
    return { success: true, id };
  }

  insertPipelineRevision(pipelineId, snapshot, reason = "Committed via Architect CLI / UI", committedBy = "Architect CLI") {
    const revId = "rev_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
    const countRow = this.db.prepare("SELECT count(*) as cnt FROM pipeline_revisions WHERE pipeline_id = ?").get(pipelineId);
    const revNumber = (countRow?.cnt || 0) + 1;

    const stmt = this.db.prepare(`
      INSERT INTO pipeline_revisions (revision_id, pipeline_id, revision_number, snapshot_json, commit_reason, committed_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(revId, pipelineId, revNumber, JSON.stringify(snapshot), reason, committedBy);

    // Update revision_count in pipelines table
    this.db.prepare("UPDATE pipelines SET revision_count = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(revNumber, pipelineId);

    return { revisionId: revId, revisionNumber: revNumber };
  }

  getPipelineRevisions(pipelineId) {
    try {
      const rows = this.db.prepare("SELECT * FROM pipeline_revisions WHERE pipeline_id = ? ORDER BY revision_number DESC").all(pipelineId);
      return rows.map(r => ({
        revisionId: r.revision_id,
        pipelineId: r.pipeline_id,
        revisionNumber: r.revision_number,
        snapshot: JSON.parse(r.snapshot_json),
        commitReason: r.commit_reason,
        committedBy: r.committed_by,
        createdAt: r.created_at
      }));
    } catch (e) {
      return [];
    }
  }
}

export const productionDb = new ProductionDatabase();
