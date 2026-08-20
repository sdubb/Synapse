import crypto from "crypto";
import { productionDb } from "../storage/productionDb.js";
import { realSecretsVault } from "../secrets/realSecretsVault.js";

/**
 * Real Persistent Agent Identity Engine
 * 
 * Manages asymmetric RSA-2048 identity keypairs for enterprise agents:
 * - Generates cryptographically secure RSA keypairs
 * - Encrypts private keys at rest via AES-256-GCM (RealSecretsVault)
 * - Persists public keys, encrypted private keys, and SHA-256 fingerprints in SQLite
 * - Returns the identical, persistent keypair on repeat calls and across process restarts
 * - Signs payload directives and validates cryptographic signatures
 */
export class PersistentIdentityEngine {
  constructor() {
    this.tenantId = "synapse-core-identity";
  }

  /**
   * Retrieves an existing persisted identity or generates and saves a new RSA-2048 keypair
   */
  getOrCreateIdentity(agentId) {
    if (!agentId) throw new Error("agentId is required to retrieve or generate identity");

    // 1. Check SQLite for existing persisted identity
    const existing = productionDb.getAgentIdentity(agentId);
    if (existing) {
      const encryptedKeyObj = JSON.parse(existing.encrypted_private_key_json);
      const privateKeyPem = realSecretsVault.decrypt(encryptedKeyObj);

      return {
        agentId: existing.agent_id,
        publicKey: existing.public_key,
        privateKey: privateKeyPem,
        keyFingerprint: existing.key_fingerprint,
        createdAt: existing.created_at,
        isPersisted: true,
        source: "SQLITE_PERSISTED_KEYPAIR"
      };
    }

    // 2. Generate genuine RSA-2048 Keypair
    const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" }
    });

    const keyFingerprint = crypto.createHash("sha256").update(publicKey).digest("hex").substring(0, 16);

    // 3. Encrypt Private Key with AES-256-GCM
    const encryptedPrivateKey = realSecretsVault.encrypt(privateKey);

    // 4. Save to SQLite database
    productionDb.insertAgentIdentity(agentId, publicKey, encryptedPrivateKey, keyFingerprint);

    return {
      agentId,
      publicKey,
      privateKey,
      keyFingerprint,
      createdAt: new Date().toISOString(),
      isPersisted: true,
      source: "NEWLY_GENERATED_AND_PERSISTED"
    };
  }

  /**
   * Cryptographically signs a message/directive using the agent's private key
   */
  signDirective(agentId, directive) {
    const identity = this.getOrCreateIdentity(agentId);
    const sign = crypto.createSign("SHA256");
    sign.update(typeof directive === "string" ? directive : JSON.stringify(directive));
    sign.end();
    const signature = sign.sign(identity.privateKey, "hex");
    return {
      agentId,
      keyFingerprint: identity.keyFingerprint,
      signature,
      algorithm: "RSA-SHA256"
    };
  }

  /**
   * Cryptographically verifies a signature against the agent's public key
   */
  verifyDirectiveSignature(publicKeyPem, directive, signatureHex) {
    try {
      const verify = crypto.createVerify("SHA256");
      verify.update(typeof directive === "string" ? directive : JSON.stringify(directive));
      verify.end();
      return verify.verify(publicKeyPem, signatureHex, "hex");
    } catch (e) {
      return false;
    }
  }
}

export const identityEngine = new PersistentIdentityEngine();
