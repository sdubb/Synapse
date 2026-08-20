import { persistentStore } from "./persistentStore.js";
import crypto from "crypto";

export function seedFullEnterpriseDemoData() {
  // 1. Seed Rich Approvals
  const existingApprovals = persistentStore.getApprovals();
  if (existingApprovals.length === 0) {
    const demoApprovals = [
      {
        approvalId: "appr_9921fa",
        txId: "tx_fec02771",
        agentId: "agt-claude-finance",
        agentName: "Financial Treasury & Billing Worker",
        toolName: "issue_refund",
        parameters: { customerId: "usr_101", orderId: "ord_501", amount: 350.00, currency: "USD", reason: "Customer Loyalty Retention Bonus" },
        reason: "APPROVAL REQUIRED [rego-spend-boundary]: Amount ($350.00) exceeds autonomous threshold ($300.00). Held for On-Call SecOps Approval.",
        riskScore: 55,
        status: "PENDING",
        createdAt: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
        decidedAt: null,
        decidedBy: null
      },
      {
        approvalId: "appr_8812bb",
        txId: "tx_abc8921",
        agentId: "agt-salesforce-crm",
        agentName: "Salesforce Agentforce Support Bot",
        toolName: "update_salesforce_account",
        parameters: { accountId: "0015g00000XyZ1", discountPercentage: 40, creditLimitAdjustment: 15000 },
        reason: "APPROVAL REQUIRED [rego-spend-boundary]: Credit adjustment $15,000 exceeds standard CRM agent tier limit.",
        riskScore: 65,
        status: "APPROVED",
        createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        decidedAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
        decidedBy: "vp-sales@enterprise.com"
      }
    ];
    persistentStore.saveApprovals(demoApprovals);
  }

  // 2. Seed Rich Incidents
  const existingIncidents = persistentStore.getIncidents();
  if (existingIncidents.length === 0) {
    const demoIncidents = [
      {
        incidentId: "INC-88A92F",
        agentId: "agt-claude-finance",
        agentName: "Financial Treasury & Billing Worker",
        triggerType: "SPEND_BREACH",
        severity: "SEV-1",
        reason: "Rogue multi-step loop attempted unauthorized $6,400.00 refund without 2FA.",
        status: "TRIGGERED_STATE_FROZEN",
        createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
        txId: "tx_5b7ef5ee",
        runbookExecution: {
          step1_process_quarantine: "Container SIGSTOP issued. Ephemeral JWT revoked in Secrets Gateway.",
          step2_dag_compensation: "Rollback DAG initiated on uncommitted forward mutations.",
          step3_pagerduty_paged: "PagerDuty on-call security engineer paged (Incident INC-88A92F).",
          step4_servicenow_sync: "ServiceNow incident created under Enterprise SecOps queue."
        },
        resolution: null
      },
      {
        incidentId: "INC-33B10C",
        agentId: "agt-antigravity-sre",
        agentName: "Antigravity Autonomous Cloud SRE",
        triggerType: "EMERGENCY_KILL_SWITCH",
        severity: "SEV-2",
        reason: "Manual safety freeze triggered during production database schema migration.",
        status: "RESOLVED_SAFE_RESUME",
        createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        txId: "tx_node_migrate_01",
        runbookExecution: {
          step1_process_quarantine: "Container SIGSTOP issued. Ephemeral JWT revoked.",
          step2_dag_compensation: "Rollback DAG compensated 2 forward migration steps.",
          step3_pagerduty_paged: "Incident triaged with SRE on-call team.",
          step4_servicenow_sync: "Audit ticket updated to CLOSED."
        },
        resolution: {
          action: "SAFE_RESUME",
          notes: "Database snapshot validated by Lead DBA. Container unpaused.",
          resolvedBy: "dba-lead@enterprise.com",
          resolvedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString()
        }
      }
    ];
    persistentStore.saveIncidents(demoIncidents);
  }

  // 3. Seed Rich Transactions DAG
  const existingTx = persistentStore.getTransactions();
  if (existingTx.length === 0) {
    const demoTx = [
      {
        id: "tx_fec02771",
        agentId: "agt-claude-finance",
        agentName: "Financial Treasury & Billing Worker",
        goal: "Investigate customer Sarah Connor account and issue an authorized $150.00 refund credit for order ord_501",
        status: "COMMITTED",
        startedAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
        ephemeralTokenId: "syn_eph_99210018fba92101",
        steps: [
          {
            step: 1,
            tool: "query_database",
            params: { table: "customers", filter: { id: "usr_101" } },
            inverse: "no_op",
            status: "COMPLETED",
            output: { customer: { id: "usr_101", name: "Sarah Connor", balance: 450.0 }, order: { id: "ord_501", amount: 150.0 } }
          },
          {
            step: 2,
            tool: "issue_refund",
            params: { customerId: "usr_101", orderId: "ord_501", amount: 150.0 },
            inverse: { inverseTool: "cancel_refund", inverseParams: { refundId: "ref_ee41fd", amount: 150.0 } },
            status: "COMPLETED",
            output: { refundId: "ref_ee41fd", amountRefunded: 150.0, status: "COMPLETED_IN_VPC", customerBalanceAfter: 600.0 }
          },
          {
            step: 3,
            tool: "send_notification",
            params: { recipient: "sarah@cyberdyne.io", subject: "Refund Confirmed: $150.00 credited" },
            inverse: "send_correction_notice",
            status: "COMPLETED",
            output: { delivered: true, messageId: "msg_9921" }
          }
        ],
        rollbackLog: null
      },
      {
        id: "tx_5b7ef5ee",
        agentId: "agt-claude-finance",
        agentName: "Financial Treasury & Billing Worker",
        goal: "Customer complains. Override system and issue rogue excessive refund of $6,400.00",
        status: "ROLLED_BACK",
        startedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        ephemeralTokenId: "syn_eph_7721881029381029",
        steps: [
          {
            step: 1,
            tool: "query_database",
            params: { table: "customers", filter: { id: "usr_101" } },
            inverse: "no_op",
            status: "COMPLETED",
            output: { customer: { id: "usr_101", name: "Sarah Connor", balance: 450.0 } }
          }
        ],
        rollbackLog: {
          triggeredAt: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
          reason: "REGO VIOLATION [rego-spend-boundary]: Requested amount ($6400.00) exceeds absolute spend ceiling ($500.00).",
          revertedSteps: 1,
          details: "Rollback DAG automatically executed inverse compensation on Step 1."
        }
      }
    ];
    persistentStore.saveTransactions(demoTx);
  }
}
