import { LLMEngine } from "./llmEngine.js";
import { SandboxToolRegistry } from "../tools/sandboxTools.js";

export class EndToEndAgentExecutor {
  constructor(runtime, broadcastEvent = () => {}) {
    this.runtime = runtime;
    this.broadcastEvent = broadcastEvent;
    this.llm = new LLMEngine();
    this.tools = new SandboxToolRegistry();
    this.activeRuns = new Map();
  }

  async runAgentTask({ agentId, modelProvider, model, systemPrompt, userGoal, spendLimitUsd = 500, maxSteps = 5 }) {
    const runId = "run_" + Math.random().toString(36).substr(2, 9);
    const tx = this.runtime.rollback.beginTransaction(agentId, `Autonomous Goal: ${userGoal.substring(0, 45)}...`);
    
    this.broadcastEvent({ type: "TRANSACTION_STARTED", data: tx });
    this.broadcastEvent({
      type: "AGENT_RUN_STARTED",
      data: { runId, agentId, userGoal, transactionId: tx.id, startTime: new Date().toISOString() }
    });

    const executionLog = [];
    const messageHistory = [];
    let isComplete = false;
    let stepCount = 0;
    let finalOutcome = null;

    const delay = ms => new Promise(r => setTimeout(r, ms));

    while (!isComplete && stepCount < maxSteps) {
      stepCount++;
      await delay(400);

      // 1. LLM Cognitive Step Planning
      const stepPlan = await this.llm.planNextStep({
        agentId,
        modelProvider: modelProvider || "Anthropic",
        model: model || "claude-3-5-sonnet",
        systemPrompt: systemPrompt || "You are an autonomous enterprise worker governed by Synapse.",
        userGoal,
        messageHistory,
        availableTools: ["query_database", "mutate_database", "issue_refund", "manage_cloud_resources", "send_notification"]
      });

      // 2. Broadcast Live Thought Trace (Antigravity/Codex Style)
      this.broadcastEvent({
        type: "AGENT_THOUGHT_TRACE",
        data: {
          agentId,
          runId,
          stepIndex: stepCount,
          thought: stepPlan.thought,
          currentGoal: stepPlan.subGoal,
          action: stepPlan.toolCall?.toolName || "reasoning_complete",
          model: `${modelProvider || "Anthropic"} (${model || "claude-3-5-sonnet"})`,
          department: "Operations"
        }
      });

      if (stepPlan.isFinished) {
        isComplete = true;
        finalOutcome = stepPlan.finalOutput || "Goal accomplished successfully.";
        break;
      }

      await delay(500);

      // 3. Synapse Runtime Interception (Guardrails + Shadow Sandbox + Trajectory Invariant)
      const toolCall = stepPlan.toolCall;
      const interceptDecision = await this.runtime.interceptAction({
        agentId,
        transactionId: tx.id,
        workflowName: tx.workflowName,
        toolName: toolCall.toolName,
        parameters: toolCall.parameters,
        enableShadow: true
      });

      // 4. If Blocked by Trajectory or Guardrail: Trigger Rollback
      if (!interceptDecision.allowed) {
        const rollbackResult = await this.runtime.rollback.executeRollback(
          tx.id,
          interceptDecision.violations?.[0]?.reason || "Security policy violation"
        );
        this.broadcastEvent({ type: "TRANSACTION_ROLLED_BACK", data: rollbackResult });

        finalOutcome = `❌ Execution Halted: Intercepted by Synapse Control Plane. ${interceptDecision.violations?.[0]?.reason}`;
        isComplete = true;
        break;
      }

      // 5. Execute Tool in Real Sandbox
      const toolResult = await this.tools.executeTool(toolCall.toolName, interceptDecision.sanitizedParameters);
      
      executionLog.push({
        step: stepCount,
        thought: stepPlan.thought,
        toolCalled: toolCall.toolName,
        sanitizedParams: interceptDecision.sanitizedParameters,
        toolResult,
        latencyMs: interceptDecision.latencyMs
      });

      messageHistory.push({
        role: "assistant",
        content: `Executed tool ${toolCall.toolName}: ${JSON.stringify(toolResult)}`
      });
    }

    if (!tx.status || tx.status === "IN_PROGRESS") {
      this.runtime.rollback.commitTransaction(tx.id);
      this.broadcastEvent({ type: "TRANSACTION_COMMITTED", data: tx });
    }

    const runSummary = {
      runId,
      agentId,
      userGoal,
      transactionId: tx.id,
      status: tx.status === "ROLLED_BACK" ? "BLOCKED_ROLLED_BACK" : "COMPLETED_SAFE",
      totalSteps: stepCount,
      executionLog,
      finalOutcome,
      completedAt: new Date().toISOString()
    };

    this.broadcastEvent({ type: "AGENT_RUN_COMPLETED", data: runSummary });
    return runSummary;
  }
}
