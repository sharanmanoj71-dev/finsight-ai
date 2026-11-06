import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  AlertOctagon,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  Info,
  Clock
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine
} from "recharts";
import StatCard from "../components/StatCard";
import { api } from "../services/api";

export default function CashFlowPredictionPage() {
  const [forecast, setForecast] = useState(null);
  const [horizon, setHorizon] = useState(90);
  const [loading, setLoading] = useState(true);

  const fetchForecast = async (days) => {
    setLoading(true);
    try {
      const data = await api.cashflow.getForecast(days);
      setForecast(data);
    } catch (err) {
      console.error("Failed to load cash flow forecast:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast(horizon);
  }, [horizon]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-400 font-medium">Simulating stochastic cash flow models across 90-day horizon...</p>
        </div>
      </div>
    );
  }

  const timeline = forecast?.timeline || [];
  const shortages = forecast?.possible_shortages || [];
  const pressure = forecast?.upcoming_payment_pressure || [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner & Horizon Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Predictive Cash-Flow Simulation</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Forward-looking cash trajectory integrating recurring schedules, seasonal spending, and daily velocity.
          </p>
        </div>

        {/* Horizon Tabs */}
        <div className="flex items-center p-1 bg-slate-900 rounded-xl border border-slate-800 shrink-0">
          {[
            { label: "7 Days", val: 7 },
            { label: "30 Days", val: 30 },
            { label: "90 Days", val: 90 },
          ].map((h) => (
            <button
              key={h.val}
              onClick={() => setHorizon(h.val)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                horizon === h.val
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {h.label}
            </button>
          ))}
        </div>
      </div>

      {/* Forecast Balances Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          title="Current Balance"
          amount={`$${(forecast?.current_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          subtitle="Starting baseline"
          icon={Calendar}
          color="blue"
        />
        <StatCard
          title="7-Day Projected"
          amount={`$${(forecast?.forecast_7d_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          subtitle="Next week expectation"
          icon={TrendingUp}
          color="emerald"
        />
        <StatCard
          title="30-Day Projected"
          amount={`$${(forecast?.forecast_30d_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          subtitle="Next month expectation"
          icon={TrendingUp}
          color="purple"
        />
        <StatCard
          title="90-Day Projected"
          amount={`$${(forecast?.forecast_90d_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          subtitle="Quarter-end trajectory"
          icon={TrendingUp}
          color="amber"
        />
      </div>

      {/* Main Forecast Chart */}
      <div className="glass-card rounded-2xl p-5 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Cash Balance Projection ({horizon} Days)
            </h3>
            <p className="text-[11px] text-slate-400">
              Solid line represents median projection; shaded corridor denotes 95% confidence variance
            </p>
          </div>
        </div>

        <div className="h-72 w-full">
          {timeline.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline}>
                <defs>
                  <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "11px" }}
                  formatter={(val, name) => [`$${Number(val).toLocaleString()}`, name === "predicted_balance" ? "Predicted Balance" : name]}
                />
                <ReferenceLine y={0} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: "Deficit Threshold ($0)", fill: "#f43f5e", fontSize: 10 }} />
                <Area type="monotone" dataKey="confidence_upper" stroke="none" fill="#3b82f6" fillOpacity={0.1} />
                <Area type="monotone" dataKey="confidence_lower" stroke="none" fill="#0f172a" fillOpacity={1} />
                <Area type="monotone" dataKey="predicted_balance" stroke="#10b981" strokeWidth={2.5} fill="url(#balanceGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              Awaiting transaction data to plot forecast
            </div>
          )}
        </div>
      </div>

      {/* Warnings & Payment Pressure Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Shortages Early Warnings */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
          <div className="flex items-center space-x-2 text-rose-400 font-bold text-xs">
            <AlertOctagon className="w-4 h-4" />
            <span>Projected Liquidity Shortages ({shortages.length})</span>
          </div>

          {shortages.length === 0 ? (
            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-xs text-emerald-300">
              No cash shortages projected within the selected {horizon}-day horizon. Liquid reserves remain solvent.
            </div>
          ) : (
            <div className="space-y-2">
              {shortages.map((s, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-rose-300">Date: {s.date}</span>
                    <span className="font-mono text-rose-400 font-semibold">Deficit: ${s.deficit}</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">{s.reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Pressure Heatmap */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
          <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs">
            <Clock className="w-4 h-4" />
            <span>High Payment Pressure Events ({pressure.length})</span>
          </div>

          {pressure.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
              No heavy clustered payment dates exceeding daily thresholds detected.
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {pressure.map((p, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-white">{p.date}</span>
                    <p className="text-[10px] text-slate-400 truncate max-w-xs">{p.commitments?.join(", ")}</p>
                  </div>
                  <span className="font-bold font-mono text-amber-400">${p.total_due.toFixed(2)} due</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Assumptions & Limitations Accordion */}
      <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3 text-xs text-slate-400">
        <h4 className="font-bold text-slate-200">Simulation Assumptions & Methodological Constraints</h4>
        <ul className="list-disc pl-5 space-y-1 text-[11px] leading-relaxed">
          {(forecast?.assumptions || []).map((a, i) => (
            <li key={`a-${i}`}>{a}</li>
          ))}
          {(forecast?.limitations || []).map((l, i) => (
            <li key={`l-${i}`} className="text-slate-500">{l}</li>
          ))}
        </ul>
        <p className="pt-2 text-[10px] text-slate-500 border-t border-slate-800">
          {forecast?.disclaimer}
        </p>
      </div>
    </div>
  );
}
