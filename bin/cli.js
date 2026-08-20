#!/usr/bin/env node

import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

console.log("===============================================================");
console.log("  🛡️  SYNAPSE CONTROL PLANE — ENTERPRISE AI WORKFORCE ENGINE");
console.log("===============================================================\n");

const args = process.argv.slice(2);
const command = args[0] || "start";

if (command === "--help" || command === "-h" || command === "help") {
  console.log(`Usage:
  npx synapse-guard start        Start the complete control plane (Server, MCP, & DB)
  npx synapse-guard status       Check health of local daemons and MCP gateway
  npx synapse-guard test         Run the 20-point E2E verification test suite
  npx synapse-guard mcp          Display Claude Desktop & Cursor MCP config snippet
`);
  process.exit(0);
}

if (command === "test") {
  console.log("🧪 Executing full E2E test suite from scratch...\n");
  const testProc = spawn("node", [path.join(ROOT_DIR, "runFullE2ETest.js")], { stdio: "inherit" });
  testProc.on("exit", (code) => process.exit(code || 0));
} else if (command === "mcp") {
  console.log("📋 Claude Desktop & Cursor MCP Configuration Snippet:");
  console.log(JSON.stringify({
    mcpServers: {
      "synapse-control-plane": {
        command: "npx",
        args: ["-y", "mcp-remote", "http://localhost:4005"]
      }
    }
  }, null, 2));
  process.exit(0);
} else if (command === "status") {
  fetch("http://localhost:4000/api/v1/stats")
    .then(r => r.json())
    .then(d => {
      console.log("✅ Synapse Control Plane is ONLINE:");
      console.log(d.stats);
      process.exit(0);
    })
    .catch(() => {
      console.error("❌ Synapse Control Plane is not currently running. Run 'npx synapse-guard start'.");
      process.exit(1);
    });
} else {
  // Start server and launch services
  console.log("🚀 Launching Synapse Control Plane...\n");
  console.log("  • Central API Server:    http://localhost:4000");
  console.log("  • FAANG MCP Gateway:     http://0.0.0.0:4005");
  console.log("  • Database Ledger:       server/data/synapse_production.db");
  console.log("  • Web UI Dashboard:      http://localhost:3000\n");

  const serverProc = spawn("node", [path.join(ROOT_DIR, "server/src/index.js")], {
    stdio: "inherit",
    cwd: path.join(ROOT_DIR, "server")
  });

  serverProc.on("exit", (code) => {
    console.log(`Server exited with code ${code}`);
  });
}
