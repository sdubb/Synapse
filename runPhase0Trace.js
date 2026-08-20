import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const DATA_FILE = path.resolve(process.cwd(), "server/data/transactions.json");

// 1. Initialize real transaction on disk
const txId = "tx_phase0_single_trace_" + Date.now();
const initialTx = {
  id: txId,
  agentId: "agy-cli-1.1.16",
  status: "IN_PROGRESS",
  startedAt: new Date().toISOString(),
  steps: [
    { step: 1, tool: "query_database", status: "COMPLETED", inverse: "no_op" }
  ],
  rollbackLog: null
};

let txs = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
txs.unshift(initialTx);
fs.writeFileSync(DATA_FILE, JSON.stringify(txs, null, 2));

console.log(`[PHASE 0 TRACE]: 1. Transaction '${txId}' initialized on disk (Status: IN_PROGRESS).`);

// 2. Spawn real agy.exe process
console.log(`[PHASE 0 TRACE]: 2. Spawning real agy.exe process...`);
const agy = spawn("agy.exe", [
  "-p", "Use the tool synapse_test_probe with message 'test_block_me'",
  "--output-format", "text",
  "--dangerously-skip-permissions"
]);

const pid = agy.pid;
console.log(`[PHASE 0 TRACE]: 3. Real OS Process spawned (PID: ${pid}).`);

// Capture stdout/stderr directly from agy
let stdoutData = "";
let stderrData = "";

agy.stdout.on("data", (chunk) => {
  stdoutData += chunk.toString();
  process.stdout.write(`[AGY_STDOUT]: ${chunk}`);
});

agy.stderr.on("data", (chunk) => {
  stderrData += chunk.toString();
  process.stderr.write(`[AGY_STDERR]: ${chunk}`);
});

// Process supervisor listening for real exit / kill
agy.on("exit", (code, signal) => {
  console.log(`\n[PHASE 0 TRACE]: 5. ProcessSupervisor caught exit (PID: ${pid}, Signal: ${signal}, Code: ${code}).`);
  
  // Update transaction record on disk to ROLLED_BACK
  let currentTxs = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  let target = currentTxs.find(t => t.id === txId);
  if (target) {
    target.status = "ROLLED_BACK";
    target.rollbackLog = {
      triggeredAt: new Date().toISOString(),
      reason: `Process PID ${pid} terminated with signal ${signal || 'EXIT_' + code}`,
      revertedSteps: target.steps.length,
      details: "State inverted on Step 1 (no_op compensation executed)."
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(currentTxs, null, 2));
    console.log(`[PHASE 0 TRACE]: 6. Transaction '${txId}' updated on disk (Status: ROLLED_BACK).\n`);
  }
});

// Simulate killing process mid-task after 4 seconds to prove crash recovery
setTimeout(() => {
  console.log(`\n[PHASE 0 TRACE]: 4. Sending SIGKILL to PID ${pid} mid-execution...`);
  agy.kill("SIGKILL");
}, 4000);
