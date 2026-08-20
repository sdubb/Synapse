import React, { useState } from "react";
import { Plug, Copy, Check, Terminal, ExternalLink, ShieldCheck, Server, ArrowRight } from "lucide-react";

export function ConnectHub() {
  const [selectedPlatform, setSelectedPlatform] = useState("salesforce");
  const [copied, setCopied] = useState(false);

  const platforms = {
    salesforce: {
      name: "Salesforce Agentforce (Atlas Reasoning Engine)",
      badge: "Zero-Code Named Credential",
      description: "Intercepts autonomous Atlas actions before mutating Salesforce CRM, Service Cloud, or billing records.",
      code: `// Salesforce Agentforce Setup (Named Credential + Callout Hook)
// 1. In Salesforce Setup -> Named Credentials:
//    URL: https://api.synapseguard.io/v1/intercept
//    Authentication: Token Authentication (Bearer syn_live_enterprise_99)

// 2. In Agentforce Action Builder:
//    Route all automated update/refund action flows through the 'Synapse_Gateway' Named Credential.

// 3. Synapse automatically verifies spend ceilings and registers Rollback DAG inverse checkpoints.`
    },
    antigravity: {
      name: "Google Antigravity CLI (agy)",
      badge: "Native CLI Hook",
      description: "Intercepts Antigravity autonomous subagents, background tasks, and skill execution with zero-latency safety.",
      code: `# 1. Install Synapse Antigravity Sidecar Hook
npm install -g @synapse/antigravity-hook

# 2. Bind to Antigravity CLI config (~/.antigravity/config.json)
agy config set security.proxy "http://localhost:4000/api/v1/intercept"
agy config set telemetry.stream "ws://localhost:4000"
agy config set rollback.auto true

# 3. Launch Antigravity with live trajectory assurance
agy run --goal "Refactor production microservices" --with-synapse`
    },
    bedrock: {
      name: "Amazon Bedrock Agents (AgentCore)",
      badge: "AWS Lambda Layer",
      description: "Wraps Bedrock Action Groups in a low-latency Lambda governance layer for full trajectory validation.",
      code: `# Attach Synapse Lambda Layer to your Bedrock Action Group Handler
from synapse_guard.bedrock import BedrockGuard

guard = BedrockGuard(spend_limit=1000.0, server_url="http://localhost:4000")

@guard.protect
def lambda_handler(event, context):
    # Executed safely inside your AWS VPC with Synapse trajectory assurance
    return handle_action_group(event)`
    },
    codex: {
      name: "OpenAI Codex CLI & Swarm",
      badge: "Environment Interceptor",
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
      badge: "Universal Proxy",
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
    }
  };

  const current = platforms[selectedPlatform];

  const handleCopy = () => {
    navigator.clipboard.writeText(current.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-surface border border-border p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            Universal Enterprise Agent Connectors Hub
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Connect Salesforce Agentforce, Google Antigravity, Amazon Bedrock, Codex, or Claude MCP to Synapse in under 2 minutes.
          </p>
        </div>

        {/* Platform Selector Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap font-mono text-xs">
          {Object.keys(platforms).map(k => (
            <button
              key={k}
              onClick={() => setSelectedPlatform(k)}
              className={`px-3 py-1.5 rounded-xl border transition ${
                selectedPlatform === k
                  ? "bg-indigo-600 text-white border-indigo-500 shadow-md"
                  : "bg-background text-slate-400 hover:text-white border-border"
              }`}
            >
              {platforms[k].name.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Integration Code Box */}
      <div className="rounded-2xl bg-surface border border-border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">{current.name}</h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                {current.badge}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">{current.description}</p>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background hover:bg-surface border border-border text-slate-200 text-xs font-mono transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copied ? "Copied" : "Copy Setup"}</span>
          </button>
        </div>

        <div className="p-4 rounded-xl bg-[#08090E] border border-border">
          <pre className="text-xs font-mono text-indigo-300 leading-relaxed overflow-x-auto">
            <code>{current.code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
