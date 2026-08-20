import { dagRuntimeExecutor } from "./server/src/runtime/dagRuntimeExecutor.js";
import { productionDb } from "./server/src/storage/productionDb.js";

async function traceCall() {
  const realDag = {
    id: "pipe_trace_verification_" + Date.now(),
    name: "Real Trace Verification DAG",
    domain: "Infrastructure Automation",
    cliEngine: "node",
    model: "deepseek-r1",
    spendCeilingUsd: 1500,
    hitlThresholdUsd: 300,
    cronInterval: 10,
    nodes: [
      {
        id: "step_1_inspect",
        nodeType: "REASON_DECOMPOSE",
        title: "Analyze System Environment",
        tool: "query_database",
        params: { targetService: "auth-api", region: "us-east-1" }
      },
      {
        id: "step_2_execute_command",
        nodeType: "TOOL_SANDBOX",
        title: "Run Node Subprocess Computation",
        tool: "run_terminal_command",
        params: {
          command: "node",
          args: ["-e", "console.log(JSON.stringify({ platform: process.platform, nodeVersion: process.version, memoryBytes: process.memoryUsage().heapUsed }))"]
        }
      },
      {
        id: "step_3_write_manifest",
        nodeType: "TOOL_SANDBOX",
        title: "Generate Audited Deployment Manifest",
        tool: "k8s_cluster_drain_restart",
        postcondition: { verifier: "idempotency_key_active", params: { idempotencyKey: "idem_trace_01" } },
        params: { cluster: "prod-us-east-1", service: "auth-api", idempotencyKey: "idem_trace_01" }
      }
    ]
  };

  productionDb.insertPipeline(realDag);

  const result = await dagRuntimeExecutor.executePipeline(realDag);

  console.log("\n--- EXACT RAW SQLITE TRANSACTIONS ROW ---");
  const txRow = productionDb.db.prepare("SELECT id, agent_id, goal, status, started_at, completed_at FROM transactions WHERE id = ?").get(result.txId);
  console.log(JSON.stringify(txRow, null, 2));

  console.log("\n--- EXACT RAW SQLITE TRANSACTION_STEPS ROWS ---");
  const stepRows = productionDb.db.prepare("SELECT step_number, tool_name, status, parameters_json, executed_at FROM transaction_steps WHERE transaction_id = ?").all(result.txId);
  console.log(JSON.stringify(stepRows, null, 2));

  console.log("\n--- EXACT RAW SQLITE AUDIT_LEDGER ROWS (LATEST 3) ---");
  const auditRows = productionDb.db.prepare("SELECT block_index, timestamp, agent_id, tool_name, verdict, risk_score, prev_hash, block_hash FROM audit_ledger ORDER BY block_index DESC LIMIT 3").all();
  console.log(JSON.stringify(auditRows, null, 2));
}

traceCall();
