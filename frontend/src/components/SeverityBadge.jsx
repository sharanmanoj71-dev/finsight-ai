import React from "react";
import { AlertCircle, AlertTriangle, Info, Flame } from "lucide-react";

export default function SeverityBadge({ severity }) {
  const sev = (severity || "low").toLowerCase();

  const configs = {
    critical: {
      label: "Critical Outlier",
      style: "bg-rose-500/15 text-rose-300 border-rose-500/30",
      icon: Flame
    },
    high: {
      label: "High Severity",
      style: "bg-amber-500/15 text-amber-300 border-amber-500/30",
      icon: AlertCircle
    },
    medium: {
      label: "Medium Deviation",
      style: "bg-blue-500/15 text-blue-300 border-blue-500/30",
      icon: AlertTriangle
    },
    low: {
      label: "Low Advisory",
      style: "bg-slate-700/30 text-slate-300 border-slate-700/50",
      icon: Info
    }
  };

  const item = configs[sev] || configs.low;
  const Icon = item.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${item.style}`}>
      <Icon className="w-3 h-3" />
      <span>{item.label}</span>
    </span>
  );
}
