export class SandboxToolRegistry {
  constructor() {
    this.virtualDatabase = {
      users: [
        { id: "usr_101", name: "Sarah Connor", balance: 450.0, email: "sarah@cyberdyne.io", tier: "enterprise" },
        { id: "usr_102", name: "John Wick", balance: 12500.0, email: "john@continental.org", tier: "vip" },
        { id: "usr_103", name: "Dev Employee", balance: 50.0, email: "dev@company.com", tier: "internal" }
      ],
      orders: [
        { id: "ord_501", userId: "usr_101", amount: 150.0, status: "paid", description: "Cloud Cluster Tier A" },
        { id: "ord_502", userId: "usr_102", amount: 8500.0, status: "paid", description: "Dedicated GPU SuperPOD" }
      ],
      cloudNodes: [
        { nodeId: "node-us-east-1a", cpuUtilization: 42, memoryPercent: 68, status: "healthy", activeJobs: 14 },
        { nodeId: "node-us-east-1b", cpuUtilization: 98, memoryPercent: 94, status: "degraded", activeJobs: 38 }
      ],
      auditLog: []
    };
  }

  async executeTool(toolName, parameters) {
    const start = performance.now();
    let result = {};

    switch (toolName) {
      case "query_database": {
        const table = parameters.table || "users";
        const rows = this.virtualDatabase[table] || [];
        const filtered = parameters.filter
          ? rows.filter(r => Object.entries(parameters.filter).every(([k, v]) => r[k] === v))
          : rows;
        result = { table, count: filtered.length, data: filtered };
        break;
      }

      case "mutate_database": {
        const { table, action, record } = parameters;
        if (!this.virtualDatabase[table]) this.virtualDatabase[table] = [];
        
        if (action === "insert") {
          this.virtualDatabase[table].push(record);
          result = { success: true, action: "insert", insertedRecord: record };
        } else if (action === "update") {
          const index = this.virtualDatabase[table].findIndex(r => r.id === record.id);
          if (index !== -1) {
            const previousState = { ...this.virtualDatabase[table][index] };
            this.virtualDatabase[table][index] = { ...this.virtualDatabase[table][index], ...record };
            result = { success: true, action: "update", previousState, newState: this.virtualDatabase[table][index] };
          } else {
            result = { success: false, error: "Record not found" };
          }
        }
        break;
      }

      case "issue_refund": {
        const { orderId, amount, customerId } = parameters;
        const order = this.virtualDatabase.orders.find(o => o.id === orderId || o.userId === customerId);
        result = {
          success: true,
          refundId: "ref_" + Math.random().toString(36).substr(2, 8),
          refundedAmount: Number(amount),
          orderId: order?.id || orderId,
          timestamp: new Date().toISOString()
        };
        break;
      }

      case "manage_cloud_resources": {
        const { action, targetNode, scaleCount } = parameters;
        const node = this.virtualDatabase.cloudNodes.find(n => n.nodeId === targetNode);
        if (action === "restart_node" && node) {
          node.cpuUtilization = 18;
          node.status = "healthy";
          result = { success: true, action: "restarted", node };
        } else if (action === "scale_cluster") {
          result = { success: true, action: "scaled", newCapacity: scaleCount || 10 };
        } else {
          result = { success: true, action: action || "status_check", targetNode };
        }
        break;
      }

      case "execute_code_sandbox": {
        const { language, code } = parameters;
        // Evaluate safe arithmetic or JS expressions
        let evalOutput = "Executed successfully in sandbox.";
        try {
          if (language === "javascript" && !/process|require|fs|child_process/i.test(code)) {
            const fn = new Function(`"use strict"; return (${code});`);
            evalOutput = String(fn());
          }
        } catch (e) {
          evalOutput = "Execution note: " + e.message;
        }
        result = { success: true, language, output: evalOutput };
        break;
      }

      case "send_notification": {
        result = {
          success: true,
          deliveredTo: parameters.recipient || "slack-channel-ops",
          messageId: "msg_" + Math.random().toString(36).substr(2, 8),
          timestamp: new Date().toISOString()
        };
        break;
      }

      default:
        result = { success: true, toolName, parameters, status: "mocked_execution_success" };
        break;
    }

    const durationMs = Number((performance.now() - start).toFixed(2));
    return { ...result, executionDurationMs: durationMs };
  }
}
