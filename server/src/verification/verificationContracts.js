// Standardized Verification Contracts & Tier Definitions
export const VERIFICATION_TIERS = {
  // Tier 1: 100% Free, Zero Extra Tokens, Zero Subscriptions Required
  // Evaluates real physical ground truth via deterministic code in <1ms:
  // - SQLite database row states & balance mutations
  // - Filesystem SHA-256 byte hashes
  // - HTTP response status codes & JSON schema compliance
  // - Process exit codes & unit test execution
  TIER_1_DETERMINISTIC: "TIER_1_DETERMINISTIC_CODE",

  // Tier 2: Single Subscription / Single API Key (Default for Semantic Checks)
  // Uses the enterprise's existing single model/CLI key in an ephemeral, isolated 
  // read-only process/context with a specialized verifier prompt. No second paid tool needed.
  TIER_2_SINGLE_KEY_ISOLATED: "TIER_2_SINGLE_KEY_ISOLATED",

  // Tier 3: Multi-Model / Heterogeneous CLI (Optional Opt-In Only)
  // Only for enterprises that already maintain dual toolchains (e.g. Aider + Antigravity).
  TIER_3_MULTI_CLI_OPTIONAL: "TIER_3_MULTI_CLI_OPTIONAL"
};

export const CONTRACT_TYPES = {
  STATE_DIFF: "state_diff",           // Verifies real DB row changes before vs after
  HASH_MATCH: "hash_match",           // Computes SHA-256 ground truth of files/artifacts
  EXTERNAL_VERIFY: "external_verify", // Queries live read API (Slack history, Salesforce read, K8s status)
  IDEMPOTENCY_VERIFY: "idempotency_verify", // Verifies unique transaction idempotency keys
  SCHEMA_INVARIANT: "schema_invariant" // Verifies output matches strict typed JSON schema
};
