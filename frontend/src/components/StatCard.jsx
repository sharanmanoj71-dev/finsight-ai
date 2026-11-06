import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatCard({ title, amount, subtitle, change, isPositive, icon: Icon, color = "emerald" }) {
  const colorMap = {
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/5",
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20 shadow-blue-500/5",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/20 shadow-purple-500/5",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20 shadow-amber-500/5",
    rose: "text-rose-400 bg-rose-500/10 border-rose-500/20 shadow-rose-500/5",
  };

  const selectedColor = colorMap[color] || colorMap.emerald;

  return (
    <div className="glass-card glass-card-hover rounded-xl p-5 relative overflow-hidden flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className={`p-2.5 rounded-lg border ${selectedColor}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div>
        <div className="text-2xl font-bold tracking-tight text-white mb-1">
          {amount}
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">{subtitle}</span>
          {change !== undefined && change !== null && (
            <span
              className={`inline-flex items-center gap-0.5 font-semibold text-[11px] px-1.5 py-0.5 rounded ${
                isPositive
                  ? "text-emerald-400 bg-emerald-500/10"
                  : "text-rose-400 bg-rose-500/10"
              }`}
            >
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {change}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
