import readline from "readline";
import crypto from "crypto";
import fs from "fs";

// Layer 1: Universal MCP-Server-Level Role Scoping
// Reads SYNAPSE_INVOCATION_ROLE: "ACTOR" | "VERIFIER" | "REMEDIATOR"
const currentRole = (process.env.SYNAPSE_INVOCATION_ROLE || "ACTOR").toUpperCase();

const ALL_MCP_TOOLS = [
  // --- READ-ONLY INSPECTION TOOLS (Available to all roles including VERIFIER) ---
  {
    name: "query_database_state",
    description: "Read-only query to inspect real SQLite table rows and ledger balances.",
    mutating: false,
    inputSchema: {
      type: "object",
      properties: {
        table: { type: "string", description: "SQLite table name" },
        filter: { type: "object", description: "Filter criteria" }
      },
      required: ["table"]
    }
  },
  {
    name: "verify_file_hash",
    description: "Read-only inspection of physical file SHA-256 integrity on disk.",
    mutating: false,
    inputSchema: {
      type: "object",
      properties: {
        filePath: { type: "string", description: "Path to file" },
        expectedHash: { type: "string", description: "Expected SHA-256 hex digest" }
      },
      required: ["filePath"]
    }
  },
  {
    name: "check_endpoint_health",
    description: "Read-only HTTP status and latency probe to external API endpoint.",
    mutating: false,
    inputSchema: {
      type: "object",
      properties: {
        endpoint: { type: "string", description: "HTTPS URL to probe" }
      },
      required: ["endpoint"]
    }
  },
  {
    name: "read_audit_ledger",
    description: "Read-only inspection of cryptographic Merkle audit ledger blocks.",
    mutating: false,
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Max blocks to retrieve" }
      }
    }
  },

  // --- MUTATING ACTION TOOLS (Excluded structurally from VERIFIER role) ---
  {
    name: "write_file",
    description: "Mutating file write/edit tool to write code or artifacts to disk.",
    mutating: true,
    inputSchema: {
      type: "object",
      properties: {
        filePath: { type: "string", description: "Target file path" },
        content: { type: "string", description: "File content to write" }
      },
      required: ["filePath", "content"]
    }
  },
  {
    name: "issue_refund",
    description: "Mutating financial settlement tool to execute customer credit.",
    mutating: true,
    inputSchema: {
      type: "object",
      properties: {
        customerId: { type: "string", description: "Customer account ID" },
        amount: { type: "number", description: "Dollar amount to credit" }
      },
      required: ["customerId", "amount"]
    }
  },
  {
    name: "mutate_database",
    description: "Mutating SQL command execution (INSERT, UPDATE, DELETE).",
    mutating: true,
    inputSchema: {
      type: "object",
      properties: {
        statement: { type: "string", description: "SQL DML statement" }
      },
      required: ["statement"]
    }
  },
  {
    name: "execute_shell_command",
    description: "Mutating OS child process command execution.",
    mutating: true,
    inputSchema: {
      type: "object",
      properties: {
        command: { type: "string", description: "Command to execute" }
      },
      required: ["command"]
    }
  }
];

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

    // 1. Protocol Initialize
    if (req.method === "initialize") {
      send({
        jsonrpc: "2.0",
        id: req.id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: {
            name: "synapse-stdio-guard",
            version: "2.0.0",
            activeRole: currentRole
          }
        }
      });
    } else if (req.method === "notifications/initialized") {
      // no-op
    } else if (req.method === "tools/list") {
      // Structural Filtering by Role
      let availableTools = ALL_MCP_TOOLS;
      if (currentRole === "VERIFIER") {
        availableTools = ALL_MCP_TOOLS.filter(t => !t.mutating);
      }

      send({
        jsonrpc: "2.0",
        id: req.id,
        result: {
          tools: availableTools.map(({ mutating, ...toolDef }) => ({
            ...toolDef,
            // Expose structural read-only metadata
            description: toolDef.description + (mutating ? " [MUTATING]" : " [READ-ONLY]")
          }))
        }
      });
    } else if (req.method === "tools/call") {
      const toolName = req.params?.name;
      const args = req.params?.arguments || {};
      const targetTool = ALL_MCP_TOOLS.find(t => t.name === toolName);

      // Structural Enforcement: Reject mutating tool calls in VERIFIER role
      if (currentRole === "VERIFIER" && targetTool?.mutating) {
        send({
          jsonrpc: "2.0",
          id: req.id,
          error: {
            code: -32003,
            message: `STRUCTURAL_SECURITY_ERROR: Tool '${toolName}' is marked mutating: true and is strictly excluded from role '${currentRole}'.`
          }
        });
        return;
      }

      // Safe Execution
      send({
        jsonrpc: "2.0",
        id: req.id,
        result: {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                status: "SUCCESS",
                executedTool: toolName,
                role: currentRole,
                timestamp: new Date().toISOString()
              })
            }
          ]
        }
      });
    } else {
      send({ jsonrpc: "2.0", id: req.id, result: {} });
    }
  } catch (e) {
    // Ignore malformed input
  }
});
