import http from "http";
import { productionDb } from "../storage/productionDb.js";
import { realSecretsVault } from "../secrets/realSecretsVault.js";

// Dispatches real Slack Block-Kit notifications with interactive 2FA approval links
export class SlackBlockKitDispatcher {
  constructor() {
    this.webhookUrl = process.env.SLACK_WEBHOOK_URL || null;
  }

  setWebhookUrl(url) {
    this.webhookUrl = url;
    realSecretsVault.storeEncryptedCredential("global", "slack_webhook_url", url);
    console.log("[SLACK_GATEWAY]: Slack Webhook URL saved & encrypted at rest (AES-256-GCM).");
  }

  async dispatchHitlApproval({ approvalId, agentName, toolName, amount, reason }) {
    const payload = {
      text: `🚨 [SYNAPSE SECURITY 2FA]: Approval Requested for ${agentName}`,
      blocks: [
        {
          type: "header",
          text: { type: "plain_text", text: "🚨 SynapseGuard 2FA Human-in-the-Loop Action Required", emoji: true }
        },
        {
          type: "section",
          fields: [
            { type: "mrkdwn", text: `*Agent:*\n${agentName}` },
            { type: "mrkdwn", text: `*Action / Tool:*\n\`${toolName}\`` },
            { type: "mrkdwn", text: `*Amount:*\n$${amount || 0} USD` },
            { type: "mrkdwn", text: `*Approval ID:*\n\`${approvalId}\`` }
          ]
        },
        {
          type: "section",
          text: { type: "mrkdwn", text: `*Reason:*\n>${reason}` }
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: { type: "plain_text", text: "✅ Approve Action", emoji: true },
              style: "primary",
              url: `http://localhost:3000?action=approve&id=${approvalId}`
            },
            {
              type: "button",
              text: { type: "plain_text", text: "🛑 Reject & Rollback", emoji: true },
              style: "danger",
              url: `http://localhost:3000?action=reject&id=${approvalId}`
            }
          ]
        }
      ]
    };

    console.log(`\n[SLACK_BLOCK_KIT_DISPATCH]: Formatted Block-Kit interactive notification for Approval '${approvalId}'.`);

    // If a real webhook URL exists, post to Slack
    if (this.webhookUrl) {
      const start = performance.now();
      try {
        const response = await fetch(this.webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const latencyMs = Number((performance.now() - start).toFixed(2));
        console.log(`[SLACK_BLOCK_KIT_DISPATCH]: Real Slack message posted. Status: ${response.status} (${latencyMs}ms)`);
        return {
          delivered: response.ok,
          channel: "slack_webhook",
          isFallback: false,
          statusCode: response.status,
          latencyMs,
          message: response.ok ? "Notification delivered to live Slack webhook endpoint." : `Slack endpoint responded with error: ${response.statusText}`
        };
      } catch (err) {
        const latencyMs = Number((performance.now() - start).toFixed(2));
        console.error("[SLACK_BLOCK_KIT_DISPATCH]: Failed to post to webhook:", err.message);
        return {
          delivered: false,
          channel: "slack_webhook",
          isFallback: false,
          statusCode: null,
          latencyMs,
          error: `Network error posting to Slack: ${err.message}`
        };
      }
    }

    return {
      delivered: false,
      channel: "console_fallback",
      isFallback: true,
      statusCode: null,
      message: "No SLACK_WEBHOOK_URL configured. Interactive Block-Kit notification logged to console only.",
      payload
    };
  }
}

export const slackDispatcher = new SlackBlockKitDispatcher();
