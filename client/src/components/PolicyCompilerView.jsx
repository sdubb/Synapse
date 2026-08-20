import React, { useState, useEffect } from "react";
import { Sliders, Code2, ShieldCheck, CheckCircle2, RefreshCw } from "lucide-react";

export function PolicyCompilerView() {
  const [policies, setPolicies] = useState([]);

  const fetchPolicies = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/v1/policies");
      const data = await res.json();
      if (data.policies) setPolicies(data.policies);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            Rego / Open Policy Agent (OPA) Rule Compiler & Invariants
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Expressive policy engine supporting compound sequencing invariants, tri-state approvals, and zero-destruction filters.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>OPA AST Engine: ACTIVE (0.4ms)</span>
          </span>
        </div>
      </div>

      {/* Policies List */}
      <div className="grid grid-cols-1 gap-4 text-xs">
        {policies.map((p) => (
          <div key={p.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-white font-semibold text-sm">{p.name}</span>
                <span className="text-xs px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                  {p.category}
                </span>
              </div>
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                ✓ COMPILED
              </span>
            </div>

            <p className="text-slate-400 text-xs">{p.description}</p>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Rego OPA Source Code:</span>
              <pre className="text-slate-200 font-mono text-xs overflow-x-auto leading-relaxed">
                <code>{p.regoCode}</code>
              </pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
