import { a2aMeshEngine } from "./server/src/a2a/googleA2AMesh.js";
import { DiagnosticsEngine } from "./server/src/core/diagnostics.js";
import { pentestEngine } from "./server/src/pentest/pentestEngine.js";
import { productionDb } from "./server/src/storage/productionDb.js";
import { dagRuntimeExecutor } from "./server/src/runtime/dagRuntimeExecutor.js";

async function runPhase2Verifications() {
  console.log("================================================================================");
  console.log("  ✦ PHASE 2 VERIFICATION SUITE: A2A JWT, DIAGNOSTICS, PENTEST, REGO DELETION");
  console.log("================================================================================\n");

  // --------------------------------------------------------------------------------
  // 1. A2A VERIFICATION: Real HMAC-SHA256 JWT & Tampering Rejection
  // --------------------------------------------------------------------------------
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("1. A2A PROTOCOL: REAL HMAC-SHA256 JWT GENERATION & TAMPERING REJECTION PROOF");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const legitimateToken = a2aMeshEngine.generateDelegationToken(
    "agent-sales-ae",
    "agent-finance-treasury",
    "Authorize Net-30 Invoice Generation for $75,000",
    { amount: 75000, department: "Sales" }
  );

  console.log("\n[A] Legitimate Generated HMAC-SHA256 JWT:");
  console.log(legitimateToken);

  const legitVerification = a2aMeshEngine.verifyDelegationToken(legitimateToken);
  console.log("\n[B] Verification Result for Legitimate Token:");
  console.log(JSON.stringify(legitVerification, null, 2));

  // Tamper with the token: alter 1 character in the payload segment
  const tokenParts = legitimateToken.split(".");
  const originalPayloadB64 = tokenParts[1];
  // Flip the last character of the payload segment
  const tamperedChar = originalPayloadB64.slice(-1) === "A" ? "B" : "A";
  const tamperedPayloadB64 = originalPayloadB64.slice(0, -1) + tamperedChar;
  const tamperedToken = `${tokenParts[0]}.${tamperedPayloadB64}.${tokenParts[2]}`;

  console.log("\n[C] Tampered JWT (Modified 1 Character in Payload):");
  console.log(tamperedToken);

  const tamperedVerification = a2aMeshEngine.verifyDelegationToken(tamperedToken);
  console.log("\n[D] Verification Result for Tampered Token:");
  console.log(JSON.stringify(tamperedVerification, null, 2));

  // Dynamic Trust Matrix
  console.log("\n[E] Dynamically Derived A2A Trust Matrix (First 3 entries):");
  const trustMatrix = a2aMeshEngine.getTrustMatrix();
  console.log(JSON.stringify(trustMatrix.slice(0, 3), null, 2));

  // --------------------------------------------------------------------------------
  // 2. DIAGNOSTICS VERIFICATION: Live Probes & Failure Reporting on Broken Dependency
  // --------------------------------------------------------------------------------
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("2. DIAGNOSTICS: LIVE PROBES & FAILURE REPORTING ON BROKEN DEPENDENCY");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const diagnosticsEngine = new DiagnosticsEngine(dagRuntimeExecutor, productionDb);

  console.log("\n[A] Live Diagnostics on Healthy System (All Live Probes):");
  const healthyDiag = await diagnosticsEngine.runFullDiagnostics("agent-sales-ae");
  console.log(JSON.stringify(healthyDiag, null, 2));

  console.log("\n[B] Live Diagnostics with Intentionally Broken SQLite Dependency:");
  // Create a broken mock store with non-functioning DB
  const brokenStore = {
    db: {
      prepare: () => {
        throw new Error("SQLITE_IOERR: disk I/O error / database file locked");
      }
    },
    getAgent: () => null,
    getPipeline: () => null
  };
  const brokenDiagEngine = new DiagnosticsEngine(dagRuntimeExecutor, brokenStore);
  const brokenDiag = await brokenDiagEngine.runFullDiagnostics("agent-sales-ae");
  console.log(JSON.stringify(brokenDiag, null, 2));

  // --------------------------------------------------------------------------------
  // 3. PENTEST VERIFICATION: 10 Verified Adversarial Attack Vectors
  // --------------------------------------------------------------------------------
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("3. PENTEST: 10 VERIFIED ADVERSARIAL ATTACK VECTORS RAW RUN");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const pentestReport = await pentestEngine.runFullPentest();
  console.log(JSON.stringify(pentestReport, null, 2));
}

runPhase2Verifications();
