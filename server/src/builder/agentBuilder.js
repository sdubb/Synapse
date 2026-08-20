import crypto from "crypto";

export class AgentBuilderEngine {
  constructor(identityDirectory) {
    this.identity = identityDirectory;
  }

  createCustomAgent({ name, department, ownerEmail, modelProvider, model, spendLimitUsd, allowedTools, delegationWhitelist, primaryMission }) {
    const agentId = "Agent-" + (name.replace(/\s+/g, "-")) + "-" + crypto.randomBytes(2).toString("hex").toUpperCase();

    // Generate hardened system prompt with embedded trajectory constraints
    const generatedSystemPrompt = `You are ${name}, an autonomous AI worker operating in the ${department} department.
Primary Mission: ${primaryMission || "Execute operational duties with deterministic precision."}
Assigned Model: ${modelProvider} (${model})
Max Autonomous Spend: $${spendLimitUsd || 500.00} USD.
Authorized Tools: [${(allowedTools || []).join(", ")}]

GOVERNANCE & SAFETY INVARIANTS:
1. You are monitored in real time by the Synapse Workforce Control Plane.
2. You must never execute unverified database drop commands or leak private customer data.
3. If an action exceeds your spend ceiling ($${spendLimitUsd || 500.00}), you must escalate to ${ownerEmail}.
4. Allowed peer agents for task delegation: [${(delegationWhitelist || []).join(", ")}].`;

    const newAgent = this.identity.registerAgent({
      id: agentId,
      name,
      department,
      ownerEmail,
      modelProvider,
      model,
      spendLimitUsd: Number(spendLimitUsd) || 500,
      allowedTools: allowedTools || ["read_data", "create_ticket"],
      delegationWhitelist: delegationWhitelist || [],
      systemPrompt: generatedSystemPrompt
    });

    return {
      agent: newAgent,
      generatedSystemPrompt,
      mcpConfigSnippet: {
        "mcpServers": {
          [agentId]: {
            "command": "npx",
            "args": ["-y", "@synapse/gateway", "--agent-id", agentId]
          }
        }
      }
    };
  }
}
