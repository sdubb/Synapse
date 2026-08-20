import { EnterpriseConnectorRegistry } from "./server/src/connectors/enterpriseConnectors.js";
import { realSecretsVault } from "./server/src/secrets/realSecretsVault.js";

async function verifyConnectorHonesty() {
  console.log("================================================================================");
  console.log("  ✦ CONNECTOR HEALTH CHECK HONESTY GAP PROOFS (3 SCENARIOS)");
  console.log("================================================================================\n");

  const registry = new EnterpriseConnectorRegistry();

  // Scenario 1: No credential stored
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("SCENARIO 1: NO CREDENTIAL IN VAULT (Amazon Bedrock)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const noCred = await registry.checkConnectorHealth("conn-amazon-bedrock");
  console.log(JSON.stringify(noCred, null, 2));

  // Scenario 2: Credential stored in vault, but NO live network call executed
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("SCENARIO 2: CREDENTIAL STORED IN VAULT (No Live Probe Run - Does NOT Claim isHealthy)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  realSecretsVault.storeEncryptedCredential("enterprise_tenant", "aws_bedrock_access_key", "AKIA_AWS_LIVE_BEDROCK_MOCK_KEY");
  const credStoredOnly = await registry.checkConnectorHealth("conn-amazon-bedrock", { attemptLiveProbe: false });
  console.log(JSON.stringify(credStoredOnly, null, 2));

  // Scenario 3: Credential stored + Real Outbound HTTPS Live Network Probe Executed
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("SCENARIO 3: CREDENTIAL STORED + REAL OUTBOUND HTTPS LIVE NETWORK PROBE");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const liveProbe = await registry.checkConnectorHealth("conn-amazon-bedrock", { attemptLiveProbe: true });
  console.log(JSON.stringify(liveProbe, null, 2));
}

verifyConnectorHonesty();
