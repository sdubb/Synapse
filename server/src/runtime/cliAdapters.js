/**
 * CLI Adapters for Multi-CLI Layer 2 Native Capability Configuration
 * 
 * Maps installed CLI binaries to their native flags for:
 * 1. Headless / Single-shot mode
 * 2. Native Read-Only / Plan mode (to prevent native filesystem/code edits)
 * 3. Structured JSON output mode
 * 4. MCP support
 */
export const CLI_ADAPTERS = {
  // 1. Google Antigravity CLI (agy.exe) - Confirmed Installed (1.1.16)
  agy: {
    id: "agy",
    name: "Google Antigravity CLI",
    binaryPath: "C:\\Users\\lenovo\\AppData\\Local\\agy\\bin\\agy.exe",
    isInstalled: true,
    supportsMcp: true,
    headlessFlag: "--print",
    readOnlyFlag: "--mode plan", // Native plan-only mode: disables native file edits
    structuredOutputFlag: "--output-format json",
    verifierSupported: true,
    unsupportedReason: null
  },

  // 2. Extensible Slots for Future CLIs (Declared honestly with discovery status)
  claude_code: {
    id: "claude_code",
    name: "Claude Code CLI",
    binaryPath: "claude",
    isInstalled: false,
    supportsMcp: true,
    headlessFlag: null,
    readOnlyFlag: null,
    structuredOutputFlag: null,
    verifierSupported: false,
    unsupportedReason: "CLI not installed in environment; flags pending discovery pass."
  },

  aider: {
    id: "aider",
    name: "Aider Coding Assistant",
    binaryPath: "aider",
    isInstalled: false,
    supportsMcp: false,
    headlessFlag: "--message",
    readOnlyFlag: "--read", // Read-only files flag
    structuredOutputFlag: null,
    verifierSupported: false,
    unsupportedReason: "CLI not installed in environment (verified CommandNotFoundException)."
  }
};

/**
 * Validates whether a CLI can be safely spawned for the requested role
 */
export function validateCliForRole(cliId, role) {
  const adapter = CLI_ADAPTERS[cliId];
  if (!adapter) {
    return {
      allowed: false,
      reason: `Unknown CLI adapter '${cliId}'.`
    };
  }

  if (!adapter.isInstalled) {
    return {
      allowed: false,
      reason: `CLI '${adapter.name}' is not installed: ${adapter.unsupportedReason}`
    };
  }

  if (role === "VERIFIER") {
    if (!adapter.readOnlyFlag || !adapter.verifierSupported) {
      return {
        allowed: false,
        reason: `SECURITY_REJECT: CLI '${adapter.name}' does not support a verified native read-only flag. Refusing to spawn as VERIFIER without structural read-only guarantee.`
      };
    }
  }

  return {
    allowed: true,
    adapter
  };
}
