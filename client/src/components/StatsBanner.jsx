import React from "react";
import { ShieldAlert, DollarSign, Undo2, Zap, Database } from "lucide-react";

export function StatsBanner({ stats }) {
  const formatUsd = (num) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num || 0);
  };

  const statCards = [
    {
      title: "Prevented Loss / Damage",
      value: formatUsd(stats.preventedFinancialLossUsd),
      subtitle: "Saved from hallucinated actions",
      icon: DollarSign,
      color: "text-emerald-400",
      bgGradient: "from-emerald-500/10 to-transparent",
      borderColor: "border-emerald-500/30"
    },
    {
      title: "Threats & Breaches Intercepted",
      value: stats.blockedThreats || 0,
      subtitle: "Blocked before execution",
      icon: ShieldAlert,
      color: "text-rose-400",
      bgGradient: "from-rose-500/10 to-transparent",
      borderColor: "border-rose-500/30"
    },
    {
      title: "Automated Rollbacks Triggered",
      value: stats.rollbacksExecuted || 0,
      subtitle: "Compensated multi-step states",
      icon: Undo2,
      color: "text-indigo-400",
      bgGradient: "from-indigo-500/10 to-transparent",
      borderColor: "border-indigo-500/30"
    },
    {
      title: "Sanitized / Redacted PII",
      value: stats.sanitizedActions || 0,
      subtitle: "Masked secrets & identities",
      icon: Zap,
      color: "text-amber-400",
      bgGradient: "from-amber-500/10 to-transparent",
      borderColor: "border-amber-500/30"
    },
    {
      title: "Verified Audit Blocks",
      value: stats.verifiedChainBlocks || 0,
      subtitle: "Cryptographic SHA-256 chain",
      icon: Database,
      color: "text-cyan-400",
      bgGradient: "from-cyan-500/10 to-transparent",
      borderColor: "border-cyan-500/30"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {statCards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div
            key={i}
            className={`p-4 rounded-xl bg-surface border ${card.borderColor} bg-gradient-to-b ${card.bgGradient} relative overflow-hidden group hover:border-indigo-500/50 transition-all duration-300`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">{card.title}</span>
              <Icon className={`w-4 h-4 ${card.color}`} />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white tracking-tight font-mono">
                {card.value}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">{card.subtitle}</p>
          </div>
        );
      })}
    </div>
  );
}
