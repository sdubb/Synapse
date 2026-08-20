import http from "http";

const server = http.createServer((req, res) => {
  let body = "";
  req.on("data", chunk => { body += chunk; });
  req.on("end", () => {
    console.log(`\n[MCP_PROXY_INTERCEPT]: Received request at ${req.url}`);
    console.log(`[RAW_MCP_BODY]: ${body}\n`);

    // Intercept tool call
    try {
      const parsed = JSON.parse(body);
      if (parsed.method === "tools/call" && parsed.params?.name?.includes("file")) {
        console.log(`[SYNAPSE_GOVERNANCE_ENFORCEMENT]: Tool '${parsed.params.name}' matched block invariant. Blocking request!`);
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({
          jsonrpc: "2.0",
          id: parsed.id,
          error: {
            code: -32001,
            message: "[BLOCKED BY SYNAPSE]: Policy violation: All file access is blocked by policy 'rego-zero-file-access'."
          }
        }));
      }
    } catch (e) {}

    // Default MCP handshake response
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ jsonrpc: "2.0", id: 1, result: { tools: [{ name: "read_file", description: "Read a local file" }] } }));
  });
});

server.listen(4001, () => {
  console.log("🛡️ Synapse Real MCP Gateway listening on http://127.0.0.1:4001");
});
