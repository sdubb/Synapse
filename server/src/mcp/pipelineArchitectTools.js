// Exposes Small Deterministic Pipeline Architect Manipulation Tools directly over MCP for CLIs (Aider, Goose, agy, Claude)
export const PIPELINE_ARCHITECT_MCP_TOOLS = [
  // 1. Pipeline Lifecycle
  {
    name: "pipeline_list",
    description: "Lists all committed enterprise pipelines and active working drafts.",
    inputSchema: {
      type: "object",
      properties: {},
      required: []
    }
  },
  {
    name: "pipeline_get",
    description: "Fetches full DAG node sequence, contracts, and governance thresholds for a given pipeline ID.",
    inputSchema: {
      type: "object",
      properties: {
        pipelineId: { type: "string", description: "Target pipeline ID" }
      },
      required: ["pipelineId"]
    }
  },
  {
    name: "pipeline_create",
    description: "Creates a new multi-stage pipeline draft with spend limits and assigned CLI harness.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Pipeline name" },
        domain: { type: "string", description: "Operational domain (Quant, Cloud SRE, Revenue)" },
        cliEngine: { type: "string", description: "Harness (Aider, Goose, agy, OpenHands)" },
        model: { type: "string", description: "Reasoning model (e.g. deepseek-r1:70b, gpt-4o)" },
        spendCeilingUsd: { type: "number", description: "Hard spend ceiling in USD" },
        hitlThresholdUsd: { type: "number", description: "Human 2FA approval threshold in USD" },
        cronInterval: { type: "number", description: "24/7 monitoring loop interval in seconds" }
      },
      required: ["name"]
    }
  },
  {
    name: "pipeline_update",
    description: "Modifies pipeline metadata, domain, governance limits, or reasoning model.",
    inputSchema: {
      type: "object",
      properties: {
        pipelineId: { type: "string", description: "Target pipeline ID" },
        updates: { type: "object", description: "Key-value property updates" }
      },
      required: ["pipelineId", "updates"]
    }
  },
  {
    name: "pipeline_rename",
    description: "Renames an existing pipeline or draft.",
    inputSchema: {
      type: "object",
      properties: {
        pipelineId: { type: "string", description: "Target pipeline ID" },
        name: { type: "string", description: "New name" }
      },
      required: ["pipelineId", "name"]
    }
  },
  {
    name: "pipeline_delete",
    description: "Deletes a pipeline or draft.",
    inputSchema: {
      type: "object",
      properties: {
        pipelineId: { type: "string", description: "Target pipeline ID" }
      },
      required: ["pipelineId"]
    }
  },

  // 2. Node Operations
  {
    name: "node_create",
    description: "Appends or inserts a deterministic node card into the pipeline DAG.",
    inputSchema: {
      type: "object",
      properties: {
        pipelineId: { type: "string", description: "Target pipeline ID" },
        nodeType: { type: "string", enum: ["MONITOR_STREAM", "CONDITIONAL_BRANCH", "EXECUTE_ACTION", "A2A_DELEGATION", "NOTIFICATION"], description: "Node category" },
        title: { type: "string", description: "Descriptive stage name" },
        tool: { type: "string", description: "Tool ID from registry" },
        condition: { type: "string", description: "Execution condition predicate" },
        retryCount: { type: "number", description: "Retry attempts" },
        fallbackAction: { type: "string", description: "Fallback on failure" },
        params: { type: "object", description: "JSON parameters" },
        position: { type: "number", description: "Zero-based index to insert node at (-1 for end)" }
      },
      required: ["pipelineId", "tool"]
    }
  },
  {
    name: "node_update",
    description: "Updates properties (tool, parameters, condition, fallback) of a specific node card.",
    inputSchema: {
      type: "object",
      properties: {
        pipelineId: { type: "string", description: "Target pipeline ID" },
        nodeId: { type: "string", description: "Target node ID" },
        updates: { type: "object", description: "Node fields to override" }
      },
      required: ["pipelineId", "nodeId", "updates"]
    }
  },
  {
    name: "node_delete",
    description: "Removes a specific node card from the pipeline DAG.",
    inputSchema: {
      type: "object",
      properties: {
        pipelineId: { type: "string", description: "Target pipeline ID" },
        nodeId: { type: "string", description: "Target node ID" }
      },
      required: ["pipelineId", "nodeId"]
    }
  },
  {
    name: "node_move",
    description: "Reorders a node to a new sequential position in the DAG.",
    inputSchema: {
      type: "object",
      properties: {
        pipelineId: { type: "string", description: "Target pipeline ID" },
        nodeId: { type: "string", description: "Target node ID" },
        newIndex: { type: "number", description: "Target zero-based index" }
      },
      required: ["pipelineId", "nodeId", "newIndex"]
    }
  },
  {
    name: "node_connect",
    description: "Defines branch dependencies and next target transitions between nodes.",
    inputSchema: {
      type: "object",
      properties: {
        pipelineId: { type: "string", description: "Target pipeline ID" },
        sourceNodeId: { type: "string", description: "Source node ID" },
        targetNodeId: { type: "string", description: "Destination node ID" },
        condition: { type: "string", description: "Transition condition" }
      },
      required: ["pipelineId", "sourceNodeId", "targetNodeId"]
    }
  },

  // 3. Branching
  {
    name: "branch_create",
    description: "Creates a conditional evaluation branch gate in the DAG.",
    inputSchema: {
      type: "object",
      properties: {
        pipelineId: { type: "string", description: "Target pipeline ID" },
        title: { type: "string", description: "Branch title" },
        condition: { type: "string", description: "Branching predicate" },
        tool: { type: "string", description: "Analysis tool ID" },
        params: { type: "object", description: "Evaluation parameters" }
      },
      required: ["pipelineId", "condition"]
    }
  },

  // 4. Verification Contracts
  {
    name: "contract_create",
    description: "Attaches an immutable ground-truth postcondition verification contract to a node.",
    inputSchema: {
      type: "object",
      properties: {
        pipelineId: { type: "string", description: "Target pipeline ID" },
        nodeId: { type: "string", description: "Target node ID" },
        verifier: { type: "string", description: "Verifier type (e.g. idempotency_key_active, db_row_exists, external_endpoint_status)" },
        params: { type: "object", description: "Verifier contract parameters" }
      },
      required: ["pipelineId", "nodeId", "verifier"]
    }
  },

  // 5. Validation, Preview & Revisions
  {
    name: "pipeline_validate",
    description: "Runs the static verifier linter to audit DAG invariants, money movement postconditions, and fallback paths.",
    inputSchema: {
      type: "object",
      properties: {
        pipelineId: { type: "string", description: "Target pipeline ID" }
      },
      required: ["pipelineId"]
    }
  },
  {
    name: "pipeline_preview",
    description: "Generates a structured visual diff of proposed changes (+ nodes, + contracts, + governance changes).",
    inputSchema: {
      type: "object",
      properties: {
        pipelineId: { type: "string", description: "Target pipeline ID" }
      },
      required: ["pipelineId"]
    }
  },
  {
    name: "pipeline_commit",
    description: "Persists and commits staged draft to production pipeline state & SQLite database, recording a revision snapshot.",
    inputSchema: {
      type: "object",
      properties: {
        pipelineId: { type: "string", description: "Target pipeline ID" },
        commitReason: { type: "string", description: "Audit rationale for commit" }
      },
      required: ["pipelineId"]
    }
  },
  {
    name: "pipeline_rollback",
    description: "Rolls back pipeline to a previous revision snapshot.",
    inputSchema: {
      type: "object",
      properties: {
        pipelineId: { type: "string", description: "Target pipeline ID" },
        revisionNumber: { type: "number", description: "Optional revision number to restore" }
      },
      required: ["pipelineId"]
    }
  },

  // 6. Conversational Natural Language Architect Directive
  {
    name: "architect_chat",
    description: "Processes conversational natural language directives to generate, modify, or repair pipeline DAGs via small deterministic MCP tools.",
    inputSchema: {
      type: "object",
      properties: {
        directive: { type: "string", description: "Natural language prompt from user" },
        pipelineId: { type: "string", description: "Optional active pipeline ID" }
      },
      required: ["directive"]
    }
  }
];
