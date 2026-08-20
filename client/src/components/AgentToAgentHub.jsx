import React, { useState, useEffect } from "react";
import { Share2, ArrowRight, ShieldCheck, ShieldAlert, Send, Lock, RefreshCw, Cpu, Layers } from "lucide-react";

export function AgentToAgentHub() {
  const [messages, setMessages] = useState([]);
  const [trustMatrix, setTrustMatrix] = useState([]);
  const [sender, setSender] = useState("Sales-Agent-001");
  const [receiver, setReceiver] = useState("Finance-Agent-024");
  const [delegatedAction, setDelegatedAction] = useState("transfer_client_funds");
  const [amount, setAmount] = useState(4500);
  const [isSending, setIsSending] = useState(false);

  const fetchA2A = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/v1/a2a/messages");
      const data = await res.json();
      if (data.messages) setMessages(data.messages);
      if (data.trustMatrix) setTrustMatrix(data.trustMatrix);
    } catch (e) {
      console.error("A2A fetch error:", e);
    }
  };

  useEffect(() => {
    fetchA2A();
    const interval = setInterval(fetchA2A, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleRouteMessage = async (e) => {
    e.preventDefault();
    setIsSending(true);
    try {
      await fetch("http://localhost:4000/api/v1/a2a/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: sender,
          receiverId: receiver,
          messageType: "TASK_DELEGATION",
          payload: { action: delegatedAction, amount: Number(amount), timestamp: new Date().toISOString() }
        })
      });
      fetchA2A();
    } catch (err) {
      alert("A2A error: " + err.message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            Agent-to-Agent (A2A) Trust Mesh & Cross-Agent Delegation
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Implements Google A2A v1.0 & Anthropic MCP mutual trust verification. Prevents rogue subagents from escalating permissions across boundaries.
          </p>
        </div>

        <button
          onClick={fetchA2A}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium transition flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Mesh</span>
        </button>
      </div>

      {/* Visual Multi-Agent Communication Graph */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-blue-400 font-semibold">1. Sales Agent</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-medium">ORIGIN</span>
          </div>
          <p className="text-xs text-slate-400">Receives client request & initiates multi-step workflow.</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-emerald-400 font-semibold">2. Synapse A2A Mesh</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-medium">SECURITY GATE</span>
          </div>
          <p className="text-xs text-slate-400">Verifies mutual signatures, delegation scopes & spend ceilings.</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-indigo-400 font-semibold">3. Finance Agent</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-medium">DELEGATEE</span>
          </div>
          <p className="text-xs text-slate-400">Executes verified financial tasks with state rollback checkpoints.</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-purple-400 font-semibold">4. Cloud / SRE Agent</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-medium">INFRASTRUCTURE</span>
          </div>
          <p className="text-xs text-slate-400">Maintains zero-downtime container and database reliability.</p>
        </div>
      </div>

      {/* Interactive Cross-Agent Test Console */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Lock className="w-4 h-4 text-blue-400" /> Test Cross-Agent Delegation & Handshake Interception
        </h3>

        <form onSubmit={handleRouteMessage} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="text-slate-400 block mb-1 font-medium">Sender Agent</label>
            <select
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="Sales-Agent-001">Sales-Agent-001</option>
              <option value="DevOps-SRE-Agent-089">DevOps-SRE-Agent-089</option>
              <option value="Procurement-Agent-112">Procurement-Agent-112</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-medium">Target Delegatee</label>
            <select
              value={receiver}
              onChange={(e) => setReceiver(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="Finance-Agent-024">Finance-Agent-024</option>
              <option value="TSMC-Supply-Logistics">TSMC-Supply-Logistics</option>
              <option value="DGX-Cloud-Ops">DGX-Cloud-Ops</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-medium">Delegated Amount ($ USD)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={isSending}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition shadow-sm disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSending ? "Routing..." : "Route A2A Message"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Live A2A Transmission Stream */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden text-xs">
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Share2 className="w-4 h-4 text-blue-400" /> Live Inter-Agent Transmission Ledger
          </h3>
          <span className="text-slate-400">{messages.length} Transmissions Monitored</span>
        </div>

        <div className="divide-y divide-slate-800 max-h-[400px] overflow-y-auto">
          {messages.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No A2A transmissions yet. Route a delegation message above to observe cross-agent verification.
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isIntercepted = msg.verdict === "INTERCEPTED";

              return (
                <div
                  key={msg.messageId || idx}
                  className={`p-4 transition ${
                    isIntercepted ? "bg-rose-950/20" : "bg-slate-900/60 hover:bg-slate-800/40"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-blue-400 font-semibold">{msg.senderId}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-indigo-400 font-semibold">{msg.receiverId}</span>
                      <span className="text-slate-500 text-[11px] font-mono">[{msg.messageType}]</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        isIntercepted
                          ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                          : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      }`}>
                        {msg.verdict}
                      </span>
                    </div>

                    <span className="text-slate-500 font-mono text-xs">{msg.latencyMs || "1.2"}ms verification latency</span>
                  </div>

                  <div className="mt-2">
                    {msg.violations && msg.violations.length > 0 ? (
                      <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
                        <strong>A2A Security Interception:</strong> {msg.violations[0].reason}
                      </div>
                    ) : (
                      <pre className="text-xs font-mono text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800 overflow-x-auto">
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
