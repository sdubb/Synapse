import React, { useState, useEffect } from "react";
import { Share2, ArrowRight, ShieldCheck, ShieldAlert, Cpu, CheckCircle2, Lock, RefreshCw, Send } from "lucide-react";

export function A2AMeshVisualizer({ onSendCustomA2A }) {
  const [a2aData, setA2aData] = useState({ messages: [], trustMatrix: [] });
  const [sender, setSender] = useState("Sales-Agent-001");
  const [receiver, setReceiver] = useState("Finance-Agent-024");
  const [amount, setAmount] = useState(4500);
  const [isSending, setIsSending] = useState(false);

  const fetchA2A = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/v1/a2a/messages");
      const data = await res.json();
      setA2aData(data);
    } catch (e) {
      console.error("A2A fetch error:", e);
    }
  };

  useEffect(() => {
    fetchA2A();
    const interval = setInterval(fetchA2A, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleTestA2A = async () => {
    setIsSending(true);
    try {
      await fetch("http://localhost:4000/api/v1/a2a/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: sender,
          receiverId: receiver,
          messageType: "TASK_DELEGATION",
          payload: { action: "transfer_client_funds", amount: Number(amount), client: "Microsoft" }
        })
      });
      fetchA2A();
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-surface border border-border p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <Share2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Agent-to-Agent (A2A) Trust Mesh & Protocol Gateway
            </h2>
            <p className="text-xs text-slate-400">
              Implements Google A2A + Anthropic MCP cryptographic delegation verification and trust handshakes
            </p>
          </div>
        </div>

        <button
          onClick={fetchA2A}
          className="p-2 rounded-xl bg-surface hover:bg-surface-hover border border-border text-slate-300 hover:text-white transition"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Interactive A2A Delegation Sandbox */}
      <div className="rounded-2xl bg-surface border border-border p-6">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2 font-mono">
          <Lock className="w-4 h-4 text-cyan-400" /> Test Cross-Agent Delegation & Handshake Interception
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="text-[11px] font-mono text-slate-400 block mb-1">Originating Agent</label>
            <select
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-purple-500"
            >
              <option value="Sales-Agent-001">Sales-Agent-001</option>
              <option value="DevOps-SRE-Agent-089">DevOps-SRE-Agent-089</option>
              <option value="Procurement-Agent-112">Procurement-Agent-112</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-mono text-slate-400 block mb-1">Target Delegatee</label>
            <select
              value={receiver}
              onChange={(e) => setReceiver(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-purple-500"
            >
              <option value="Finance-Agent-024">Finance-Agent-024</option>
              <option value="TSMC-Supply-Logistics">TSMC-Supply-Logistics</option>
              <option value="DGX-Cloud-Ops">DGX-Cloud-Ops</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-mono text-slate-400 block mb-1">Delegated Spend ($)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex items-end">
            <button
              disabled={isSending}
              onClick={handleTestA2A}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/20 disabled:opacity-50 transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSending ? "Routing..." : "Route A2A Message"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live A2A Message Stream Table */}
      <div className="rounded-2xl bg-surface border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-[#0D0F1A] flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
            <Share2 className="w-4 h-4 text-purple-400" /> Live Inter-Agent Transmission Ledger
          </h3>
          <span className="text-xs font-mono text-slate-400">{a2aData.messages.length} Messages Monitored</span>
        </div>

        <div className="divide-y divide-border/60">
          {a2aData.messages.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs font-mono">
              No A2A transmissions yet. Run the NVIDIA Enterprise simulation or route a test message above.
            </div>
          ) : (
            a2aData.messages.map((msg, idx) => {
              const isIntercepted = msg.verdict === "INTERCEPTED";

              return (
                <div
                  key={msg.messageId || idx}
                  className={`p-4 transition ${
                    isIntercepted ? "bg-rose-950/20" : "bg-background/40 hover:bg-surface-hover/60"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-purple-400 font-bold">{msg.senderId}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-cyan-400 font-bold">{msg.receiverId}</span>
                      <span className="text-slate-500 text-[10px]">[{msg.messageType}]</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        isIntercepted
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      }`}>
                        {msg.verdict}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-500">
                      {new Date(msg.timestamp).toLocaleTimeString()} ({msg.latencyMs}ms)
                    </div>
                  </div>

                  {/* Payload or Violation Details */}
                  <div className="mt-2 text-xs font-mono">
                    {msg.violations && msg.violations.length > 0 ? (
                      <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-[11px]">
                        <strong>Interception Reason:</strong> {msg.violations[0].reason}
                      </div>
                    ) : (
                      <pre className="text-[10px] text-indigo-300/80 bg-background/80 p-2 rounded border border-border/60 overflow-x-auto">
                        {JSON.stringify(msg.payload, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
