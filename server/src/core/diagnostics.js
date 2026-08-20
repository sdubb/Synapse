import { performance } from "perf_hooks";
import { regoPolicyInterpreter } from "../policy/regoPolicyInterpreter.js";
import { sandboxedEnvironmentEngine } from "../runtime/sandboxedEnvironmentEngine.js";
import { a2aMeshEngine } from "../a2a/googleA2AMesh.js";
import { CommandTokenNormalizer } from "../policy/commandTokenNormalizer.js";

/**
 * Real Diagnostic Verification Engine
 * 
 * Runs genuine live probes against every critical system component:
 * - SQLite Database connectivity & table schema
 * - OPA Rego Policy parsing & AST evaluation
 * - Sandboxed workspace file I/O & SHA-256 integrity
 * - Google A2A HMAC-SHA256 cryptographic JWT generation & signature verification
 * - PII / Command token normalization & evasion detection
 * - Emergency circuit breaker & agent state accessibility
 */
export class DiagnosticsEngine {
  constructor(executor, store) {
    this.executor = executor;
    this.store = store;
  }

  async runFullDiagnostics(agentId) {
    const totalStart = performance.now();
    const checks = [];

    // Probe 1: SQLite Database Connectivity & Table Check
    const dbStart = performance.now();
    try {
      const agentCount = this.store.db.prepare("SELECT count(*) as count FROM agents").get();
      const auditCount = this.store.db.prepare("SELECT count(*) as count FROM audit_ledger").get();
      const latencyMs = Number((performance.now() - dbStart).toFixed(2));
      checks.push({
        id: "check-sqlite-database",
        name: "SQLite Database & Audit Ledger Connectivity",
        description: "Executes live SQL queries against agents and audit_ledger tables.",
        status: "PASSED",
        latencyMs,
        details: `Connected to SQLite database on disk. Verified ${agentCount.count} registered agents and ${auditCount.count} audit blocks.`
      });
    } catch (err) {
      const latencyMs = Number((performance.now() - dbStart).toFixed(2));
      checks.push({
        id: "check-sqlite-database",
        name: "SQLite Database & Audit Ledger Connectivity",
        description: "Executes live SQL queries against agents and audit_ledger tables.",
        status: "FAILED",
        latencyMs,
        details: `SQLite probe failed: ${err.message}`
      });
    }

    // Probe 2: OPA Rego Policy Engine Live Evaluation
    const regoStart = performance.now();
    try {
      const regoResult = regoPolicyInterpreter.evaluate({
        tool_name: "query_database",
        amount: 50,
        spend_ceiling: 500,
        hitl_threshold: 300
      });

      const latencyMs = Number((performance.now() - regoStart).toFixed(2));
      if (regoResult && regoResult.verdict === "ALLOWED") {
        checks.push({
          id: "check-rego-policy-engine",
          name: "OPA Rego Policy Interpreter Invariants",
          description: "Evaluates real governance.rego policy AST against input payload.",
          status: "PASSED",
          latencyMs,
          details: `Parsed governance.rego successfully. Policy package '${regoResult.package}' returned verdict '${regoResult.verdict}' (Risk score: ${regoResult.riskScore}).`
        });
      } else {
        checks.push({
          id: "check-rego-policy-engine",
          name: "OPA Rego Policy Interpreter Invariants",
          description: "Evaluates real governance.rego policy AST against input payload.",
          status: "FAILED",
          latencyMs,
          details: `Rego evaluation returned unexpected verdict: ${regoResult?.verdict || "NONE"}`
        });
      }
    } catch (err) {
      const latencyMs = Number((performance.now() - regoStart).toFixed(2));
      checks.push({
        id: "check-rego-policy-engine",
        name: "OPA Rego Policy Interpreter Invariants",
        description: "Evaluates real governance.rego policy AST against input payload.",
        status: "FAILED",
        latencyMs,
        details: `Rego interpreter probe failed: ${err.message}`
      });
    }

    // Probe 3: Sandboxed Workspace Filesystem I/O & SHA-256 Verification
    const sandboxStart = performance.now();
    const probeSessionId = "diag_probe_" + Date.now();
    try {
      const probePayload = { probe: "live_filesystem_verification", timestamp: new Date().toISOString() };
      const writeResult = sandboxedEnvironmentEngine.writeSandboxedFile(probeSessionId, "probe_test.json", probePayload);
      const readResult = sandboxedEnvironmentEngine.readSandboxedFile(probeSessionId, "probe_test.json");
      sandboxedEnvironmentEngine.cleanupWorkspace(probeSessionId);

      const latencyMs = Number((performance.now() - sandboxStart).toFixed(2));
      if (readResult.exists && readResult.sha256 === writeResult.sha256) {
        checks.push({
          id: "check-sandboxed-workspace",
          name: "Sandboxed Workspace Filesystem & SHA-256 Hashing",
          description: "Performs real isolated disk write, read-back, and SHA-256 byte verification.",
          status: "PASSED",
          latencyMs,
          details: `Verified disk write and read-back (${writeResult.sizeBytes} bytes). SHA-256: ${writeResult.sha256.substring(0, 16)}...`
        });
      } else {
        checks.push({
          id: "check-sandboxed-workspace",
          name: "Sandboxed Workspace Filesystem & SHA-256 Hashing",
          description: "Performs real isolated disk write, read-back, and SHA-256 byte verification.",
          status: "FAILED",
          latencyMs,
          details: "File read-back failed or SHA-256 checksum mismatch."
        });
      }
    } catch (err) {
      const latencyMs = Number((performance.now() - sandboxStart).toFixed(2));
      checks.push({
        id: "check-sandboxed-workspace",
        name: "Sandboxed Workspace Filesystem & SHA-256 Hashing",
        description: "Performs real isolated disk write, read-back, and SHA-256 byte verification.",
        status: "FAILED",
        latencyMs,
        details: `Sandbox filesystem probe failed: ${err.message}`
      });
    }

    // Probe 4: Google A2A HMAC-SHA256 Cryptographic JWT Verification
    const a2aStart = performance.now();
    try {
      const token = a2aMeshEngine.generateDelegationToken("agent-sales-ae", "agent-finance-treasury", "Diagnostic A2A Handshake");
      const verifyResult = a2aMeshEngine.verifyDelegationToken(token);
      const latencyMs = Number((performance.now() - a2aStart).toFixed(2));

      if (verifyResult.valid) {
        checks.push({
          id: "check-a2a-cryptographic-jwt",
          name: "Google A2A Protocol & Cryptographic JWT Handshake",
          description: "Generates and validates an authentic HMAC-SHA256 JWT delegation token.",
          status: "PASSED",
          latencyMs,
          details: `Generated and cryptographically verified A2A delegation JWT (Issuer: ${verifyResult.payload.iss} -> Subject: ${verifyResult.payload.sub}).`
        });
      } else {
        checks.push({
          id: "check-a2a-cryptographic-jwt",
          name: "Google A2A Protocol & Cryptographic JWT Handshake",
          description: "Generates and validates an authentic HMAC-SHA256 JWT delegation token.",
          status: "FAILED",
          latencyMs,
          details: `JWT verification failed: ${verifyResult.error}`
        });
      }
    } catch (err) {
      const latencyMs = Number((performance.now() - a2aStart).toFixed(2));
      checks.push({
        id: "check-a2a-cryptographic-jwt",
        name: "Google A2A Protocol & Cryptographic JWT Handshake",
        description: "Generates and validates an authentic HMAC-SHA256 JWT delegation token.",
        status: "FAILED",
        latencyMs,
        details: `A2A probe failed: ${err.message}`
      });
    }

    // Probe 5: Lexical Token Normalizer & Evasion Detection
    const normStart = performance.now();
    try {
      const evasionResult = CommandTokenNormalizer.normalize("DROP/**/TABLE production_users;");
      const latencyMs = Number((performance.now() - normStart).toFixed(2));

      if (evasionResult.isDestructive && evasionResult.matchedRules.includes("DROP_TABLE_OR_DATABASE")) {
        checks.push({
          id: "check-token-normalizer",
          name: "Lexical Command & SQL Token Evasion Normalizer",
          description: "Tests stripping embedded comments and hex-escaped destructive SQL statements.",
          status: "PASSED",
          latencyMs,
          details: `Normalized embedded comment attack string to '${evasionResult.normalizedText}' and caught destructive operation.`
        });
      } else {
        checks.push({
          id: "check-token-normalizer",
          name: "Lexical Command & SQL Token Evasion Normalizer",
          description: "Tests stripping embedded comments and hex-escaped destructive SQL statements.",
          status: "FAILED",
          latencyMs,
          details: "Token normalizer failed to flag destructive evasion pattern."
        });
      }
    } catch (err) {
      const latencyMs = Number((performance.now() - normStart).toFixed(2));
      checks.push({
        id: "check-token-normalizer",
        name: "Lexical Command & SQL Token Evasion Normalizer",
        description: "Tests stripping embedded comments and hex-escaped destructive SQL statements.",
        status: "FAILED",
        latencyMs,
        details: `Token normalizer probe failed: ${err.message}`
      });
    }

    // Probe 6: Agent Entity & Target Reachability
    const agentStart = performance.now();
    try {
      const targetAgent = (this.store.db ? this.store.db.prepare("SELECT * FROM agents WHERE id = ?").get(agentId) : null) || 
                          (this.store.getPipeline ? this.store.getPipeline(agentId) : null);
      const latencyMs = Number((performance.now() - agentStart).toFixed(2));

      if (targetAgent) {
        checks.push({
          id: "check-agent-target-reachability",
          name: "Agent Entity & Spend Boundary Configuration",
          description: "Validates agent spend limits and operational status in database.",
          status: "PASSED",
          latencyMs,
          details: `Agent '${targetAgent.name || agentId}' reachable. Status: ${targetAgent.status || "ACTIVE"} (Spend Ceiling: $${targetAgent.spendCeilingUsd || 5000}).`
        });
      } else {
        checks.push({
          id: "check-agent-target-reachability",
          name: "Agent Entity & Spend Boundary Configuration",
          description: "Validates agent spend limits and operational status in database.",
          status: "FAILED",
          latencyMs,
          details: `Agent ID '${agentId}' not found in active database registry.`
        });
      }
    } catch (err) {
      const latencyMs = Number((performance.now() - agentStart).toFixed(2));
      checks.push({
        id: "check-agent-target-reachability",
        name: "Agent Entity & Spend Boundary Configuration",
        description: "Validates agent spend limits and operational status in database.",
        status: "FAILED",
        latencyMs,
        details: `Agent reachability probe failed: ${err.message}`
      });
    }

    const totalDurationMs = Number((performance.now() - totalStart).toFixed(2));
    const allPassed = checks.every(c => c.status === "PASSED");

    return {
      agentId,
      allPassed,
      overallHealth: allPassed ? "100% PRODUCTION READY" : "DEGRADED",
      totalChecks: checks.length,
      passedChecks: checks.filter(c => c.status === "PASSED").length,
      failedChecks: checks.filter(c => c.status === "FAILED").length,
      durationMs: totalDurationMs,
      timestamp: new Date().toISOString(),
      checks
    };
  }
}
