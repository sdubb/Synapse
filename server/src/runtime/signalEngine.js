import { dagRuntimeExecutor } from "./dagRuntimeExecutor.js";
import { productionDb } from "../storage/productionDb.js";

/**
 * Inbound Webhook Signal Trigger Dispatcher
 * 
 * Ingests external webhook signals (e.g. GitHub issue webhooks, monitoring alerts, Stripe events),
 * resolves the target pipeline DAG from SQLite or constructs a parameterized execution DAG,
 * and executes it directly through the real dagRuntimeExecutor.
 */
export class AutonomousSignalDeductionEngine {
  constructor(broadcastEvent = () => {}) {
    this.broadcastEvent = broadcastEvent;
  }

  async ingestSignal({ source, event, payload = {} }) {
    console.log(`\n⚡ [WEBHOOK_SIGNAL_INGEST]: Inbound signal from source '${source}' (Event: '${event}')...`);

    if (!source) {
      return { triggered: false, error: "Missing required signal source identifier." };
    }

    const signalId = "sig_" + Date.now();
    const directive = payload.directive || payload.message || payload.goal || `Process inbound ${source} event: ${event || "generic_signal"}`;
    const targetAgentId = payload.targetAgentId || payload.agentId || `pipe_${source}_webhook`;

    // 1. Look up existing saved pipeline in SQLite or construct real DAG
    let pipeline = productionDb.getPipeline(targetAgentId);

    if (!pipeline) {
      pipeline = {
        id: targetAgentId,
        name: `Webhook Pipeline: ${source}`,
        domain: "Event-Driven Automation",
        cliEngine: "node",
        model: "deepseek-r1",
        spendCeilingUsd: Number(payload.spendLimitUsd) || 1000,
        hitlThresholdUsd: Number(payload.hitlThresholdUsd) || 300,
        cronInterval: 0,
        nodes: [
          {
            id: "step_1_ingest",
            nodeType: "REASON_DECOMPOSE",
            title: `Ingest & Validate ${source} Webhook Payload`,
            tool: "query_database",
            params: { source, event, payloadSummary: Object.keys(payload) }
          },
          {
            id: "step_2_process",
            nodeType: "TOOL_SANDBOX",
            title: `Execute Real Action for ${source}`,
            tool: "run_terminal_command",
            params: {
              command: "node",
              args: ["-e", `console.log(JSON.stringify({ eventProcessed: true, source: "${source}", timestamp: new Date().toISOString() }))`]
            }
          }
        ]
      };
      productionDb.insertPipeline(pipeline);
    }

    const signalRecord = {
      signalId,
      source,
      event: event || "generic_event",
      targetAgentId: pipeline.id,
      deducedGoal: directive,
      timestamp: new Date().toISOString(),
      status: "DISPATCHED_TO_DAG_RUNTIME"
    };

    this.broadcastEvent({ type: "AUTONOMOUS_SIGNAL_TRIGGERED", data: signalRecord });

    // 2. Execute via the REAL dagRuntimeExecutor
    const executionResult = await dagRuntimeExecutor.executePipeline(pipeline, {
      signalId,
      source,
      event,
      payload
    });

    return {
      success: true,
      signalRecord,
      txId: executionResult.txId,
      status: executionResult.status,
      message: `✅ Inbound signal from '${source}' executed via DAG Runtime Engine (Tx: ${executionResult.txId}).`
    };
  }
}

export const signalEngine = new AutonomousSignalDeductionEngine();
