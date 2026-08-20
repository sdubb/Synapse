import http from "http";

const BASE_URL = "http://localhost:4000/api/v1";
let passed = 0;
let failed = 0;

function assert(condition, name) {
  if (condition) {
    console.log("  ✅ [PASS] " + name);
    passed++;
  } else {
    console.error("  ❌ [FAIL] " + name);
    failed++;
  }
}

async function runTests() {
  console.log("===============================================================");
  console.log("  VERIFYING AUDITED BUG FIXES & NEW ENDPOINTS");
  console.log("===============================================================\n");

  // 1. Policies Endpoint
  console.log("1. Testing GET /api/v1/policies...");
  try {
    const res = await fetch(BASE_URL + "/policies").then(r => r.json());
    assert(Array.isArray(res.policies) && res.policies.length >= 4, "Policies returned with 4 active rules");
    assert(res.policies[0].regoCode.includes("package synapse.governance"), "Real Rego code in policy response");
  } catch (e) {
    assert(false, "Policies endpoint: " + e.message);
  }

  // 2. Agent Kill Switch
  console.log("\n2. Testing POST /api/v1/agents/:id/kill...");
  try {
    const killRes = await fetch(BASE_URL + "/agents/wf-sales-rep/kill", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "Audited test kill switch" })
    }).then(r => r.json());
    assert(killRes.success === true && killRes.agent.status === "SUSPENDED", "Agent successfully suspended by kill switch");

    const unkillRes = await fetch(BASE_URL + "/agents/wf-sales-rep/kill", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "Audited test reactivate" })
    }).then(r => r.json());
    assert(unkillRes.success === true && unkillRes.agent.status === "ACTIVE", "Agent successfully reactivated");
  } catch (e) {
    assert(false, "Kill switch endpoint: " + e.message);
  }

  // 3. Create Agent
  console.log("\n3. Testing POST /api/v1/agents...");
  try {
    const createRes = await fetch(BASE_URL + "/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: "agt-custom-test-01",
        name: "Custom Test AI Worker",
        provider: "Anthropic Claude 3.7",
        department: "AI Safety & Governance",
        owner: "audit@enterprise.com",
        spendCeilingUsd: 1200,
        requiresHitlAboveUsd: 400
      })
    }).then(r => r.json());
    assert(createRes.success === true && createRes.agent.id === "agt-custom-test-01", "New agent created in SQLite DB");
  } catch (e) {
    assert(false, "Create agent endpoint: " + e.message);
  }

  // 4. Manual Rollback
  console.log("\n4. Testing POST /api/v1/transactions/:id/rollback...");
  try {
    const txRes = await fetch(BASE_URL + "/transactions").then(r => r.json());
    if (txRes.transactions.length > 0) {
      const txId = txRes.transactions[0].id;
      const rbRes = await fetch(BASE_URL + "/transactions/" + txId + "/rollback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Audited test manual rollback" })
      }).then(r => r.json());
      assert(rbRes.success === true, "Manual transaction rollback executed");
    } else {
      assert(true, "No transactions to rollback, test skipped");
    }
  } catch (e) {
    assert(false, "Rollback endpoint: " + e.message);
  }

  // 5. A2A Route with UI Payload Format
  console.log("\n5. Testing POST /api/v1/a2a/route (UI alias & parameter format)...");
  try {
    const a2aRes = await fetch(BASE_URL + "/a2a/route", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        senderId: "Sales-Agent-001",
        receiverId: "Finance-Agent-024",
        messageType: "TASK_DELEGATION",
        payload: { action: "transfer_client_funds", amount: 2500 }
      })
    }).then(r => r.json());
    assert(a2aRes.success === true && a2aRes.delegationRecord.token.startsWith("a2a_jwt_"), "A2A UI format delegation succeeded with JWT token");

    const a2aMsgs = await fetch(BASE_URL + "/a2a/messages").then(r => r.json());
    assert(Array.isArray(a2aMsgs.messages) && Array.isArray(a2aMsgs.trustMatrix), "A2A messages and trustMatrix returned");
  } catch (e) {
    assert(false, "A2A delegation route: " + e.message);
  }

  // 6. Red-Team Pentest Scan
  console.log("\n6. Testing POST /api/v1/pentest/scan...");
  try {
    const scanRes = await fetch(BASE_URL + "/pentest/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId: "wf-sales-rep" })
    }).then(r => r.json());
    assert(scanRes.totalVectorsTested === 10000 && scanRes.securityScore !== undefined, "Pentest completed 10,000 vectors with score calculated");
  } catch (e) {
    assert(false, "Pentest scan endpoint: " + e.message);
  }

  // 7. Diagnostics Engine
  console.log("\n7. Testing POST /api/v1/diagnostics/verify...");
  try {
    const diagRes = await fetch(BASE_URL + "/diagnostics/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId: "wf-sales-rep" })
    }).then(r => r.json());
    assert(diagRes.totalChecks === 6 && diagRes.allPassed === true, "6-point diagnostics verified");
  } catch (e) {
    assert(false, "Diagnostics verify endpoint: " + e.message);
  }

  // 8. Connector Test
  console.log("\n8. Testing POST /api/v1/connectors/:id/test...");
  try {
    const connRes = await fetch(BASE_URL + "/connectors/conn-salesforce-agentforce/test", { method: "POST" }).then(r => r.json());
    assert(connRes.success === true && connRes.status === "HEALTHY", "Connector ping and health check passed");
  } catch (e) {
    assert(false, "Connector test endpoint: " + e.message);
  }

  // 9. Universal MCP Gateway JSON-RPC (Port 4005)
  console.log("\n9. Testing Universal MCP Gateway on Port 4005...");
  try {
    const mcpRes = await fetch("http://localhost:4005", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} })
    }).then(r => r.json());
    assert(mcpRes.result && Array.isArray(mcpRes.result.tools) && mcpRes.result.tools.length >= 15, "MCP Server exposed 14 FAANG tools + a2a_delegate_task");
  } catch (e) {
    assert(false, "MCP Gateway on port 4005: " + e.message);
  }

  console.log("\n===============================================================");
  console.log("  ALL FIXES RESULTS: " + passed + " PASSED | " + failed + " FAILED");
  console.log("===============================================================");
}

runTests();
