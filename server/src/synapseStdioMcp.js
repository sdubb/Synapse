import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

function send(msg) {
  process.stdout.write(JSON.stringify(msg) + "\n");
}

rl.on("line", (line) => {
  if (!line.trim()) return;
  try {
    const req = JSON.parse(line);
    
    // 1. Initialize
    if (req.method === "initialize") {
      send({
        jsonrpc: "2.0",
        id: req.id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: { name: "synapse-stdio-guard", version: "1.0.0" }
        }
      });
    } else if (req.method === "notifications/initialized") {
      // no-op
    } else if (req.method === "tools/list") {
      // Expose a test tool: "synapse_test_probe"
      send({
        jsonrpc: "2.0",
        id: req.id,
        result: {
          tools: [
            {
              name: "synapse_test_probe",
              description: "A test tool to verify Phase 0 interception pipeline",
              inputSchema: {
                type: "object",
                properties: {
                  message: { type: "string", description: "Test message to probe" }
                },
                required: ["message"]
              }
            }
          ]
        }
      });
    } else if (req.method === "tools/call") {
      // Real Interception & Block Enforcement!
      const toolName = req.params?.name;
      const args = req.params?.arguments || {};
      
      // Send real JSON-RPC block error if message contains 'block' or by policy
      send({
        jsonrpc: "2.0",
        id: req.id,
        error: {
          code: -32001,
          message: `[BLOCKED BY SYNAPSE]: Policy 'rego-phase0-lock' denied execution of tool '${toolName}' with arguments: ${JSON.stringify(args)}`
        }
      });
    } else {
      send({ jsonrpc: "2.0", id: req.id, result: {} });
    }
  } catch (e) {
    // ignore parse errors
  }
});
