// Verifier MCP Read-Only Client
// Connects to Synapse Universal MCP Gateway on Port 4005 to independently query real systems using global fetch
export class VerifierMcpClient {
  constructor(mcpGatewayUrl = "http://localhost:4005") {
    this.mcpGatewayUrl = mcpGatewayUrl;
  }

  // Calls a read-only tool over JSON-RPC 2.0 MCP Gateway
  async callMcpTool(toolName, args = {}) {
    console.log(`[VERIFIER_MCP_CALL]: Verifier querying '${toolName}' via MCP Gateway on port 4005...`);
    try {
      const response = await fetch(`${this.mcpGatewayUrl}/mcp/rpc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "v_rpc_" + Date.now(),
          method: "tools/call",
          params: { name: toolName, arguments: args }
        })
      });

      if (!response.ok) {
        return { success: false, error: `MCP HTTP ${response.status}` };
      }

      const json = await response.json();
      return { success: true, result: json.result };
    } catch (err) {
      console.warn(`[VERIFIER_MCP_ERROR]: Failed to connect to MCP Gateway on ${this.mcpGatewayUrl}: ${err.message}`);
      return {
        success: false,
        connected: false,
        error: `MCP Gateway unavailable at ${this.mcpGatewayUrl}: ${err.message}`
      };
    }
  }
}

export const verifierMcpClient = new VerifierMcpClient();
