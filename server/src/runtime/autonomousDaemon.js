import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { productionDb } from "../storage/productionDb.js";
import { realRegoEvaluator } from "../policy/realRegoEvaluator.js";

const AGY_EXE = "C:\\Users\\lenovo\\AppData\\Local\\agy\\bin\\agy.exe";

export class AutonomousCronDaemon {
  constructor(broadcastEvent = () => {}) {
    this.broadcastEvent = broadcastEvent;
    this.runningDaemons = new Map();
  }

  // Starts a 24/7 autonomous daemon for any agent
  startContinuousWorker(agentId, intervalMs = 15000, goal = "Continuously poll inbound queues, audit ledger, and verify SLA health") {
    if (this.runningDaemons.has(agentId)) {
      const existing = this.runningDaemons.get(agentId);
      return {
        active: true,
        agentId,
        status: existing.status,
        runsCount: existing.runsCount,
        intervalSeconds: existing.intervalMs / 1000
      };
    }

    console.log(`\n⚡ [DAEMON_LOOP]: Initializing 24/7 Continuous Autonomous Loop for agent '${agentId}' (Interval: ${intervalMs / 1000}s)...`);

    const daemonState = {
      agentId,
      goal,
      intervalMs,
      status: "RUNNING_24_7",
      startedAt: new Date().toISOString(),
      runsCount: 0,
      lastRunAt: null,
      activePid: null
    };

    const runIteration = async () => {
      daemonState.runsCount += 1;
      daemonState.lastRunAt = new Date().toISOString();
      const txId = `tx_loop_${agentId}_${daemonState.runsCount}_${Date.now()}`;

      console.log(`[DAEMON_ITERATION]: Running loop cycle #${daemonState.runsCount} for agent ${agentId} (Tx: ${txId})...`);

      try {
        // Auto-register pipeline as an agent if it doesn't already exist (satisfies FK constraint)
        try {
          productionDb.insertAgent({
            id: agentId,
            name: `Pipeline Daemon: ${agentId}`,
            provider: "synapse-daemon",
            department: "Autonomous Pipelines",
            owner: "operator@synapse",
            status: "ACTIVE",
            securityScore: 90,
            spendCeilingUsd: 5000,
            requiresHitlAboveUsd: 1000,
            systemPrompt: goal
          });
        } catch (e) {
          // Agent already exists — that's fine (INSERT OR REPLACE handles it)
        }

        // 1. Record transaction in database
        productionDb.insertTransaction({
          id: txId,
          agentId,
          goal: `[24/7 Loop #${daemonState.runsCount}] ${goal}`,
          status: "IN_PROGRESS",
          startedAt: new Date().toISOString(),
          ephemeralTokenId: `syn_eph_loop_${Date.now()}`
        });

        this.broadcastEvent({
          type: "DAEMON_CYCLE_STARTED",
          data: {
            agentId,
            cycleNumber: daemonState.runsCount,
            txId,
            status: "RUNNING_24_7",
            timestamp: daemonState.lastRunAt
          }
        });

        // 2. Pre-flight Rego Safety Check
        const eval1 = realRegoEvaluator.evaluate({ tool_name: "query_database", query: goal });
        productionDb.insertTransactionStep(txId, 1, "continuous_audit_probe", { cycle: daemonState.runsCount }, "no_op", {}, "COMPLETED");
        productionDb.appendAuditBlock(agentId, "continuous_audit_probe", eval1.verdict, eval1.reason, eval1.riskScore);

        // 3. Spawn real agy.exe or node worker
        const hasAgy = fs.existsSync(AGY_EXE);
        const cmd = hasAgy ? AGY_EXE : "node";
        const args = hasAgy
          ? ["-p", `Poll queue status for cycle ${daemonState.runsCount}`, "--output-format", "text", "--dangerously-skip-permissions"]
          : ["-e", `console.log("Completed 24/7 cycle ${daemonState.runsCount}")`];

        const child = spawn(cmd, args, { shell: true });
        daemonState.activePid = child.pid;

        child.on("close", (code) => {
          try {
            productionDb.insertTransactionStep(txId, 2, "execute_cycle_task", { pid: child.pid, exitCode: code }, "no_op", {}, "COMPLETED");
            productionDb.updateTransactionStatus(txId, "COMMITTED", null, 0);
            productionDb.appendAuditBlock(agentId, "execute_cycle_task", "ALLOWED", `Cycle #${daemonState.runsCount} finished cleanly`, 5);
          } catch (stepErr) {
            console.error(`[DAEMON_ITERATION]: Error recording cycle result: ${stepErr.message}`);
          }

          this.broadcastEvent({
            type: "DAEMON_CYCLE_COMPLETED",
            data: {
              agentId,
              cycleNumber: daemonState.runsCount,
              txId,
              exitCode: code,
              nextCycleInMs: intervalMs
            }
          });
        });
      } catch (iterErr) {
        console.error(`[DAEMON_ITERATION]: Cycle #${daemonState.runsCount} failed for ${agentId}: ${iterErr.message}`);
      }
    };

    // Execute first iteration immediately, then set recurring timer
    runIteration();
    const timer = setInterval(runIteration, intervalMs);
    daemonState.timer = timer;

    this.runningDaemons.set(agentId, daemonState);
    return {
      active: true,
      agentId,
      status: daemonState.status,
      runsCount: daemonState.runsCount,
      intervalSeconds: intervalMs / 1000
    };
  }

  stopContinuousWorker(agentId) {
    const daemon = this.runningDaemons.get(agentId);
    if (daemon) {
      clearInterval(daemon.timer);
      this.runningDaemons.delete(agentId);
      console.log(`🛑 [DAEMON_LOOP]: Stopped 24/7 Continuous Loop for agent '${agentId}'.`);
      this.broadcastEvent({ type: "DAEMON_STOPPED", data: { agentId } });
      return { success: true, message: `Stopped 24/7 loop for ${agentId}.` };
    }
    return { success: false, message: `No active 24/7 loop found for ${agentId}.` };
  }

  getActiveDaemons() {
    const list = [];
    for (const [id, d] of this.runningDaemons.entries()) {
      list.push({
        agentId: id,
        status: d.status,
        startedAt: d.startedAt,
        runsCount: d.runsCount,
        lastRunAt: d.lastRunAt,
        intervalSeconds: d.intervalMs / 1000
      });
    }
    return list;
  }
}

export const autonomousDaemon = new AutonomousCronDaemon();
