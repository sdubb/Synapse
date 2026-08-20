import React, { useState } from "react";
import {
  Server, Key, Check, Copy, Terminal, Shield, Sparkles, CheckCircle2,
  ExternalLink, Layers, ArrowRight, Code, Cpu
} from "lucide-react";

export function LiveEmployeeConnectorHub() {
  const [activeCli, setActiveCli] = useState("claude");
  const [copied, setCopied] = useState(false);

  const cliConfigs = {
    claude: {
      name: "Anthropic Claude Desktop & Code",
      fileLocation: "%APPDATA%\\Claude\\claude_desktop_config.json",
      snippet: `{
  "mcpServers": {
    "synapse-faang-control-plane": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "http://localhost:4005"
      ]
    }
  }
}`,
      promptExample: "Audit AWS S3 compliance for bucket 'enterprise-compliance-vault' and notify on Slack using Synapse MCP tools.",
      howItWorks: "Claude connects to port 4005, discovers all 14 FAANG tools (AWS S3, K8s, BigQuery, Salesforce, Okta, Vault), and routes actions through Synapse OPA spend limits."
    },
    cursor: {
      name: "Cursor AI & Windsurf IDE",
      fileLocation: "~/.cursor/mcp.json",
      snippet: `{
  "mcpServers": {
    "synapse-guard": {
      "url": "http://localhost:4005"
    }
  }
}`,
      promptExample: "Check Kubernetes cluster pod health and trigger zero-downtime rolling restart if memory leak detected.",
      howItWorks: "Cursor agents query Synapse directly over SSE/HTTP, enabling developers to build guarded agents in their IDE."
    },
    agy: {
      name: "Google Antigravity CLI (agy.exe)",
      fileLocation: "Terminal / PowerShell CLI Hook",
      snippet: `# 1. Attach Synapse FAANG MCP Server to agy CLI
agy mcp add synapse-faang-gateway http://localhost:4005

# 2. Run any real 24/7 autonomous employee job
agy run --goal "Continuously monitor and heal K8s payments pod" --dangerously-skip-permissions`,
      promptExample: "agy run --goal 'Sync Salesforce opportunity to SAP S/4HANA general ledger'",
      howItWorks: "agy.exe executes autonomously as a persistent OS daemon, calling Synapse's tools while being guarded against budget overruns."
    },
    codex: {
      name: "OpenAI Codex / LangGraph / CrewAI (Python)",
      fileLocation: "main.py / agent.py",
      snippet: `import synapse_guard
from langchain_core.tools import Tool

# 1. Initialize Synapse Gateway
synapse_guard.init(
    mcp_endpoint="http://localhost:4005",
    spend_ceiling=2500.00,
    enforce_rego=True
)

# 2. Your agent now has all 14 FAANG tools with automatic governance
agent = create_autonomous_worker(
    tools=synapse_guard.get_faang_tools(),
    loop="24_7_continuous"
)`,
      promptExample: "agent.run('Execute daily treasury wire disbursement and Slack reconciliation')",
      howItWorks: "Wrap any Python LangGraph, AutoGen, or CrewAI swarm with 2 lines of code to grant them enterprise FAANG tools with zero data leakage."
    }
  };

  const current = cliConfigs[activeCli];

  const handleCopy = () => {
    navigator.clipboard.writeText(current.snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 text-xs">
      {/* Hero Banner */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-400" />
            Connect External Agents (Claude / Cursor / agy / Codex)
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Give any AI agent runtime 14 FAANG tools (AWS S3, K8s, BigQuery, Salesforce, Okta, Vault) with real-time OPA spend limits and audit logging.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-semibold shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>MCP Gateway: 0.0.0.0:4005 (Active)</span>
        </div>
      </div>

      {/* CLI Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.keys(cliConfigs).map((key) => {
          const cfg = cliConfigs[key];
          const isSelected = activeCli === key;

          return (
            <button
              key={key}
              onClick={() => setActiveCli(key)}
              className={`p-4 rounded-xl border text-left transition flex flex-col justify-between space-y-2 ${
                isSelected
                  ? "bg-slate-900 border-blue-500 text-white shadow-sm"
                  : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <span className="text-[10px] uppercase font-semibold text-blue-400">Target Runtime</span>
              <strong className="text-xs text-white block">{cfg.name.split(" ")[0]} {cfg.name.split(" ")[1]}</strong>
              <span className="text-[11px] text-slate-500 font-mono truncate">{cfg.fileLocation.split(" ")[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Code Snippet & How-To Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Configuration File */}
        <div className="lg:col-span-7 rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-blue-400 uppercase">Step 1: Configuration File</span>
              <h3 className="text-xs font-semibold text-white font-mono mt-0.5">{current.fileLocation}</h3>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition text-xs font-medium"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copied ? "Copied!" : "Copy Configuration"}</span>
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <pre className="text-xs font-mono text-slate-200 leading-relaxed overflow-x-auto">
              <code>{current.snippet}</code>
            </pre>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
            <strong className="text-slate-200 block mb-1">How Synapse Supervises This Agent:</strong>
            <p>{current.howItWorks}</p>
          </div>
        </div>

        {/* Right: Real Test Prompt & Live Verification */}
        <div className="lg:col-span-5 rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <span className="text-xs text-blue-400 font-semibold uppercase">Step 2: Prompt Agent</span>
            <h3 className="text-xs font-semibold text-white">Sample Production Prompt to Test</h3>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs italic leading-relaxed">
              "{current.promptExample}"
            </div>

            <div className="space-y-2.5 pt-2">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">3-Point Live Verification:</span>
              
              <div className="text-xs text-slate-300 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Agent queries <code className="text-blue-400 font-mono">http://localhost:4005</code> for available FAANG tools.</span>
              </div>

              <div className="text-xs text-slate-300 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>OPA Rego evaluates spend limits & zero-destruction invariants in &lt;3ms.</span>
              </div>

              <div className="text-xs text-slate-300 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Every action is cryptographically committed into the SQLite audit ledger.</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
            <span>🛡️ External agents operate as guarded autonomous workers with strict RBAC boundaries.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
