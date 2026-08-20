export function getCliIntegrationConfig(toolId) {
  switch (toolId) {
    case "antigravity":
      return {
        name: "Google Antigravity CLI (agy)",
        description: "Zero-latency sidecar proxy for Antigravity subagents, skills, and background tasks.",
        setupCommands: [
          "# 1. Install Synapse Antigravity Plugin",
          "npm install -g @synapse/antigravity-hook",
          "",
          "# 2. Bind to Antigravity CLI config (~/.antigravity/config.json)",
          "agy config set security.proxy 'http://localhost:4000/api/v1/intercept'",
          "agy config set telemetry.enabled true",
          "",
          "# 3. Run Antigravity with live trajectory assurance",
          "agy run --goal 'Refactor microservices' --with-synapse"
        ],
        manifestJson: {
          "schemaVersion": "2.0",
          "name": "synapse-antigravity-guard",
          "interceptorEndpoint": "http://localhost:4000/api/v1/intercept",
          "features": ["speculative_shadow_sandbox", "trajectory_invariants", "auto_rollback"]
        }
      };

    case "codex":
      return {
        name: "Codex CLI & OpenAI Swarm",
        description: "Governs multi-agent code generation, terminal execution, and repository mutations.",
        setupCommands: [
          "# 1. Export Synapse Environment Interceptor",
          "export OPENAI_BASE_URL='http://localhost:4000/v1/proxy/openai'",
          "export SYNAPSE_AGENT_ID='Codex-Dev-Worker'",
          "",
          "# 2. Run Codex CLI with deterministic zero-destruction lock",
          "codex start --safe-mode --trajectory-guard"
        ],
        manifestJson: {
          "interceptor": "synapse-codex-v1",
          "blockedCommands": ["rm -rf /", "DROP TABLE", "format c:"],
          "rollbackArmed": true
        }
      };

    case "mcp":
      return {
        name: "Anthropic MCP (Model Context Protocol) Server",
        description: "Universally wraps Claude, Cursor, and any MCP-compliant tool host.",
        setupCommands: [
          "# Add to claude_desktop_config.json or cursor.json:",
          "{",
          '  "mcpServers": {',
          '    "synapse-shield": {',
          '      "command": "npx",',
          '      "args": ["-y", "@synapse/mcp-gateway", "--target", "http://localhost:4000"]',
          "    }",
          "  }",
          "}"
        ],
        manifestJson: {
          "mcpVersion": "1.0",
          "gateway": "http://localhost:4000/mcp"
        }
      };

    default:
      return null;
  }
}
