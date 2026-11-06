import React from "react";
import { UploadCloud, Plus, Bell, Sparkles } from "lucide-react";

export default function Header({ activeTab, onUploadClick, onNewTransactionClick }) {
  const titles = {
    overview: { title: "Financial Overview", subtitle: "Comprehensive real-time statement intelligence & KPIs" },
    upload: { title: "Bank Statement Upload", subtitle: "Multi-format PDF & CSV parsing with AI extraction preview" },
    transactions: { title: "Transactions Registry", subtitle: "Categorized transactions, merchant tags & rule memory" },
    analytics: { title: "Financial Analytics", subtitle: "Interactive spending trends, cash flows & category distributions" },
    recurring: { title: "Recurring Payments", subtitle: "Detected subscriptions, utility commitments & frequency projections" },
    anomalies: { title: "Anomaly Detection", subtitle: "Statistical activity outliers & unusual transaction indicators" },
    health: { title: "Financial Health Analyzer", subtitle: "Explainable 0–100 wellness scoring & multi-dimensional benchmarks" },
    cashflow: { title: "Cash-Flow Forecasting", subtitle: "Predictive 7, 30 & 90-day balance trajectories & shortage warnings" },
    budgets: { title: "Budget Planner", subtitle: "Category limits, overspending alerts & adaptive budget allocations" },
    assistant: { title: "FinSight AI Assistant", subtitle: "Conversational advisor grounded directly in your financial data" },
    settings: { title: "Settings & Infrastructure", subtitle: "Supabase database, Firebase authentication & custom taxonomy" }
  };

  const current = titles[activeTab] || { title: "FinSight AI", subtitle: "Financial intelligence platform" };

  return (
    <header className="h-18 bg-[#0c1222]/80 backdrop-blur-md border-b border-slate-800/80 px-6 flex items-center justify-between shrink-0 sticky top-0 z-10">
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          {current.title}
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">{current.subtitle}</p>
      </div>

      <div className="flex items-center space-x-3">
        <button
          onClick={onUploadClick}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-xs transition-colors shadow-sm shadow-emerald-500/20"
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>Upload Statement</span>
        </button>

        <button
          onClick={onNewTransactionClick}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Transaction</span>
        </button>
      </div>
    </header>
  );
}
