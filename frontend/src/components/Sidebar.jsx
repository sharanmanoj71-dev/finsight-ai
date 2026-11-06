import React from "react";
import {
  LayoutDashboard,
  UploadCloud,
  ReceiptText,
  BarChart3,
  RefreshCw,
  AlertTriangle,
  HeartPulse,
  TrendingUp,
  PiggyBank,
  BotMessageSquare,
  Settings,
  LogOut,
  Database,
  ShieldCheck,
  ChevronRight
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Sidebar({ activeTab, setActiveTab }) {
  const { user, logout, dbStatus } = useAuth();

  const navItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "upload", label: "Upload Statement", icon: UploadCloud, badge: "AI Extract" },
    { id: "transactions", label: "Transactions", icon: ReceiptText },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "recurring", label: "Recurring Payments", icon: RefreshCw },
    { id: "anomalies", label: "Anomaly Detection", icon: AlertTriangle, badge: "Alerts" },
    { id: "health", label: "Financial Health", icon: HeartPulse },
    { id: "cashflow", label: "Cash-Flow Forecast", icon: TrendingUp },
    { id: "budgets", label: "Budget Planner", icon: PiggyBank },
    { id: "assistant", label: "AI Assistant", icon: BotMessageSquare, badge: "AI" },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0c1222] border-r border-slate-800 flex flex-col h-screen select-none shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl gradient-emerald flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
              FinSight <span className="text-emerald-400 font-extrabold text-xs px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">AI</span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">Bank Statement Intelligence</p>
          </div>
        </div>
      </div>

      {/* Supabase Connection Status Pill */}
      <div className="px-4 py-2.5 bg-slate-900/60 border-b border-slate-800/50">
        <div className="flex items-center justify-between text-[11px]">
          <div className="flex items-center space-x-1.5 text-slate-300">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold text-slate-200">Supabase: technovate</span>
          </div>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </div>
        <p className="text-[10px] text-slate-400 mt-0.5 truncate">pxacwjmgcxcxdtzjzyli</p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                isActive
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent"
              }`}
            >
              <div className="flex items-center space-x-3">
                {item.id === "assistant" ? (
                  <div className="w-4.5 h-4.5 rounded-full overflow-hidden border border-emerald-400/80 shadow-sm shrink-0 bg-slate-950 flex items-center justify-center">
                    <video
                      src="/chatbot-avatar.webm"
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover scale-110 pointer-events-none"
                    />
                  </div>
                ) : (
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? "text-emerald-400" : "text-slate-400 group-hover:text-slate-200"
                    }`}
                  />
                )}
                <span className="tracking-wide">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                    item.badge === "Alerts"
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Profile & Logout Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs text-white uppercase border border-slate-600 shrink-0">
              {user?.displayName ? user.displayName.charAt(0) : "U"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">
                {user?.displayName || "FinSight User"}
              </p>
              <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                Firebase UID: {user?.uid ? `${user.uid.slice(0, 8)}...` : "active"}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign Out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
