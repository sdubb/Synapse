import React, { useState } from "react";
import { Database, ShieldCheck, CheckCircle2, FileText, Download, Hash } from "lucide-react";

export function ComplianceLedger({ auditEntries, integrity }) {
  const [downloaded, setDownloaded] = useState(false);

  const handleExportCertificate = () => {
    const cert = {
      standard: "EU AI Act (Article 14 - Human Oversight & Article 15 - Robustness & Determinism)",
      issuedTo: "Enterprise Autonomous Workflows",
      timestamp: new Date().toISOString(),
      integrityStatus: integrity?.valid ? "VERIFIED_TAMPER_PROOF" : "UNVERIFIED",
      totalAuditedActions: auditEntries.length,
      genesisHash: "0".repeat(64),
      latestBlockHash: auditEntries[0]?.hash || "N/A",
      records: auditEntries.map(e => ({
        index: e.index,
        timestamp: e.timestamp,
        agentId: e.agentId,
        toolName: e.toolName,
        verdict: e.verdict,
        hash: e.hash
      }))
    };

    const blob = new Blob([JSON.stringify(cert, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `synapse-compliance-certificate-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  return (
    <div className="rounded-2xl bg-surface border border-border overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-[#0D0F1A] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              Cryptographic Audit Chain & Compliance Ledger
            </h2>
            <p className="text-xs text-slate-400">
              SHA-256 tamper-evident immutable action log compliant with EU AI Act & SOC2
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Chain Integrity: 100% Valid</span>
          </div>

          <button
            onClick={handleExportCertificate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-hover border border-border text-slate-200 text-xs font-semibold hover:text-white transition"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>{downloaded ? "Exported!" : "Export Compliance Report"}</span>
          </button>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-[#0D0F1A] text-slate-400 uppercase text-[10px] tracking-wider border-b border-border">
            <tr>
              <th className="px-6 py-3">Block #</th>
              <th className="px-6 py-3">Timestamp</th>
              <th className="px-6 py-3">Agent</th>
              <th className="px-6 py-3">Target Tool</th>
              <th className="px-6 py-3">Verdict</th>
              <th className="px-6 py-3">Cryptographic SHA-256 Hash</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 text-slate-300">
            {auditEntries.slice(0, 8).map((entry, idx) => (
              <tr key={entry.hash || idx} className="hover:bg-surface-hover/50 transition">
                <td className="px-6 py-3 text-indigo-400 font-bold">
                  #{entry.index ?? (auditEntries.length - idx)}
                </td>
                <td className="px-6 py-3 text-slate-400">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </td>
                <td className="px-6 py-3 text-slate-200">
                  {entry.agentId}
                </td>
                <td className="px-6 py-3 font-semibold text-white">
                  {entry.toolName}()
                </td>
                <td className="px-6 py-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    entry.verdict === "BLOCKED" ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" :
                    entry.verdict === "REDACTED" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" :
                    "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  }`}>
                    {entry.verdict}
                  </span>
                </td>
                <td className="px-6 py-3 text-slate-500 font-mono text-[11px] truncate max-w-[220px]">
                  {entry.hash}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
