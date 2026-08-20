import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { performance } from "perf_hooks";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SANDBOX_ROOT = path.resolve(__dirname, "../../data/sandbox_workspaces");

/**
 * Real Sandboxed Environment Engine
 * 
 * Executes genuine local OS operations in isolated sandbox workspaces:
 * - Real filesystem I/O with SHA-256 integrity verification
 * - Real child process execution with OS PID, stdout/stderr capture, and exit codes
 * - True wall-clock execution latency measurement
 */
export class SandboxedEnvironmentEngine {
  constructor() {
    if (!fs.existsSync(SANDBOX_ROOT)) {
      fs.mkdirSync(SANDBOX_ROOT, { recursive: true });
    }
  }

  /**
   * Initializes a dedicated workspace directory for a pipeline run
   */
  createSessionWorkspace(sessionId) {
    const sessionDir = path.resolve(SANDBOX_ROOT, sessionId);
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }
    return sessionDir;
  }

  /**
   * Writes a real file to the sandboxed workspace and computes its SHA-256 hash
   */
  writeSandboxedFile(sessionId, filename, content) {
    const workspace = this.createSessionWorkspace(sessionId);
    const filePath = path.resolve(workspace, filename);

    // Prevent directory traversal
    if (!filePath.startsWith(workspace)) {
      throw new Error(`Security Violation: File path ${filePath} escapes sandbox workspace.`);
    }

    const start = performance.now();
    const strContent = typeof content === "string" ? content : JSON.stringify(content, null, 2);
    fs.writeFileSync(filePath, strContent, "utf-8");

    const stat = fs.statSync(filePath);
    const fileBytes = fs.readFileSync(filePath);
    const sha256 = crypto.createHash("sha256").update(fileBytes).digest("hex");
    const latencyMs = Number((performance.now() - start).toFixed(2));

    return {
      filePath,
      filename,
      sizeBytes: stat.size,
      sha256,
      writtenAt: new Date().toISOString(),
      latencyMs
    };
  }

  /**
   * Reads a real file from the sandboxed workspace
   */
  readSandboxedFile(sessionId, filename) {
    const workspace = this.createSessionWorkspace(sessionId);
    const filePath = path.resolve(workspace, filename);

    if (!fs.existsSync(filePath)) {
      return { exists: false, error: `File not found: ${filename}` };
    }

    const fileBytes = fs.readFileSync(filePath);
    const sha256 = crypto.createHash("sha256").update(fileBytes).digest("hex");

    return {
      exists: true,
      filePath,
      filename,
      sizeBytes: fileBytes.length,
      sha256,
      content: fileBytes.toString("utf-8")
    };
  }

  /**
   * Spawns a real OS child process and captures execution metrics
   */
  async executeSubprocess(command, args = [], options = {}) {
    const start = performance.now();

    return new Promise((resolve, reject) => {
      let child;
      try {
        child = spawn(command, args, {
          shell: true,
          cwd: options.cwd || process.cwd(),
          timeout: options.timeoutMs || 10000
        });
      } catch (err) {
        return reject(err);
      }

      const pid = child.pid;
      let stdout = "";
      let stderr = "";

      child.stdout?.on("data", (d) => { stdout += d.toString(); });
      child.stderr?.on("data", (d) => { stderr += d.toString(); });

      child.on("error", (err) => {
        const latencyMs = Number((performance.now() - start).toFixed(2));
        resolve({
          pid,
          command: `${command} ${args.join(" ")}`,
          exitCode: -1,
          stdout,
          stderr: err.message,
          latencyMs,
          success: false
        });
      });

      child.on("close", (exitCode) => {
        const latencyMs = Number((performance.now() - start).toFixed(2));
        resolve({
          pid,
          command: `${command} ${args.join(" ")}`,
          exitCode: exitCode || 0,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          latencyMs,
          success: exitCode === 0
        });
      });
    });
  }

  /**
   * Cleans up a session workspace
   */
  cleanupWorkspace(sessionId) {
    const sessionDir = path.resolve(SANDBOX_ROOT, sessionId);
    if (fs.existsSync(sessionDir)) {
      fs.rmSync(sessionDir, { recursive: true, force: true });
    }
  }
}

export const sandboxedEnvironmentEngine = new SandboxedEnvironmentEngine();
