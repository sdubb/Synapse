import http from "http";
import { FAANG_ENTERPRISE_TOOL_REGISTRY } from "../templates/faangTools.js";
import { A2A_MCP_TOOL_DEFINITION, executeA2AMcpTool } from "./a2aToolConnector.js";
import { PIPELINE_ARCHITECT_MCP_TOOLS } from "./pipelineArchitectTools.js";
import { universalVerificationEngine } from "../verification/universalVerificationEngine.js";
import { pipelineSynthesizer } from "../runtime/pipelineSynthesizer.js";
import { pipelineStateEngine } from "../pipeline/pipelineStateEngine.js";
import { architectAgent } from "../pipeline/architectAgent.js";
import { realRegoEvaluator } from "../policy/realRegoEvaluator.js";
import { productionDb } from "../storage/productionDb.js";

const PORT = 4005;
const allFaangTools = FAANG_ENTERPRISE_TOOL_REGISTRY.flatMap(cat => cat.tools);

export class UniversalMcpGateway {
  constructor(broadcastEvent = () => {}) {
    this.broadcastEvent = broadcastEvent;
    this.server = http.createServer((req, res) => {
      let body = "";
      req.on("data", chunk => { body += chunk; });
      req.on("end", () => {
        try {
          const rpc = JSON.parse(body || "{}");
          this.handleRpc(rpc, res);
        } catch (e) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid JSON-RPC payload" }));
        }
      });
    });
  }

  handleRpc(rpc, res) {
    const { method, id, params } = rpc;

    // 1. Initialize
    if (method === "initialize") {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: { name: "synapse-universal-faang-mcp", version: "2.0.0" }
        }
      }));
    }

    // 2. Expose Tools (FAANG Enterprise + A2A + Pipeline Architect MCP Tools)
    if (method === "tools/list") {
      const toolsList = [
        ...allFaangTools.map(t => ({
          name: t.id,
          description: `${t.name} (${t.provider}): ${t.description}`,
          inputSchema: {
            type: "object",
            properties: {
              parameters: { type: "object", description: "JSON arguments for the enterprise tool" }
            },
            required: []
          }
        })),
        A2A_MCP_TOOL_DEFINITION,
        ...PIPELINE_ARCHITECT_MCP_TOOLS
      ];

      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({
        jsonrpc: "2.0",
        id,
        result: { tools: toolsList }
      }));
    }

    // 3. Execute Tool
    if (method === "tools/call") {
      const toolName = params?.name;
      const toolArgs = params?.arguments || {};

      // Case A: AI Pipeline Architect Deterministic MCP Tools
      if (toolName === "pipeline_list") {
        const list = pipelineStateEngine.listPipelines();
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify(list) }] } }));
      }

      if (toolName === "pipeline_get") {
        const pipe = pipelineStateEngine.getPipeline(toolArgs.pipelineId);
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify(pipe) }] } }));
      }

      if (toolName === "pipeline_create") {
        const created = pipelineStateEngine.createPipeline(toolArgs);
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify(created) }] } }));
      }

      if (toolName === "pipeline_update") {
        const updated = pipelineStateEngine.updatePipeline(toolArgs.pipelineId, toolArgs.updates);
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify(updated) }] } }));
      }

      if (toolName === "pipeline_rename") {
        const updated = pipelineStateEngine.renamePipeline(toolArgs.pipelineId, toolArgs.name);
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify(updated) }] } }));
      }

      if (toolName === "pipeline_delete") {
        const deleted = pipelineStateEngine.deletePipeline(toolArgs.pipelineId);
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify(deleted) }] } }));
      }

      if (toolName === "node_create") {
        const result = pipelineStateEngine.createNode(toolArgs.pipelineId, toolArgs, toolArgs.position);
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify(result) }] } }));
      }

      if (toolName === "node_update") {
        const result = pipelineStateEngine.updateNode(toolArgs.pipelineId, toolArgs.nodeId, toolArgs.updates);
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify(result) }] } }));
      }

      if (toolName === "node_delete") {
        const result = pipelineStateEngine.deleteNode(toolArgs.pipelineId, toolArgs.nodeId);
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify(result) }] } }));
      }

      if (toolName === "node_move") {
        const result = pipelineStateEngine.moveNode(toolArgs.pipelineId, toolArgs.nodeId, toolArgs.newIndex);
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify(result) }] } }));
      }

      if (toolName === "node_connect") {
        const result = pipelineStateEngine.connectNodes(toolArgs.pipelineId, toolArgs.sourceNodeId, toolArgs.targetNodeId, toolArgs.condition);
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify(result) }] } }));
      }

      if (toolName === "branch_create") {
        const result = pipelineStateEngine.createBranch(toolArgs.pipelineId, toolArgs);
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify(result) }] } }));
      }

      if (toolName === "contract_create") {
        const result = pipelineStateEngine.createContract(toolArgs.pipelineId, toolArgs.nodeId, toolArgs);
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify(result) }] } }));
      }

      if (toolName === "pipeline_validate" || toolName === "synapse_pipeline_validate_preflight") {
        const preflight = toolArgs.nodes
          ? universalVerificationEngine.verifyDAGDesign({ name: "Candidate MCP DAG", nodes: toolArgs.nodes })
          : pipelineStateEngine.validatePipeline(toolArgs.pipelineId);
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify(preflight) }] } }));
      }

      if (toolName === "pipeline_preview") {
        const preview = pipelineStateEngine.previewDraft(toolArgs.pipelineId);
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify(preview) }] } }));
      }

      if (toolName === "pipeline_commit") {
        const committed = pipelineStateEngine.commitPipeline(toolArgs.pipelineId, toolArgs.commitReason);
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify(committed) }] } }));
      }

      if (toolName === "pipeline_rollback") {
        const rolledBack = pipelineStateEngine.rollbackPipeline(toolArgs.pipelineId, toolArgs.revisionNumber);
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify(rolledBack) }] } }));
      }

      if (toolName === "architect_chat" || toolName === "synapse_pipeline_create_draft") {
        return architectAgent.processDirective({
          userPrompt: toolArgs.directive || toolArgs.intent || "Construct autonomous pipeline",
          pipelineId: toolArgs.pipelineId
        }).then(result => {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({
            jsonrpc: "2.0",
            id,
            result: { content: [{ type: "text", text: JSON.stringify(result) }] }
          }));
        }).catch(err => {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ jsonrpc: "2.0", id, error: { code: -32603, message: err.message } }));
        });
      }

      // Case B: A2A Mesh Delegation
      if (toolName === "a2a_delegate_task") {
        const a2aResult = executeA2AMcpTool(toolArgs);
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({
          jsonrpc: "2.0",
          id,
          result: { content: [{ type: "text", text: JSON.stringify(a2aResult) }] }
        }));
      }

      // Case C: FAANG Enterprise Tools
      const evalResult = realRegoEvaluator.evaluate({ tool_name: toolName, ...toolArgs });

      if (evalResult.verdict === "BLOCKED") {
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({
          jsonrpc: "2.0",
          id,
          error: {
            code: -32001,
            message: `[BLOCKED BY SYNAPSE REGO GOVERNANCE]: ${evalResult.reason}`
          }
        }));
      }

      productionDb.appendAuditBlock("mcp-external-agent", toolName, evalResult.verdict, evalResult.reason, evalResult.riskScore);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        jsonrpc: "2.0",
        id,
        result: {
          content: [
            {
              type: "text",
              text: `✅ [SYNAPSE MCP GATEWAY]: Executed '${toolName}' under OPA Governance. Recorded to SQLite audit ledger.`
            }
          ]
        }
      }));
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ jsonrpc: "2.0", id, result: {} }));
  }

  start() {
    this.server.listen(PORT, "0.0.0.0", () => {
      console.log(`🌐 Synapse Universal FAANG + A2A + Architect MCP Gateway listening on http://0.0.0.0:${PORT}`);
    });
  }
}

export const universalMcpGateway = new UniversalMcpGateway();
