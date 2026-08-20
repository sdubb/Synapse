import { sandboxTools } from "./server/src/tools/sandboxTools.js";
import { EnterpriseConnectorRegistry } from "./server/src/connectors/enterpriseConnectors.js";
import { realSecretsVault } from "./server/src/secrets/realSecretsVault.js";
import { productionDb } from "./server/src/storage/productionDb.js";

async function runPhase3bVerifications() {
  console.log("================================================================================");
  console.log("  ✦ PHASE 3b VERIFICATION SUITE: SQLITE SANDBOX TOOLS, HONEST CONNECTORS");
  console.log("================================================================================\n");

  // --------------------------------------------------------------------------------
  // 1. SANDBOX TOOLS: REAL SQLITE QUERIES & MUTATIONS (NO IN-MEMORY ARRAYS)
  // --------------------------------------------------------------------------------
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("1. SANDBOX TOOLS: REAL SQLITE SELECT & MUTATION VERIFICATION");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  console.log("• Query 1: Selecting user 'usr_101' from SQLite demo_users table...");
  const res1 = await sandboxTools.executeTool("query_database", {
    table: "demo_users",
    filter: { id: "usr_101" }
  });
  console.log("[A] Query 1 Result (from SQLite):");
  console.log(JSON.stringify(res1, null, 2));

  console.log("\n• Query 2: Selecting user 'usr_101' again from SQLite demo_users table...");
  const res2 = await sandboxTools.executeTool("query_database", {
    table: "demo_users",
    filter: { id: "usr_101" }
  });
  console.log("[B] Query 2 Result (from SQLite):");
  console.log(JSON.stringify(res2, null, 2));

  const identicalRows = JSON.stringify(res1.data) === JSON.stringify(res2.data);
  console.log(`\n• Queries identical and from SQLite: ${identicalRows} (SQL: '${res1.queryExecuted}')`);

  console.log("\n• Mutation Test: Updating balance of 'usr_101' in SQLite demo_users...");
  const newBalance = 775.50;
  const mutateRes = await sandboxTools.executeTool("mutate_database", {
    table: "demo_users",
    action: "update",
    record: { id: "usr_101", balance: newBalance }
  });
  console.log("[C] Mutation Result:");
  console.log(JSON.stringify(mutateRes, null, 2));

  // Query back to prove SQLite updated
  const verifyRes = await sandboxTools.executeTool("query_database", {
    table: "demo_users",
    filter: { id: "usr_101" }
  });
  console.log("\n[D] Query After Mutation (Verifying updated balance in SQLite):");
  console.log(JSON.stringify(verifyRes.data[0], null, 2));

  // --------------------------------------------------------------------------------
  // 2. ENTERPRISE CONNECTORS: HONEST 'NOT_CONFIGURED' & HEALTH PROBE
  // --------------------------------------------------------------------------------
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("2. ENTERPRISE CONNECTORS: HONEST NOT_CONFIGURED & HEALTH PROBE VERIFICATION");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const connectorRegistry = new EnterpriseConnectorRegistry();

  console.log("[A] Connector Statuses (Default with no credentials in Vault):");
  const allConnectors = connectorRegistry.getConnectors();
  allConnectors.forEach(c => {
    console.log(`  • ${c.name.padEnd(45)} -> Status: [${c.status}] (Key: ${c.credentialKey})`);
  });

  console.log("\n[B] Health Check on Unconfigured Connector (Salesforce):");
  const unconfiguredHealth = await connectorRegistry.checkConnectorHealth("conn-salesforce-agentforce");
  console.log(JSON.stringify(unconfiguredHealth, null, 2));

  console.log("\n• Storing authentic credential in RealSecretsVault (AES-256-GCM encrypted)...");
  realSecretsVault.storeEncryptedCredential("enterprise_tenant", "salesforce_oauth_token", "Bearer 00D5g00000XyZ1!AQEAQO2...");

  console.log("\n[C] Health Check AFTER Storing Credential in Vault (Salesforce):");
  const configuredHealth = await connectorRegistry.checkConnectorHealth("conn-salesforce-agentforce");
  console.log(JSON.stringify(configuredHealth, null, 2));
}

runPhase3bVerifications();
