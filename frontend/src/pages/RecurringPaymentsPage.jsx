import React, { useState, useEffect } from "react";
import {
  RefreshCw,
  Calendar,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingDown,
  DollarSign
} from "lucide-react";
import StatCard from "../components/StatCard";
import CategoryBadge from "../components/CategoryBadge";
import { api } from "../services/api";

export default function RecurringPaymentsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRecurring = async () => {
    setLoading(true);
    try {
      const res = await api.recurring.get();
      setData(res);
    } catch (err) {
      console.error("Failed to load recurring payments:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await api.recurring.refresh();
      setData(res);
    } catch (err) {
      alert("Failed to refresh: " + err.message);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecurring();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-400 font-medium">Detecting recurring merchant cadences...</p>
        </div>
      </div>
    );
  }

  const items = data?.items || [];
  const forgotten = data?.forgotten_subscription_alerts || [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner with Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Recurring Commitments & Subscriptions</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Automatically isolated repeating subscriptions, rent, utilities, and scheduled payments.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition-colors disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-emerald-400" : ""}`} />
          <span>{refreshing ? "Re-evaluating Cadences..." : "Refresh Detection"}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Monthly Recurring Burden"
          amount={`$${(data?.total_monthly_recurring || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          subtitle="Fixed monthly commitments"
          icon={Calendar}
          color="blue"
        />
        <StatCard
          title="Annualized Outlay"
          amount={`$${(data?.total_annual_recurring || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          subtitle="Total yearly projected cost"
          icon={TrendingDown}
          color="purple"
        />
        <StatCard
          title="Active Subscriptions"
          amount={data?.total_subscriptions || 0}
          subtitle="Identified recurring services"
          icon={Clock}
          color="emerald"
        />
      </div>

      {/* Forgotten Subscriptions Alert Banner */}
      {forgotten.length > 0 && (
        <div className="glass-card rounded-2xl p-5 border border-amber-500/30 bg-amber-500/5 space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <h3 className="text-sm font-bold text-amber-200">
              Potential Forgotten Subscriptions Detected ({forgotten.length})
            </h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            FinSight identified recurring charges with long continuous durations and low direct interaction. Review these to verify you are actively utilizing them:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {forgotten.map((f, i) => (
              <div key={i} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white">{f.merchant}</p>
                  <p className="text-[11px] text-slate-400">${f.amount.toFixed(2)} / {f.frequency} • ~${f.annual_cost.toFixed(2)}/yr</p>
                  <p className="text-[10px] text-amber-300/80 mt-0.5">{f.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recurring Payments Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Active Recurring List (<strong className="text-white">{items.length}</strong>)</span>
          <span className="text-[11px] text-slate-400">Estimated next expected billing dates</span>
        </div>

        {items.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No recurring payments detected yet. Upload bank statements to identify recurring subscriptions.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Merchant / Payee</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Frequency</th>
                  <th className="px-4 py-3">Next Expected Date</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {items.map((r, idx) => (
                  <tr key={r.id || idx} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap font-semibold text-slate-200">
                      {r.merchant}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <CategoryBadge category={r.category} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="capitalize px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 border border-slate-700 text-slate-300">
                        {r.frequency}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-[11px] text-slate-300">
                      {r.next_expected_date || "Upcoming"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right font-mono font-bold text-xs text-white">
                      ${Number(r.amount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
