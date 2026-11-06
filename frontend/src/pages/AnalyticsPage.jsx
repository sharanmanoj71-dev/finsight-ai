import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieIcon,
  Activity
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";
import StatCard from "../components/StatCard";
import { api } from "../services/api";

const PIE_COLORS = [
  "#10b981", "#3b82f6", "#8b5cf6", "#f59e0b",
  "#f43f5e", "#06b6d4", "#ec4899", "#84cc16"
];

export default function AnalyticsPage() {
  const [charts, setCharts] = useState(null);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [chData, ovData] = await Promise.all([
        api.analytics.getCharts({ start_date: startDate || undefined, end_date: endDate || undefined }),
        api.analytics.getOverview({ start_date: startDate || undefined, end_date: endDate || undefined })
      ]);
      setCharts(chData);
      setOverview(ovData);
    } catch (err) {
      console.error("Failed to load analytics data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [startDate, endDate]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-400 font-medium">Aggregating multi-period analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Date Filter Bar */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
          <Filter className="w-4 h-4 text-emerald-400" />
          <span>Analytics Time Horizons</span>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200"
            />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-slate-400">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200"
            />
          </div>
        </div>
      </div>

      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Inflows"
          amount={`$${(overview?.total_income || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          subtitle="Direct deposits & earnings"
          icon={ArrowUpRight}
          color="emerald"
        />
        <StatCard
          title="Total Outflows"
          amount={`$${(overview?.total_expenses || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          subtitle="Discretionary & fixed spending"
          icon={ArrowDownRight}
          color="rose"
        />
        <StatCard
          title="Daily Average Spend"
          amount={`$${(overview?.average_daily_spending || 0).toFixed(2)}`}
          subtitle="Expense velocity per day"
          icon={Activity}
          color="blue"
        />
        <StatCard
          title="Top Expense Driver"
          amount={overview?.highest_spending_category || "None"}
          subtitle={`$${(overview?.highest_category_amount || 0).toLocaleString()}`}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Main Charts: Income vs Expense & Category Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Month-over-Month Cash Inflows vs Outflows</h3>
              <p className="text-[11px] text-slate-400">Comparative revenue vs operational expenses</p>
            </div>
          </div>

          <div className="h-72 w-full">
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
                No monthly data found
              </div>
            )}
          </div>
        </div>

        {/* Category Share */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight mb-1">Category Share</h3>
            <p className="text-[11px] text-slate-400 mb-3">Percentage allocation of total debits</p>

            <div className="h-44 w-full">
              {charts?.category_spending?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.category_spending}
                      dataKey="amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={65}
                      paddingAngle={2}
                    >
                      {charts.category_spending.map((entry, index) => (
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
                  No data
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-800 max-h-40 overflow-y-auto">
            {(charts?.category_spending || []).map((c, i) => (
              <div key={c.category} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center space-x-2 truncate">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}></span>
                  <span className="text-slate-300 truncate">{c.category}</span>
                </div>
                <span className="font-semibold text-slate-100">{c.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Daily Spending Pattern Timeline */}
      <div className="glass-card rounded-2xl p-5 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Daily Spending Pattern</h3>
            <p className="text-[11px] text-slate-400">Day-by-day expenditure volume</p>
          </div>
        </div>

        <div className="h-64 w-full">
          {charts?.daily_spending?.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.daily_spending}>
                <defs>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "11px" }}
                  formatter={(val) => [`$${Number(val).toFixed(2)}`, ""]}
                />
                <Area type="monotone" dataKey="spent" name="Daily Spent" stroke="#3b82f6" fillOpacity={1} fill="url(#spendGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              No daily patterns recorded
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
