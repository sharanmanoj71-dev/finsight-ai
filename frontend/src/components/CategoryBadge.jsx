import React from "react";
import {
  Utensils,
  ShoppingBag,
  Car,
  Zap,
  HeartPulse,
  GraduationCap,
  Briefcase,
  ArrowRightLeft,
  Film,
  Home,
  TrendingUp,
  CircleDollarSign
} from "lucide-react";

export default function CategoryBadge({ category }) {
  const cat = category || "Other expenses";

  const config = {
    "Food and dining": { color: "text-amber-400 bg-amber-500/10 border-amber-500/20", icon: Utensils },
    "Shopping": { color: "text-blue-400 bg-blue-500/10 border-blue-500/20", icon: ShoppingBag },
    "Travel and transportation": { color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20", icon: Car },
    "Bills and utilities": { color: "text-orange-400 bg-orange-500/10 border-orange-500/20", icon: Zap },
    "Healthcare": { color: "text-rose-400 bg-rose-500/10 border-rose-500/20", icon: HeartPulse },
    "Education": { color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20", icon: GraduationCap },
    "Salary and income": { color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", icon: Briefcase },
    "Transfers": { color: "text-slate-300 bg-slate-500/10 border-slate-500/20", icon: ArrowRightLeft },
    "Entertainment": { color: "text-purple-400 bg-purple-500/10 border-purple-500/20", icon: Film },
    "Housing and rent": { color: "text-pink-400 bg-pink-500/10 border-pink-500/20", icon: Home },
    "Investments": { color: "text-teal-400 bg-teal-500/10 border-teal-500/20", icon: TrendingUp },
    "Other expenses": { color: "text-slate-400 bg-slate-700/20 border-slate-700/30", icon: CircleDollarSign },
  };

  const item = config[cat] || config["Other expenses"];
  const Icon = item.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${item.color}`}>
      <Icon className="w-3 h-3" />
      <span>{cat}</span>
    </span>
  );
}
