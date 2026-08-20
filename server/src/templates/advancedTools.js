export const ADVANCED_AGENT_TOOL_REGISTRY = [
  // 1. FINANCIAL TRADING, CRYPTO & QUANT EXECUTION
  {
    category: "Financial Trading, Market Data & Quant Execution",
    tools: [
      {
        id: "market_data_orderbook_stream",
        name: "L2/L3 Orderbook & Real-Time Ticker Stream",
        provider: "Binance / Coinbase / Bloomberg API",
        description: "Streams real-time bid/ask orderbooks, calculates 5-minute VWAP and bid-ask spread depth.",
        defaultParams: '{"pair": "BTC/USDT", "exchange": "binance", "depth": 50, "timeframe": "1m"}'
      },
      {
        id: "execute_limit_market_order",
        name: "Algorithmic Limit/Market Order Execution",
        provider: "Alpaca / Interactive Brokers / CCXT",
        description: "Executes conditional TWAP/VWAP limit orders with automated slippage protection and kill switches.",
        defaultParams: '{"symbol": "NVDA", "action": "BUY", "quantity": 10, "orderType": "LIMIT", "maxSlippageBps": 15, "stopLossPrice": 128.50}'
      },
      {
        id: "portfolio_risk_var_analyzer",
        name: "Portfolio Risk & VaR (Value-at-Risk) Engine",
        provider: "QuantLib / Bloomberg Risk Core",
        description: "Calculates 99% 1-day Value at Risk (VaR), Sharpe Ratio, and enforces maximum drawdown circuit breakers.",
        defaultParams: '{"maxDrawdownPct": 2.5, "targetSharpe": 2.1, "rebalanceThresholdUsd": 50000}'
      }
    ]
  },

  // 2. LIVE TELEMETRY, LOG MONITORING & ANOMALY DETECTION
  {
    category: "Live Telemetry, Log Monitoring & Anomaly Detection",
    tools: [
      {
        id: "log_stream_anomaly_detector",
        name: "Real-Time APM Log & Metric Anomaly Stream",
        provider: "Datadog / Elasticsearch / Grafana Loki",
        description: "Ingests high-throughput telemetry streams, detects p99 latency spikes, error rate surges, and memory leaks.",
        defaultParams: '{"service": "payments-gateway", "metric": "http_request_duration_p99", "surgeThreshold": "25%"}'
      },
      {
        id: "cloudwatch_datadog_alarm_poll",
        name: "CloudWatch / Prometheus Synthetic Prober",
        provider: "AWS CloudWatch / Prometheus",
        description: "Executes global synthetic ping probes, checks SSL certificate expirations, and polls distributed trace spans.",
        defaultParams: '{"endpoint": "https://api.enterprise.corp/v1/health", "expectedStatus": 200, "timeoutMs": 1500}'
      }
    ]
  },

  // 3. CLOUD INFRASTRUCTURE & MULTI-REGION SRE
  {
    category: "Cloud Infrastructure & SRE (AWS / GCP / K8s)",
    tools: [
      {
        id: "aws_s3_worm_audit",
        name: "AWS S3 / CloudTrail Security Auditor",
        provider: "Amazon Web Services (IAM & S3)",
        description: "Audits S3 bucket ACLs, KMS encryption keys, and enforces WORM compliance policies.",
        defaultParams: '{"region": "us-east-1", "bucket": "enterprise-compliance-vault", "enforceKms": true}'
      },
      {
        id: "k8s_cluster_drain_restart",
        name: "Kubernetes Zero-Downtime Pod Auto-Healer",
        provider: "Kubernetes (K8s API / Istio Mesh)",
        description: "Drains degraded cluster nodes, checks memory leaks, reroutes live traffic via Istio, and triggers rolling restarts.",
        defaultParams: '{"cluster": "prod-us-east-1", "namespace": "payments-core", "maxSurge": "25%"}'
      }
    ]
  },

  // 4. ENTERPRISE CRM, ERP & REVENUE OPS
  {
    category: "Enterprise CRM, ERP & Finance (Salesforce / SAP / Stripe)",
    tools: [
      {
        id: "salesforce_enterprise_sync",
        name: "Salesforce CRM Enterprise Account Sync",
        provider: "Salesforce Agentforce / Apex REST",
        description: "Mutates Opportunities, Quotes, and Custom Objects with automated deduplication.",
        defaultParams: '{"object": "Opportunity", "fields": {"StageName": "Closed-Won", "Amount": 75000}}'
      },
      {
        id: "sap_erp_ledger_reconcile",
        name: "SAP S/4HANA Corporate General Ledger",
        provider: "SAP ERP S/4HANA",
        description: "Reconciles multi-company financial postings and commits journal entries.",
        defaultParams: '{"companyCode": "1000", "ledger": "0L", "currency": "USD"}'
      },
      {
        id: "a2a_cross_delegation",
        name: "Google A2A Cross-Agent Delegation",
        provider: "Google A2A v1.0 Mesh",
        description: "Delegates sub-tasks to specialized peer agents (e.g. Sales delegating to Treasury) with cryptographic JWT token handshakes.",
        defaultParams: '{"delegateeId": "agent-finance-treasury", "directive": "Generate Net-30 invoice", "amount": 75000}'
      },
      {
        id: "slack_enterprise_block_kit",
        name: "Slack Enterprise Block-Kit 2FA Alert",
        provider: "Slack Enterprise Grid",
        description: "Posts rich interactive Block-Kit approval cards with inline 2FA button responses directly into secured channels.",
        defaultParams: '{"channel": "#executive-deals", "allowInline2Fa": true}'
      }
    ]
  }
];
