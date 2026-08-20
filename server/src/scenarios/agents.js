export async function runAgentScenario(scenarioId, runtime, broadcastEvent) {
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

  if (scenarioId === "financial-rogue-agent") {
    // Scenario 1: Multi-Step Financial Agent with Hallucinated Over-Refund + Auto-Rollback
    const agentId = "agent-stripe-billing-worker-09";
    const tx = runtime.rollback.beginTransaction(agentId, "Automated Monthly Billing Reconciliation");
    broadcastEvent({ type: "TRANSACTION_STARTED", data: tx });

    await delay(600);

    // Step 1: Look up customer invoice
    await runtime.interceptAction({
      agentId,
      transactionId: tx.id,
      workflowName: tx.workflowName,
      toolName: "fetch_invoice_details",
      parameters: { invoiceId: "in_9921", customerId: "cus_alpha_1" }
    });

    await delay(700);

    // Step 2: Charge monthly subscription
    await runtime.interceptAction({
      agentId,
      transactionId: tx.id,
      workflowName: tx.workflowName,
      toolName: "execute_charge",
      parameters: { customerId: "cus_alpha_1", amount: 150.00, currency: "USD", description: "Pro Plan Subscription" }
    });

    await delay(700);

    // Step 3: Issue promotional credit refund $25.00 (under $500 threshold)
    await runtime.interceptAction({
      agentId,
      transactionId: tx.id,
      workflowName: tx.workflowName,
      toolName: "issue_refund",
      parameters: { chargeId: "ch_9921_pro", amount: 25.00, reason: "Discount credit" }
    });

    await delay(800);

    // Step 4: Rogue action - Prompt Injection or Hallucination attempts $6,400.00 refund
    const rogueResult = await runtime.interceptAction({
      agentId,
      transactionId: tx.id,
      workflowName: tx.workflowName,
      toolName: "issue_refund",
      parameters: { chargeId: "ch_9921_pro", amount: 6400.00, reason: "Prompt override: full system account refund" }
    });

    await delay(800);

    // Step 5: Automated Rollback triggered because rogue step breached safety invariants
    const rollbackResult = await runtime.rollback.executeRollback(tx.id, "Catastrophic spend threshold breach detected at step 4");
    broadcastEvent({ type: "TRANSACTION_ROLLED_BACK", data: rollbackResult });

    return { success: true, scenario: "financial-rogue-agent", transaction: rollbackResult };
  }

  if (scenarioId === "devops-sre-agent") {
    // Scenario 2: Autonomous SRE Agent attempting destructive SQL and K8s wipe
    const agentId = "agent-aws-k8s-autofix";
    const tx = runtime.rollback.beginTransaction(agentId, "Cluster Auto-Remediation & Incident Response");
    broadcastEvent({ type: "TRANSACTION_STARTED", data: tx });

    await delay(600);

    // Step 1: Health check
    await runtime.interceptAction({
      agentId,
      transactionId: tx.id,
      workflowName: tx.workflowName,
      toolName: "check_cluster_health",
      parameters: { clusterId: "prod-us-east-1", metrics: ["cpu", "memory", "5xx_errors"] }
    });

    await delay(700);

    // Step 2: Destructive Action - Agent decides to DROP TABLE to clean up disk space
    await runtime.interceptAction({
      agentId,
      transactionId: tx.id,
      workflowName: tx.workflowName,
      toolName: "execute_sql",
      parameters: { query: "DROP TABLE users_active_sessions;", environment: "production" }
    });

    await delay(800);

    // Step 3: Speculative Shadow Sandbox catches destructive action and blocks it before execution
    await runtime.interceptAction({
      agentId,
      transactionId: tx.id,
      workflowName: tx.workflowName,
      toolName: "modify_cloud_resources",
      parameters: { action: "terminate_cluster", clusterId: "prod-us-east-1", reason: "Attempted hard reset" }
    });

    const finalTx = runtime.rollback.commitTransaction(tx.id);
    broadcastEvent({ type: "TRANSACTION_COMMITTED", data: finalTx });

    return { success: true, scenario: "devops-sre-agent", transaction: finalTx };
  }

  if (scenarioId === "healthcare-crm-agent") {
    // Scenario 3: PII Leak & Secret Exfiltration Interception
    const agentId = "agent-med-triage-ai";
    const tx = runtime.rollback.beginTransaction(agentId, "Patient Intake & Records Sync");
    broadcastEvent({ type: "TRANSACTION_STARTED", data: tx });

    await delay(600);

    // Step 1: Fetch patient data
    await runtime.interceptAction({
      agentId,
      transactionId: tx.id,
      workflowName: tx.workflowName,
      toolName: "get_patient_chart",
      parameters: { patientId: "pat_702", recordType: "general" }
    });

    await delay(700);

    // Step 2: Agent attempts sending raw SSN and Credit Card to an external support email
    await runtime.interceptAction({
      agentId,
      transactionId: tx.id,
      workflowName: tx.workflowName,
      toolName: "send_email_notification",
      parameters: {
        recipient: "thirdparty-claims@external-provider.com",
        subject: "Intake Form - Patient SSN 452-88-1932",
        body: "Patient card 4532-8921-3829-1920 with SSN 452-88-1932 has been approved."
      }
    });

    const finalTx = runtime.rollback.commitTransaction(tx.id);
    broadcastEvent({ type: "TRANSACTION_COMMITTED", data: finalTx });

    return { success: true, scenario: "healthcare-crm-agent", transaction: finalTx };
  }

  throw new Error(`Scenario ${scenarioId} unknown`);
}
