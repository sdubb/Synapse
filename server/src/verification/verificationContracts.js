// Standardized Verification Contracts & Tier Definitions
export const VERIFICATION_TIERS = {
  TIER_1_CODE: "TIER_1_DETERMINISTIC_CODE", // Free, instant code evaluation (DB diff, file hash, status code)
  TIER_2_LLM_QA: "TIER_2_LLM_RECOVERY_QA"  // Low-token batched reasoning & recovery controller
};

export const CONTRACT_TYPES = {
  STATE_DIFF: "state_diff",           // Verifies real DB row changes before vs after
  HASH_MATCH: "hash_match",           // Computes SHA-256 ground truth of files/artifacts
  EXTERNAL_VERIFY: "external_verify", // Queries live read API (Slack history, Salesforce read, K8s status)
  IDEMPOTENCY_VERIFY: "idempotency_verify" // Verifies unique transaction idempotency keys
};
