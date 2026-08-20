import { productionDb } from "./server/src/storage/productionDb.js";

async function testHttpEntryPoint() {
  console.log("================================================================================");
  console.log("  ✦ TESTING REAL APP HTTP ENTRY POINT: POST /api/v1/pipeline/execute");
  console.log("================================================================================\n");

  const livePipeline = {
    id: "pipe_http_entry_" + Date.now(),
    name: "Live HTTP Entry Point Verification DAG",
    domain: "Automated Verification",
    cliEngine: "node",
    model: "deepseek-r1",
    spendCeilingUsd: 2500,
    hitlThresholdUsd: 500,
    cronInterval: 0,
    nodes: [
      {
        id: "step_1_inspect",
        nodeType: "REASON_DECOMPOSE",
        title: "Inspect Environment State",
        tool: "query_database",
        params: { check: "http_entry_live" }
      },
      {
        id: "step_2_compute",
        nodeType: "TOOL_SANDBOX",
        title: "Compute Sandbox Math in Subprocess",
        tool: "run_terminal_command",
        params: {
          command: "node",
          args: ["-e", "console.log(JSON.stringify({ calculatedHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', verified: true }))"]
        }
      }
    ]
  };

  // 1. Insert pipeline definition in SQLite
  productionDb.insertPipeline(livePipeline);

  // 2. Call the REAL Express HTTP endpoint
  console.log("• Sending HTTP POST to http://localhost:4000/api/v1/pipeline/execute...");
  const response = await fetch("http://localhost:4000/api/v1/pipeline/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      agentId: livePipeline.id,
      userGoal: "Execute Live HTTP Pipeline",
      spendLimitUsd: 2500
    })
  });

  const httpResponseJson = await response.json();
  console.log("\n[EXACT RAW HTTP RESPONSE]:");
  console.log(JSON.stringify(httpResponseJson, null, 2));

  // Wait 600ms for full async execution stages to write and commit to SQLite
  await new Promise(r => setTimeout(r, 600));

  // 3. Query SQLite for the transaction created
  console.log("\n--- EXACT RAW SQLITE TRANSACTIONS ROW ---");
  const txRow = productionDb.db.prepare("SELECT id, agent_id, goal, status, started_at, completed_at FROM transactions WHERE agent_id = ? ORDER BY started_at DESC LIMIT 1").get(livePipeline.id);
  console.log(JSON.stringify(txRow, null, 2));

  console.log("\n--- EXACT RAW SQLITE TRANSACTION_STEPS ROWS ---");
  const stepRows = productionDb.db.prepare("SELECT step_number, tool_name, status, parameters_json, executed_at FROM transaction_steps WHERE transaction_id = ?").all(txRow.id);
  console.log(JSON.stringify(stepRows, null, 2));

  console.log("\n--- EXACT RAW SQLITE AUDIT_LEDGER ROWS (LATEST 2) ---");
  const auditRows = productionDb.db.prepare("SELECT block_index, timestamp, agent_id, tool_name, verdict, risk_score, prev_hash, block_hash FROM audit_ledger ORDER BY block_index DESC LIMIT 2").all();
  console.log(JSON.stringify(auditRows, null, 2));
}

testHttpEntryPoint();
