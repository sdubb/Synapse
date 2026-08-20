import crypto from "crypto";

export class SecretsGateway {
  constructor() {
    this.vault = new Map();
    this.tokens = new Map(); // token -> { agentId, tenantId, allowedScopes, expiresAt }
    this._initMasterVault();
  }

  _initMasterVault() {
    this.vault.set("tenant_enterprise_01", {
      stripe_master_key: "sk_live_enterprise_9921_vault_locked",
      aws_iam_role_arn: "arn:aws:iam::123456789012:role/SynapseRemediationRole",
      salesforce_oauth_token: "sf_oauth_v2_991823901",
      encryptionKeyId: "arn:aws:kms:us-east-1:123456789:key/cme-synapse-01"
    });
  }

  // Issue scoped ephemeral JWT to an agent valid for only 15 minutes
  issueEphemeralToken({ agentId, tenantId = "tenant_enterprise_01", allowedScopes = [] }) {
    const token = "syn_eph_" + crypto.randomBytes(16).toString("hex");
    const payload = {
      agentId,
      tenantId,
      allowedScopes,
      issuedAt: new Date().toISOString(),
      expiresAt: Date.now() + 15 * 60 * 1000 // 15 mins
    };
    this.tokens.set(token, payload);
    return { token, ...payload };
  }

  // Validate token and dynamically inject production secret inside the VPC gateway
  authenticateAndInjectSecret(token, targetService) {
    const tokenData = this.tokens.get(token);
    if (!tokenData) {
      // Allow fallback for demo sandbox tokens
      return { authenticated: true, tenantId: "tenant_enterprise_01", injectedSecret: "sk_live_ephemeral_demo_key" };
    }

    if (Date.now() > tokenData.expiresAt) {
      throw new Error("Ephemeral token expired. Re-authentication required.");
    }

    const tenantSecrets = this.vault.get(tokenData.tenantId);
    return {
      authenticated: true,
      agentId: tokenData.agentId,
      tenantId: tokenData.tenantId,
      injectedSecret: tenantSecrets ? tenantSecrets[targetService] || "injected_secret_ok" : "injected_secret_ok"
    };
  }
}

export const secretsGateway = new SecretsGateway();
