import React, { useState, useEffect } from "react";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  Calendar,
  AlertTriangle,
  RefreshCw,
  HeartPulse,
  TrendingUp,
  Sparkles,
  ChevronRight,
  UploadCloud,
  CheckCircle2,
  FileCheck
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";
import StatCard from "../components/StatCard";
import CategoryBadge from "../components/CategoryBadge";
import SeverityBadge from "../components/SeverityBadge";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

const PIE_COLORS = [
  "#10b981", "#3b82f6", "#8b5cf6", "#f59e0b",
  "#f43f5e", "#06b6d4", "#ec4899", "#84cc16"
];

export default function DashboardPage({ setActiveTab }) {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [charts, setCharts] = useState(null);
  const [health, setHealth] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [recurring, setRecurring] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [ovData, chData, hlData, anData, rcData] = await Promise.all([
        api.analytics.getOverview(),
        api.analytics.getCharts(),
        api.health.get().catch(() => null),
        api.anomalies.list().catch(() => []),
        api.recurring.get().catch(() => null)
      ]);

      setOverview(ovData);
      setCharts(chData);
      setHealth(hlData);
      setAnomalies(anData || []);
      setRecurring(rcData);
    } catch (err) {
      console.error("Dashboard data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-400 font-medium">Computing financial intelligence metrics...</p>
        </div>
      </div>
    );
  }

  const hasData = overview && overview.has_data;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner / Welcome */}
      <div className="glass-card rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-slate-800">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
            <Sparkles className="w-3 h-3" />
            <span>AI Financial Intelligence Active</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Welcome back, {user?.displayName || "FinSight User"} 👋
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            {hasData
              ? `You have analyzed ${overview.total_transactions} transactions. Current estimated liquid balance is $${overview.estimated_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}.`
              : "Upload your checking or savings bank statement to automatically analyze cash flow, detect recurring expenses, and evaluate financial health."}
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10 shrink-0">
          <button
            onClick={() => setActiveTab("upload")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs transition-all shadow-lg shadow-emerald-500/20"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Statement</span>
          </button>
          <button
            onClick={() => setActiveTab("assistant")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition-colors"
          >
            <span>Ask FinSight</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Empty State Callout if no data */}
      {!hasData && (
        <div className="glass-card rounded-2xl p-8 border border-dashed border-emerald-500/30 text-center">
          <div className="w-14 h-14 rounded-2xl gradient-emerald mx-auto flex items-center justify-center mb-4 shadow-xl shadow-emerald-500/20">
            <UploadCloud className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">No Statement Data Uploaded Yet</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-5 leading-relaxed">
            FinSight AI needs your bank statement (PDF or CSV) to extract transactions, recognize merchants, identify subscriptions, and predict cash flows.
          </p>
          <button
            onClick={() => setActiveTab("upload")}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs transition-colors shadow-lg shadow-emerald-500/25"
          >
            Upload Statement Now
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Income"
          amount={`$${(overview?.total_income || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          subtitle="All recorded inflows"
          change="+100%"
          isPositive={true}
          icon={ArrowUpRight}
          color="emerald"
        />
        <StatCard
          title="Total Expenses"
          amount={`$${(overview?.total_expenses || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          subtitle="All recorded outflows"
          change={overview?.month_over_month_pct ? `${overview.month_over_month_pct}% MoM` : undefined}
          isPositive={overview?.month_over_month_pct <= 0}
          icon={ArrowDownRight}
          color="rose"
        />
        <StatCard
          title="Net Savings"
          amount={`$${(overview?.net_savings || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          subtitle={`Savings rate: ${overview?.monthly_savings_rate || 0}%`}
          isPositive={(overview?.net_savings || 0) >= 0}
          icon={PiggyBank}
          color="purple"
        />
        <StatCard
          title="Estimated Balance"
          amount={`$${(overview?.estimated_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          subtitle={`Avg spend: $${(overview?.average_daily_spending || 0).toFixed(2)}/day`}
          icon={Wallet}
          color="blue"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income vs Expenses Chart */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Income vs Expenses Trend</h3>
              <p className="text-[11px] text-slate-400">Monthly cash-inflow and outlay distribution</p>
            </div>
            <button
              onClick={() => setActiveTab("analytics")}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
            >
              <span>View Details</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 w-full">
            {charts?.income_vs_expense?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.income_vs_expense}>
                  <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(val) => `$${val}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "12px" }}
                    formatter={(val) => [`$${Number(val).toLocaleString()}`, ""]}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                  <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Awaiting statement data to plot monthly comparison
              </div>
            )}
          </div>
        </div>

        {/* Category Breakdown Pie Chart */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Expense Allocation</h3>
              <p className="text-[11px] text-slate-400">Top spending categories</p>
            </div>
          </div>

          <div className="h-44 w-full">
            {charts?.category_spending?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.category_spending.slice(0, 6)}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={68}
                    paddingAngle={3}
                  >
                    {charts.category_spending.slice(0, 6).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "11px" }}
                    formatter={(val) => [`$${Number(val).toFixed(2)}`, ""]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No category data
              </div>
            )}
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-800">
            {(charts?.category_spending || []).slice(0, 4).map((c, i) => (
              <div key={c.category} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center space-x-2 truncate">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}></span>
                  <span className="text-slate-300 truncate">{c.category}</span>
                </div>
                <span className="font-semibold text-slate-100">${c.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row: Financial Health Card & Anomalies & Subscriptions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Health Score Teaser */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <HeartPulse className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Financial Health Score</h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                Grade: {health?.grade || "A"}
              </span>
            </div>

            <div className="flex items-baseline space-x-2 my-4">
              <span className="text-5xl font-black text-white">{health?.overall_score || 82}</span>
              <span className="text-xs text-slate-400">/ 100 benchmark</span>
            </div>

            <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
              {health?.strengths?.[0] || "Upload your bank statements to evaluate savings rate, recurring burden and cash flow stability."}
            </p>
          </div>

          <button
            onClick={() => setActiveTab("health")}
            className="w-full mt-4 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-emerald-400 flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
          >
            <span>Explore 6-Factor Health Breakdown</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Unusual Activity Alerts Preview */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Unusual Activity Flags</h3>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-semibold">
                {anomalies.length} Flagged
              </span>
            </div>

            <div className="space-y-2 mt-2">
              {anomalies.length > 0 ? (
                anomalies.slice(0, 2).map((a) => (
                  <div key={a.id} className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-200 truncate">{a.merchant || a.anomaly_type}</span>
                      <SeverityBadge severity={a.severity} />
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{a.explanation}</p>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-500">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-1.5 opacity-80" />
                  No unusual spending anomalies detected.
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => setActiveTab("anomalies")}
            className="w-full mt-4 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
          >
            <span>Review Activity Indicators</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Upcoming Recurring Subscriptions */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <RefreshCw className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Scheduled Subscriptions</h3>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                ${recurring?.total_monthly_recurring || 0}/mo
              </span>
            </div>

            <div className="space-y-2 mt-2">
              {(recurring?.items || []).length > 0 ? (
                recurring.items.slice(0, 3).map((r, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 text-xs">
                    <div className="min-w-0 pr-2">
                      <p className="font-semibold text-slate-200 truncate">{r.merchant}</p>
                      <p className="text-[10px] text-slate-400 capitalize">{r.frequency} • Next: {r.next_expected_date || "Upcoming"}</p>
                    </div>
                    <span className="font-bold text-white shrink-0">${r.amount.toFixed(2)}</span>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-500">
                  No recurring payments detected yet.
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => setActiveTab("recurring")}
            className="w-full mt-4 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-blue-400 flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
          >
            <span>Manage Recurring Commitments</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
