import React, { useState, useEffect } from "react";
import { Plug, CheckCircle2, ArrowRight, Shield, Zap, Server, RefreshCw, Send, Play, Terminal, ExternalLink } from "lucide-react";

export function EnterpriseConnectorsHub() {
  const [connectors, setConnectors] = useState([]);
  const [selectedConnector, setSelectedConnector] = useState(null);
  const [testPayload, setTestPayload] = useState("");
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [healthResult, setHealthResult] = useState(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  const fetchConnectors = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/v1/connectors");
      const data = await res.json();
      if (data.connectors) {
        setConnectors(data.connectors);
        if (!selectedConnector) {
          setSelectedConnector(data.connectors[0]);
          setTestPayload(JSON.stringify(data.connectors[0].samplePayload, null, 2));
        }
      }
    } catch (e) {
      console.error("Connectors fetch error:", e);
    }
  };

  useEffect(() => {
    fetchConnectors();
  }, []);

  const handleSelectConnector = (conn) => {
    setSelectedConnector(conn);
    setTestPayload(JSON.stringify(conn.samplePayload, null, 2));
    setTestResult(null);
    setHealthResult(null);
  };

  const handleCheckHealth = async () => {
    if (!selectedConnector) return;
    setIsCheckingHealth(true);
    setHealthResult(null);
    try {
      const res = await fetch(`http://localhost:4000/api/v1/connectors/${selectedConnector.id}/health`);
      const data = await res.json();
      setHealthResult(data);
    } catch (err) {
      setHealthResult({ error: err.message, status: "PROBE_ERROR" });
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const handleRunConnectorTest = async () => {
    if (!selectedConnector) return;
    setIsTesting(true);
    setTestResult(null);

    try {
      let parsed = {};
      try {
        parsed = JSON.parse(testPayload);
      } catch (e) {
        alert("Invalid JSON format");
        return;
      }

      const res = await fetch(`http://localhost:4000/api/v1/connectors/${selectedConnector.id}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed)
      });
      const data = await res.json();
      setTestResult(data);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-surface border border-border p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Plug className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Universal Enterprise Agent Connectors (Salesforce, ServiceNow, Bedrock, Copilot)
            </h2>
            <p className="text-xs text-slate-400">
              Connect and govern ecosystem-native AI agents across your company's existing enterprise systems
            </p>
          </div>
        </div>

        <button
          onClick={fetchConnectors}
          className="p-2 rounded-xl bg-surface hover:bg-surface-hover border border-border text-slate-300 hover:text-white transition"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Connectors Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {connectors.map(conn => {
          const isSelected = selectedConnector?.id === conn.id;

          return (
            <button
              key={conn.id}
              onClick={() => handleSelectConnector(conn)}
              className={`p-4 rounded-xl border text-left transition flex flex-col justify-between space-y-3 ${
                isSelected
                  ? "bg-cyan-950/20 border-cyan-500/50 shadow-lg shadow-cyan-950/30"
                  : "bg-surface/90 border-border hover:border-cyan-500/30"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    conn.status === "CONFIGURED" || conn.status === "CONNECTED"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                      : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                  }`}>
                    {conn.status === "NOT_CONFIGURED" ? "NOT CONFIGURED" : conn.status}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Key: {conn.credentialKey}
                  </span>
                </div>
                <h3 className="text-xs font-bold text-white mt-2">{conn.name}</h3>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{conn.category}</p>
              </div>

              <div className="text-[10px] font-mono text-cyan-400 flex items-center gap-1">
                <span>View Integration</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Connector Detail & Live Test Sandbox */}
      {selectedConnector && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Setup Guide Column */}
          <div className="lg:col-span-6 rounded-2xl bg-surface border border-border p-6 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">{selectedConnector.name}</h3>
                <p className="text-slate-400 text-[11px] mt-0.5">{selectedConnector.deploymentType}</p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded bg-background border border-border text-slate-300">
                {selectedConnector.category}
              </span>
            </div>

            <p className="text-slate-300 leading-relaxed text-xs">
              {selectedConnector.description}
            </p>

            <div className="space-y-2 pt-2">
              <span className="text-[11px] uppercase font-bold text-cyan-400 block">
                3-Step Enterprise Ingestion Setup:
              </span>
              <div className="p-3 rounded-xl bg-background border border-border space-y-2 text-[11px] text-slate-300 leading-relaxed">
                <div>1. {selectedConnector.setupGuide.step1}</div>
                <div>2. {selectedConnector.setupGuide.step2}</div>
                <div>3. {selectedConnector.setupGuide.step3}</div>
              </div>
            </div>

            <div className="pt-2 border-t border-border">
              <button
                disabled={isCheckingHealth}
                onClick={handleCheckHealth}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-surface-hover hover:bg-slate-800 border border-border text-slate-200 text-xs font-semibold transition"
              >
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isCheckingHealth ? "Probing Vault..." : "Probe Secrets Gateway Credentials"}</span>
              </button>

              {healthResult && (
                <div className={`mt-2 p-3 rounded-xl border text-[11px] space-y-1 ${
                  healthResult.isHealthy 
                    ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
                    : "bg-amber-950/20 border-amber-500/30 text-amber-300"
                }`}>
                  <div className="flex items-center justify-between font-bold">
                    <span>Status: {healthResult.status}</span>
                    <span>{healthResult.latencyMs} ms</span>
                  </div>
                  <div className="text-[10px] text-slate-300">
                    {healthResult.details || healthResult.error}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Test Live Ingestion Column */}
          <div className="lg:col-span-6 rounded-2xl bg-surface border border-border p-6 space-y-4 font-mono text-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Simulate Live {selectedConnector.name} Action
                </span>
                <span className="text-[10px] text-slate-500">Zero-Latency Interceptor</span>
              </div>

              <textarea
                rows={6}
                value={testPayload}
                onChange={(e) => setTestPayload(e.target.value)}
                className="w-full bg-background border border-border rounded-xl p-3 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
              />

              <button
                disabled={isTesting}
                onClick={handleRunConnectorTest}
                className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/20 disabled:opacity-50 transition"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isTesting ? "Evaluating..." : `Test ${selectedConnector.name} Webhook`}</span>
              </button>
            </div>

            {/* Test Result Display */}
            {testResult && (
              <div className="mt-3 p-3.5 rounded-xl bg-background border border-border space-y-1 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Decision:</span>
                  <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                    testResult.decision.allowed ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                  }`}>
                    {testResult.decision.verdict}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Latency Overhead:</span>
                  <span className="text-white">{testResult.decision.latencyMs} ms</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Risk Score:</span>
                  <span className="text-cyan-400">{testResult.decision.riskScore} / 100</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
