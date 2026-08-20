import fs from "fs";
import path from "path";
import { identityEngine } from "./server/src/identity/identityEngine.js";
import { rollbackEngine } from "./server/src/core/rollback.js";
import { sandboxedEnvironmentEngine } from "./server/src/runtime/sandboxedEnvironmentEngine.js";
import { seedFullEnterpriseDemoData } from "./server/src/storage/seedDemoData.js";
import { productionDb } from "./server/src/storage/productionDb.js";

async function runPhase3aVerifications() {
  console.log("================================================================================");
  console.log("  ✦ PHASE 3a VERIFICATION SUITE: SEED GUARD, PERSISTENT IDENTITY, REAL ROLLBACK");
  console.log("================================================================================\n");

  // --------------------------------------------------------------------------------
  // 1. SEED DEMO DATA PRODUCTION GUARD TEST
  // --------------------------------------------------------------------------------
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("1. SEED DEMO DATA PRODUCTION GUARD VERIFICATION");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";

  let guardBlocked = false;
  let guardError = "";
  try {
    seedFullEnterpriseDemoData();
  } catch (err) {
    guardBlocked = true;
    guardError = err.message;
  }
  process.env.NODE_ENV = originalEnv;

  console.log("[A] Result when process.env.NODE_ENV === 'production':");
  console.log({
    guardTriggered: guardBlocked,
    thrownError: guardError,
    status: guardBlocked ? "PASSED (Production Seeding Refused)" : "FAILED"
  });

  // --------------------------------------------------------------------------------
  // 2. PERSISTENT RSA IDENTITY KEYPAIR & RESTART VERIFICATION
  // --------------------------------------------------------------------------------
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("2. PERSISTENT RSA IDENTITY ENGINE & RESTART VERIFICATION");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const testAgentId = "agent-test-identity-" + Date.now();

  // Call 1: Generate & persist keypair
  const idCall1 = identityEngine.getOrCreateIdentity(testAgentId);
  console.log("[A] First Call (Generate & Persist Keypair):");
  console.log({
    agentId: idCall1.agentId,
    source: idCall1.source,
    keyFingerprint: idCall1.keyFingerprint,
    publicKeySnippet: idCall1.publicKey.split("\n").slice(0, 3).join("\n") + "\n..."
  });

  // Call 2: Retrieve same keypair in same runtime
  const idCall2 = identityEngine.getOrCreateIdentity(testAgentId);
  console.log("\n[B] Second Call (Same Runtime In-Memory / SQLite Query):");
  console.log({
    agentId: idCall2.agentId,
    source: idCall2.source,
    keyFingerprint: idCall2.keyFingerprint,
    keysMatch: idCall1.publicKey === idCall2.publicKey
  });

  // Verify SQLite row directly to prove database persistence
  const dbRow = productionDb.getAgentIdentity(testAgentId);
  console.log("\n[C] Direct SQLite Row Inspection (Encrypted Private Key & Public Key):");
  console.log({
    agent_id: dbRow.agent_id,
    key_fingerprint: dbRow.key_fingerprint,
    public_key_matches: dbRow.public_key === idCall1.publicKey,
    encrypted_private_key_present: !!dbRow.encrypted_private_key_json
  });

  // Test Signing & Cryptographic Signature Verification
  const testMessage = "Authorize $50,000 disbursement under DAG Step 4";
  const signatureObj = identityEngine.signDirective(testAgentId, testMessage);
  const isValidSig = identityEngine.verifyDirectiveSignature(idCall2.publicKey, testMessage, signatureObj.signature);
  const isInvalidSig = identityEngine.verifyDirectiveSignature(idCall2.publicKey, "Tampered Message", signatureObj.signature);

  console.log("\n[D] Cryptographic Signing & Verification:");
  console.log({
    message: testMessage,
    signatureSnippet: signatureObj.signature.substring(0, 32) + "...",
    verifiedWithLegitimateMessage: isValidSig,
    rejectedWithTamperedMessage: !isInvalidSig
  });

  // --------------------------------------------------------------------------------
  // 3. REAL PHYSICAL TRANSACTION ROLLBACK (FILE SYSTEM SIDE EFFECT REVERSED)
  // --------------------------------------------------------------------------------
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("3. REAL ROLLBACK EXECUTION & PHYSICAL DISK REVERSAL PROOF");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const testTxId = "tx_rollback_test_" + Date.now();
  const testSessionId = "session_rollback_" + Date.now();
  const testFileName = "uncommitted_financial_report.csv";
  const fileContent = "id,customer,amount\n101,AcmeCorp,75000\n102,Cyberdyne,120000";

  console.log("• Step 1: Writing real sandboxed file to disk...");
  const writeResult = sandboxedEnvironmentEngine.writeSandboxedFile(testSessionId, testFileName, fileContent);
  const absoluteFilePath = writeResult.filePath;

  const fileExistsBeforeRollback = fs.existsSync(absoluteFilePath);
  console.log(`[A] File state BEFORE rollback:`);
  console.log({
    filePath: absoluteFilePath,
    diskExists: fileExistsBeforeRollback,
    bytesWritten: fs.readFileSync(absoluteFilePath).length
  });

  console.log("\n• Step 2: Recording forward action and deterministic inverse to SQLite rollback journal...");
  rollbackEngine.recordStep(testTxId, 1, "write_sandboxed_file", {
    sessionId: testSessionId,
    relativePath: testFileName,
    absolutePath: absoluteFilePath
  }, { filePath: testFileName, absolutePath: absoluteFilePath });

  console.log("\n• Step 3: Executing Rollback Engine on transaction...");
  const rollbackOutcome = await rollbackEngine.executeRollback(testTxId);
  console.log("[B] Rollback Execution Report:");
  console.log(JSON.stringify(rollbackOutcome, null, 2));

  const fileExistsAfterRollback = fs.existsSync(absoluteFilePath);
  console.log(`\n[C] Physical Disk State AFTER rollback (Verified fs.existsSync):`);
  console.log({
    filePath: absoluteFilePath,
    diskExists: fileExistsAfterRollback,
    reversalConfirmed: !fileExistsAfterRollback
  });
}

runPhase3aVerifications();
