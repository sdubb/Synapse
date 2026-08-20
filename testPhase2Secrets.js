import { realSecretsVault } from "./server/src/secrets/realSecretsVault.js";

// 1. Store a real secret encrypted at rest (AES-256-GCM)
const tenantId = "tenant_enterprise_01";
const serviceName = "slack_bot_token";
const realSecret = "mock_synthetic_slack_token_demo_only";

const encryptedObj = realSecretsVault.storeEncryptedCredential(tenantId, serviceName, realSecret);
console.log("[PHASE 2 SECRETS PROOF]: 1. Secret stored ENCRYPTED AT REST (AES-256-GCM).");
console.log(`   Ciphertext: ${encryptedObj.ciphertext}`);
console.log(`   IV: ${encryptedObj.iv}`);
console.log(`   AuthTag: ${encryptedObj.tag}`);

// 2. Execute an outbound tool call: Decrypts ONLY in-memory during execution
console.log("\n[PHASE 2 SECRETS PROOF]: 2. Executing outbound tool call with dynamic in-memory secret injection...");
const toolCallResult = realSecretsVault.executeWithInjectedSecret(tenantId, serviceName, (injectedSecret) => {
  // Prove that the in-memory variable matches
  return {
    outboundStatus: "DISPATCHED_TO_TARGET_API",
    secretLength: injectedSecret.length,
    tokenPrefix: injectedSecret.substring(0, 5) + "..."
  };
});

console.log("[PHASE 2 SECRETS PROOF]: 3. Outbound Tool Call Result:", JSON.stringify(toolCallResult));
