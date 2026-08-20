import React, { useState } from "react";
import { Crosshair, Flame, Bug, ShieldAlert, CheckCircle2, AlertTriangle, ArrowRight, Cpu, ShieldCheck } from "lucide-react";

export function RedTeamStudio({ agents, onRunScan }) {
  const [selectedAgentId, setSelectedAgentId] = useState(agents[0]?.id || "wf-sales-rep");
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(null);
  const [scanResult, setScanResult] = useState(null);

  const selectedAgent = agents.find(a => a.id === selectedAgentId) || agents[0];

  const handleStartScan = async () => {
    setIsScanning(true);
    setProgress({ testedVectors: 0, currentSuite: "Initializing Attack Matrix...", exploitsFound: 0 });
    setScanResult(null);

    try {
      const res = await onRunScan(selectedAgentId);
      setScanResult(res);
    } catch (e) {
      alert("Scan failed: " + e.message);
    } finally {
      setIsScanning(false);
      setProgress(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            Automated AI Agent Red-Teaming & Security Pentesting
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Simulate 10,000 adversarial attack vectors (Prompt Injection, Privilege Escalation, Tool Shadowing, Exfiltration) before deployment.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(e.target.value)}
            disabled={isScanning}
            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            {agents.map(a => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.provider})
              </option>
            ))}
          </select>

          <button
            disabled={isScanning}
            onClick={handleStartScan}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 disabled:opacity-50 transition"
          >
            <Flame className={`w-3.5 h-3.5 ${isScanning ? "animate-spin text-amber-300" : ""}`} />
            <span>{isScanning ? "Running Attack Vectors..." : "Launch 10,000 Vectors"}</span>
          </button>
        </div>
      </div>

      {/* Progress Animation during Scan */}
      {isScanning && progress && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-blue-500/40 space-y-3 font-sans text-xs">
          <div className="flex items-center justify-between font-semibold">
            <span className="flex items-center gap-2 text-blue-400">
              <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
              Simulating Attack Vector: {progress.currentSuite}
            </span>
            <span className="text-white">Target: {selectedAgent.name}</span>
          </div>

          <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
            <div className="h-full bg-blue-600 w-3/4 animate-pulse" />
          </div>

          <div className="flex justify-between text-xs text-slate-400">
            <span>Testing adversarial prompt injections, tool description shadowing & subagent forgery...</span>
            <span className="text-amber-400 font-semibold">Exploits Found: {progress.exploitsFound}</span>
          </div>
        </div>
      )}

      {/* Scan Results Report */}
      {scanResult && (
        <div className="space-y-6">
          {/* Executive Score Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 block font-medium">Security Posture Score</span>
              <div className={`text-3xl font-bold font-mono mt-1 ${
                scanResult.securityScore >= 80 ? "text-emerald-400" :
                scanResult.securityScore >= 50 ? "text-amber-400" : "text-rose-400"
              }`}>
                {scanResult.securityScore} / 100
              </div>
              <span className="text-xs text-slate-500">CVSS-equivalent score</span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 block font-medium">Vectors Tested</span>
              <div className="text-3xl font-bold font-mono text-blue-400 mt-1">
                {scanResult.totalVectorsTested.toLocaleString()}
              </div>
              <span className="text-xs text-slate-500">Simulated attack chains</span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 block font-medium">Actionable Findings</span>
              <div className="text-3xl font-bold font-mono text-rose-400 mt-1">
                {scanResult.findingsCount}
              </div>
              <span className="text-xs text-slate-500">Proof-of-exploits captured</span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 block font-medium">Deployment Verdict</span>
              <div className={`text-xs font-semibold mt-2 px-2.5 py-1 rounded-lg inline-block ${
                scanResult.securityScore >= 80
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
              }`}>
                {scanResult.status}
              </div>
              <span className="text-xs text-slate-500 block mt-1">{scanResult.durationMs}ms scan time</span>
            </div>
          </div>

          {/* Vulnerability Exploit Proofs Table */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden text-xs">
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Bug className="w-4 h-4 text-rose-400" /> Discovered Exploit Chains & Proof of Breaches
              </h3>
              <span className="text-slate-400">{scanResult.findings.length} Vulnerabilities Identified</span>
            </div>

            <div className="divide-y divide-slate-800">
              {scanResult.findings.map((vuln) => (
                <div key={vuln.id} className="p-5 space-y-3 bg-slate-900/60 hover:bg-slate-900 transition">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                        vuln.severity === "CRITICAL" ? "bg-rose-500/15 text-rose-400 border border-rose-500/30" :
                        vuln.severity === "HIGH" ? "bg-amber-500/15 text-amber-400 border border-amber-500/30" :
                        "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                      }`}>
                        {vuln.severity}
                      </span>
                      <h4 className="text-xs font-semibold text-white">{vuln.suiteName}</h4>
                      <span className="text-xs text-slate-500">[{vuln.category}]</span>
                    </div>
                    <span className="text-slate-500 font-mono text-xs">{vuln.id}</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                    <div className="text-rose-300">
                      <strong className="text-slate-400 font-medium">Attack Payload:</strong> {vuln.vectorUsed}
                    </div>
                    <div className="text-amber-300">
                      <strong className="text-slate-400 font-medium">Proof of Concept:</strong> {vuln.exploitProof}
                    </div>
                    <div className="text-emerald-400 pt-1">
                      <strong className="text-slate-400 font-medium">Synapse Hardening Rule:</strong> {vuln.mitigation}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
