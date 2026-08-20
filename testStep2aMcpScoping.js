import { spawn } from "child_process";

async function queryMcp(role, requests) {
  return new Promise((resolve, reject) => {
    const child = spawn("node", ["server/src/synapseStdioMcp.js"], {
      env: { ...process.env, SYNAPSE_INVOCATION_ROLE: role },
      stdio: ["pipe", "pipe", "inherit"]
    });

    let buffer = "";
    const responses = [];

    child.stdout.on("data", (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop(); // keep last incomplete line

      for (const line of lines) {
        if (line.trim()) {
          responses.push(JSON.parse(line));
          if (responses.length === requests.length) {
            child.kill();
            resolve(responses);
          }
        }
      }
    });

    child.on("error", reject);

    // Send requests
    for (const req of requests) {
      child.stdin.write(JSON.stringify(req) + "\n");
    }
  });
}

async function runTest() {
  console.log("================================================================================");
  console.log("  ✦ STEP 2a: LAYER 1 — MCP-SERVER-LEVEL ROLE SCOPING PROOF");
  console.log("================================================================================\n");

  console.log("1. QUERYING TOOLS/LIST WITH SYNAPSE_INVOCATION_ROLE=VERIFIER:");
  const verifierResponses = await queryMcp("VERIFIER", [
    { jsonrpc: "2.0", id: 1, method: "initialize", params: {} },
    { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} },
    { jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "issue_refund", arguments: { customerId: "usr_101", amount: 100 } } }
  ]);

  const verifierTools = verifierResponses[1]?.result?.tools || [];
  console.log("• Returned Tools Count for VERIFIER:", verifierTools.length);
  console.log("• Returned Tools List:");
  verifierTools.forEach(t => console.log(`   - ${t.name}: ${t.description}`));

  console.log("\n• Calling Mutating Tool 'issue_refund' under VERIFIER Role:");
  console.log(JSON.stringify(verifierResponses[2], null, 2));

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("2. QUERYING TOOLS/LIST WITH SYNAPSE_INVOCATION_ROLE=ACTOR:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const actorResponses = await queryMcp("ACTOR", [
    { jsonrpc: "2.0", id: 1, method: "initialize", params: {} },
    { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }
  ]);

  const actorTools = actorResponses[1]?.result?.tools || [];
  console.log("• Returned Tools Count for ACTOR:", actorTools.length);
  console.log("• Returned Tools List:");
  actorTools.forEach(t => console.log(`   - ${t.name}: ${t.description}`));
}

runTest();
