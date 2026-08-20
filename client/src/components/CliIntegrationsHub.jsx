import React, { useState } from "react";
import { Terminal, Copy, Check, ExternalLink, Cpu, Code2, Shield } from "lucide-react";

export function CliIntegrationsHub() {
  const [selectedTool, setSelectedTool] = useState("antigravity");
  const [copied, setCopied] = useState(false);

  const configs = {
    antigravity: {
      name: "Google Antigravity CLI (agy)",
      badge: "Native Sidecar & Skill Hook",
      description: "Intercepts Antigravity autonomous subagents, background tasks, and skill execution with zero-latency deterministic safety.",
      code: `# 1. Install Synapse Antigravity Sidecar Hook
npm install -g @synapse/antigravity-hook

# 2. Bind to Antigravity CLI config (~/.antigravity/config.json)
agy config set security.proxy "http://localhost:4000/api/v1/intercept"
agy config set telemetry.stream "ws://localhost:4000"
agy config set rollback.auto true

# 3. Launch Antigravity with live trajectory assurance
agy run --goal "Refactor production microservices" --with-synapse`
    },
    codex: {
      name: "OpenAI Codex CLI & Swarm",
      badge: "Zero-Destruction Lock",
      description: "Wraps terminal execution and multi-agent repository mutations with deterministic rollback DAGs.",
      code: `# 1. Export Synapse Environment Variables
export OPENAI_BASE_URL="http://localhost:4000/v1/proxy/openai"
export SYNAPSE_AGENT_ID="Codex-DevOps-Worker"
export SYNAPSE_SPEND_CEILING=500

# 2. Run Codex CLI with hard invariant filters
codex start --safe-mode --trajectory-guard`
    },
    mcp: {
      name: "Anthropic MCP (Model Context Protocol)",
      badge: "Universal Tool Gateway",
      description: "Drop-in proxy for Claude Desktop, Cursor IDE, and all MCP tool providers.",
      code: `// Add to claude_desktop_config.json or cursor.json:
{
  "mcpServers": {
    "synapse-control-plane": {
      "command": "npx",
      "args": [
        "-y",
        "@synapse/mcp-gateway",
        "--server", "http://localhost:4000",
        "--enable-shadow-sandbox", "true"
      ]
    }
  }
}`
    },
    langgraph: {
      name: "LangGraph & CrewAI Orchestrators",
      badge: "Stateful Agentic Loops",
      description: "Attach Synapse state checkpointing and automatic compensating inverse actions to every graph node.",
      code: `# Python Integration for LangGraph & CrewAI
from langgraph.graph import StateGraph
from synapse_guard.integrations.langgraph import SynapseGuardCheckpointSaver

# Wrap graph execution with deterministic rollback checkpoints
checkpointer = SynapseGuardCheckpointSaver(server_url="http://localhost:4000")
app = workflow.compile(checkpointer=checkpointer)`
    }
  };

  const current = configs[selectedTool];

  const handleCopy = () => {
    navigator.clipboard.writeText(current.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl bg-surface border border-border overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-[#0D0F1A] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">CLI & Ecosystem Integrations Hub</h2>
            <p className="text-xs text-slate-400">
              Plug SynapseGuard directly into Google Antigravity, Codex CLI, Claude Code, Cursor, and LangGraph
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {Object.keys(configs).map(toolKey => (
            <button
              key={toolKey}
              onClick={() => setSelectedTool(toolKey)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition ${
                selectedTool === toolKey
                  ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
                  : "bg-surface text-slate-400 hover:text-white border border-border"
              }`}
            >
              {toolKey.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">{current.name}</h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                {current.badge}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">{current.description}</p>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface hover:bg-surface-hover border border-border text-slate-200 text-xs font-mono transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copied ? "Copied" : "Copy Setup"}</span>
          </button>
        </div>

        <div className="p-4 rounded-xl bg-[#08090E] border border-border">
          <pre className="text-xs font-mono text-cyan-300 leading-relaxed overflow-x-auto">
            <code>{current.code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
