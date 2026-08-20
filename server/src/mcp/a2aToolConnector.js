import { a2aMeshEngine } from "../a2a/googleA2AMesh.js";

// MCP Tool Definition to inject into Claude / Cursor / agy
export const A2A_MCP_TOOL_DEFINITION = {
  name: "a2a_delegate_task",
  description: "Delegates a specialized sub-task to an authorized peer agent (e.g. Sales AE delegating invoice creation to Corporate Treasury, or SRE delegating secret rotation to Security Lead). The delegation is cryptographically signed and governed by Synapse OPA spend limits.",
  inputSchema: {
    type: "object",
    properties: {
      delegateeId: {
        type: "string",
        description: "The ID of the target peer agent (e.g., 'agent-finance-treasury', 'agent-sre-commander', 'agent-sales-ae')"
      },
      directive: {
        type: "string",
        description: "The specific task prompt or instruction for the peer agent to execute"
      },
      amount: {
        type: "number",
        description: "Optional financial or resource amount involved in the delegation (evaluated against OPA spend limits)"
      }
    },
    required: ["delegateeId", "directive"]
  }
};

export async function executeA2AMcpTool(args, delegatorId = "agent-sales-ae") {
  return a2aMeshEngine.delegateTask({
    delegatorId,
    delegateeId: args.delegateeId,
    taskDirective: args.directive,
    payload: { amount: args.amount || 0 }
  });
}
