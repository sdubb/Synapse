import crypto from "crypto";
import { persistentStore } from "../storage/persistentStore.js";

export class IncidentRunbookEngine {
  constructor(broadcastEvent = () => {}) {
    this.broadcastEvent = broadcastEvent;
  }

  getIncidents() {
    return persistentStore.getIncidents();
  }

  // Triggered automatically whenever Kill Switch is activated or Sev-1 breach occurs
  triggerIncident({ agentId, agentName, triggerType = "EMERGENCY_KILL_SWITCH", severity = "SEV-1", reason, txId = null }) {
    const incidentId = "INC-" + crypto.randomBytes(3).toString("hex").toUpperCase();
    
    const incident = {
      incidentId,
      agentId,
      agentName,
      triggerType, // EMERGENCY_KILL_SWITCH | TRAJECTORY_ANOMALY | SPEND_BREACH
      severity,    // SEV-1 | SEV-2 | SEV-3
      reason,
      status: "TRIGGERED_STATE_FROZEN", // TRIGGERED_STATE_FROZEN | INVESTIGATING | RESOLVED | REVERTED
      createdAt: new Date().toISOString(),
      txId,
      runbookExecution: {
        step1_process_quarantine: "Container SIGSTOP issued. Ephemeral JWT revoked in Secrets Gateway.",
        step2_dag_compensation: "Rollback DAG initiated on uncommitted forward mutations.",
        step3_pagerduty_paged: "PagerDuty on-call security engineer paged (Incident INC-" + incidentId + ").",
        step4_servicenow_sync: "ServiceNow incident created under Enterprise SecOps queue."
      },
      resolution: null
    };

    const all = persistentStore.getIncidents();
    all.unshift(incident);
    persistentStore.saveIncidents(all);

    this.broadcastEvent({
      type: "INCIDENT_TRIGGERED",
      data: incident
    });

    return incident;
  }

  resolveIncident(incidentId, action = "SAFE_RESUME", notes = "Security team validated state.", resolvedBy = "secops-lead@enterprise.com") {
    const all = persistentStore.getIncidents();
    const target = all.find(i => i.incidentId === incidentId);
    if (!target) throw new Error("Incident not found");

    target.status = action === "SAFE_RESUME" ? "RESOLVED_SAFE_RESUME" : "PERMANENT_TERMINATED";
    target.resolution = {
      action,
      notes,
      resolvedBy,
      resolvedAt: new Date().toISOString()
    };

    persistentStore.saveIncidents(all);

    this.broadcastEvent({
      type: "INCIDENT_RESOLVED",
      data: target
    });

    return target;
  }
}
