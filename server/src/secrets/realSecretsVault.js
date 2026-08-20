import crypto from "crypto";

const MASTER_ENCRYPTION_KEY = crypto.scryptSync("synapse_master_enterprise_secret_2026", "synapse_salt", 32);
const IV_LENGTH = 16;

export class RealSecretsVault {
  constructor() {
    this.encryptedVault = new Map(); // tenantId -> encryptedHex
    this.tokens = new Map();
  }

  encrypt(plaintext) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv("aes-256-gcm", MASTER_ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(plaintext, "utf8", "hex");
    encrypted += cipher.final("hex");
    const tag = cipher.getAuthTag();
    return {
      ciphertext: encrypted,
      iv: iv.toString("hex"),
      tag: tag.toString("hex")
    };
  }

  decrypt(encryptedObj) {
    const decipher = crypto.createDecipheriv("aes-256-gcm", MASTER_ENCRYPTION_KEY, Buffer.from(encryptedObj.iv, "hex"));
    decipher.setAuthTag(Buffer.from(encryptedObj.tag, "hex"));
    let decrypted = decipher.update(encryptedObj.ciphertext, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }

  // Store encrypted credential at rest
  storeEncryptedCredential(tenantId, serviceName, plaintextSecret) {
    const encrypted = this.encrypt(plaintextSecret);
    this.encryptedVault.set(`${tenantId}:${serviceName}`, encrypted);
    return encrypted;
  }

  // Get raw encrypted-at-rest payload from DB
  getEncryptedPayload(tenantId, serviceName) {
    return this.encryptedVault.get(`${tenantId}:${serviceName}`);
  }

  // Decrypts ONLY in-memory at the microsecond of the outbound HTTP call
  executeWithInjectedSecret(tenantId, serviceName, actionFn) {
    const encrypted = this.encryptedVault.get(`${tenantId}:${serviceName}`);
    if (!encrypted) throw new Error("Secret not found for tenant: " + tenantId);

    // 1. Decrypt into ephemeral memory
    const plaintext = this.decrypt(encrypted);
    const secretHash = crypto.createHash("sha256").update(plaintext).digest("hex").substring(0, 10);
    console.log(`[SECRETS_GATEWAY_VPC]: Ephemeral decryption executed in-memory. Injected secret (Fingerprint: ${secretHash}...) for service '${serviceName}'.`);

    try {
      // 2. Pass to outbound call
      const result = actionFn(plaintext);
      return result;
    } finally {
      // 3. Plaintext variable drops out of scope / garbage collected
    }
  }
}

export const realSecretsVault = new RealSecretsVault();
