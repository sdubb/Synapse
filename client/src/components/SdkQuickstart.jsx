import React, { useState } from "react";
import { Code2, Copy, Check, Terminal } from "lucide-react";

export function SdkQuickstart() {
  const [activeTab, setActiveTab] = useState("python");
  const [copied, setCopied] = useState(false);

  const snippets = {
    python: `# Install SDK: pip install synapse-guard
from synapse_guard import SynapseGuard

# 1. Initialize Runtime Interceptor
guard = SynapseGuard(api_key="syn_live_demo99", server_url="http://localhost:4000")

# 2. Wrap your tool or Agent execution
@guard.protect(spend_limit=500.0, shadow_simulate=True, enable_rollback=True)
def issue_refund(charge_id: str, amount: float):
    # If the agent hallucinates or breaches limits, SynapseGuard intercepts instantly
    return stripe.Refund.create(charge=charge_id, amount=int(amount * 100))

# 3. Multi-step transaction session with 1-click Rollback
with guard.transaction(workflow="Monthly Subscription Reconciliation") as tx:
    tx.execute(issue_refund, charge_id="ch_102", amount=45.0)
    # If downstream steps fail, all preceding steps are automatically rolled back!`,

    typescript: `// Install SDK: npm install @synapse/guard
import { SynapseGuard } from "@synapse/guard";

// 1. Initialize client
const guard = new SynapseGuard({ serverUrl: "http://localhost:4000" });

// 2. Intercept Agent Tool Calls in 3 lines
const decision = await guard.interceptAction({
  agentId: "agent-billing-bot",
  toolName: "issue_refund",
  parameters: { chargeId: "ch_99", amount: 150.0 },
  enableShadow: true
});

if (!decision.allowed) {
  throw new Error(\`SynapseGuard Intercepted Action: \${decision.violations[0].reason}\`);
}

// 3. Proceed to real API execution with guaranteed inverse checkpoint
await stripe.refunds.create(decision.sanitizedParameters);`,

    langchain: `# LangChain / CrewAI / AutoGen Drop-in Wrapper
from langchain.agents import initialize_agent
from synapse_guard.integrations.langchain import SynapseGuardCallback

# Automatically intercept all agent tool invocations & record rollback DAG
synapse_handler = SynapseGuardCallback(server_url="http://localhost:4000")

agent_executor = initialize_agent(
    tools=tools,
    llm=llm,
    agent="zero-shot-react-description",
    callbacks=[synapse_handler] # <- 1 line integration!
)`
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(snippets[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl bg-surface border border-border overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-[#0D0F1A] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Developer SDK & 3-Line Drop-in Integration</h2>
            <p className="text-xs text-slate-400">
              Integrate deterministic protection into LangChain, CrewAI, AutoGen, or custom agent runtimes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {["python", "typescript", "langchain"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium capitalize transition ${
                activeTab === tab
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "bg-surface hover:bg-surface-hover text-slate-400 border border-border"
              }`}
            >
              {tab}
            </button>
          ))}

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-hover border border-border text-slate-200 text-xs font-mono transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>
      </div>

      {/* Code Viewer */}
      <div className="p-5 bg-[#08090E]">
        <pre className="text-xs font-mono text-indigo-300/90 leading-relaxed overflow-x-auto">
          <code>{snippets[activeTab]}</code>
        </pre>
      </div>
    </div>
  );
}
