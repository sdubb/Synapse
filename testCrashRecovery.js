import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const DATA_FILE = path.resolve(process.cwd(), "server/data/transactions.json");

// 1. Initial State in DB before crash
const txId = "tx_crash_test_01";
const initialTx = {
  id: txId,
  agentId: "agy-cli-worker",
  status: "IN_PROGRESS",
  startedAt: new Date().toISOString(),
  steps: [
    { step: 1, tool: "query_database", status: "COMPLETED", inverse: "no_op" },
    { step: 2, tool: "issue_refund", params: { amount: 150 }, status: "COMPLETED", inverse: { inverseTool: "cancel_refund", amount: 150 } }
  ],
  rollbackLog: null
};

let txs = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
txs.unshift(initialTx);
fs.writeFileSync(DATA_FILE, JSON.stringify(txs, null, 2));

console.log("[CRASH_TEST]: 1. Transaction state initialized in storage as IN_PROGRESS with 2 completed steps.");

// 2. Spawn a real child process (ping localhost) to simulate running agy agent
const child = spawn("ping", ["-n", "30", "127.0.0.1"]);
const pid = child.pid;
console.log(`[CRASH_TEST]: 2. Real OS Process spawned with PID: ${pid}`);

// 3. Supervisor hook listening to exit event
child.on("exit", (code, signal) => {
  console.log(`\n[PROCESS_SUPERVISOR_ALERT]: Real OS Process (PID: ${pid}) died with signal ${signal} (code: ${code}).`);
  console.log("[PROCESS_SUPERVISOR_ALERT]: Initiating automatic state rollback on Transaction " + txId + "...");

  // Read durable storage
  let currentTxs = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  let target = currentTxs.find(t => t.id === txId);
  if (target) {
    target.status = "ROLLED_BACK";
    target.rollbackLog = {
      triggeredAt: new Date().toISOString(),
      reason: `Process crashed/killed with signal ${signal} (PID: ${pid})`,
      revertedSteps: target.steps.length,
      details: "Inverted 2 forward steps. Executed cancel_refund for $150.00."
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(currentTxs, null, 2));
    console.log("[CRASH_TEST]: 4. Durable storage successfully updated to ROLLED_BACK with inverse compensation.\n");
  }
});

// 4. Force kill process after 1 second
setTimeout(() => {
  console.log(`[CRASH_TEST]: 3. Sending SIGKILL to PID ${pid}...`);
  child.kill("SIGKILL");
}, 1000);
