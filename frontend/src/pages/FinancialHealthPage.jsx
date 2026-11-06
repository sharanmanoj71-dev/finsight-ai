import React, { useState, useEffect } from "react";
import {
  HeartPulse,
  Award,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  ShieldCheck,
  Info,
  TrendingUp,
  Percent,
  RefreshCw
} from "lucide-react";
import { api } from "../services/api";

export default function FinancialHealthPage() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const data = await api.health.get();
      setHealth(data);
    } catch (err) {
      console.error("Failed to fetch health score:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-400 font-medium">Computing multi-factor financial wellness benchmarks...</p>
        </div>
      </div>
    );
  }

  const score = health?.overall_score || 0;
  const grade = health?.grade || "N/A";
  const breakdown = health?.breakdown || [];
  const strengths = health?.strengths || [];
  const weaknesses = health?.weaknesses || [];
  const risks = health?.risk_indicators || [];
  const suggestions = health?.improvement_suggestions || [];
  const recommendations = health?.personalized_recommendations || [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner & Grade */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
            <HeartPulse className="w-3 h-3" />
            <span>Transparent Health Index (0-100)</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">AI Financial Health Analyzer</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
            Evaluates savings rate, expense-to-income efficiency, deposit cadence, and recurring burden against certified personal finance benchmarks.
          </p>
        </div>

        {/* Circular / Radial Score Highlight */}
        <div className="flex items-center space-x-5 bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shrink-0">
          <div className="relative w-24 h-24 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-emerald-400 transition-all duration-1000 ease-out"
                strokeDasharray={`${score}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-white">{score}</span>
              <span className="text-[9px] text-slate-400 font-semibold uppercase">SCORE</span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400">Rating Grade:</span>
              <span className="text-sm font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                {grade}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {score >= 80 ? "Robust Financial Position" : score >= 60 ? "Moderate Resilience" : "Needs Optimization"}
            </p>
          </div>
        </div>
      </div>

      {/* Mandatory Disclaimer */}
      <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 flex items-start space-x-2.5">
        <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <p>
          <strong>Methodology Disclosure:</strong> {health?.disclaimer}
        </p>
      </div>

      {/* 6-Factor Benchmark Scorecards */}
      <div>
        <h3 className="text-sm font-bold text-white tracking-tight mb-3">6-Factor Wellness Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {breakdown.map((b) => {
            const statusColors = {
              excellent: "text-emerald-400 border-emerald-500/30 bg-emerald-500/5",
              good: "text-blue-400 border-blue-500/30 bg-blue-500/5",
              moderate: "text-amber-400 border-amber-500/30 bg-amber-500/5",
              needs_attention: "text-orange-400 border-orange-500/30 bg-orange-500/5",
              critical: "text-rose-400 border-rose-500/30 bg-rose-500/5"
            };
            const currentStyle = statusColors[b.status] || statusColors.good;

            return (
              <div key={b.name} className="glass-card rounded-xl p-5 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white">{b.name}</span>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${currentStyle}`}>
                      {b.status.replace("_", " ")}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between my-2">
                    <span className="text-xl font-bold text-white">{b.score} <span className="text-xs text-slate-400 font-normal">/ 100</span></span>
                    <span className="text-xs font-mono font-semibold text-emerald-400">{b.metric_value}</span>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                    {b.explanation}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between">
                  <span>Weight: {Math.round(b.weight * 100)}% of total</span>
                  <span>Contribution: +{(b.score * b.weight).toFixed(1)} pts</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Strengths & Weaknesses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
            <CheckCircle2 className="w-4 h-4" />
            <span>Key Financial Strengths</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-300">
            {strengths.map((s, idx) => (
              <li key={idx} className="flex items-start space-x-2 p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                <span className="text-emerald-400 font-bold">•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Weaknesses & Risk Indicators */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
          <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs">
            <AlertTriangle className="w-4 h-4" />
            <span>Risk Indicators & Vulnerabilities</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-300">
            {weaknesses.map((w, idx) => (
              <li key={idx} className="flex items-start space-x-2 p-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
                <span className="text-amber-400 font-bold">•</span>
                <span>{w}</span>
              </li>
            ))}
            {risks.map((r, idx) => (
              <li key={`risk-${idx}`} className="flex items-start space-x-2 p-2 rounded-lg bg-rose-500/5 border border-rose-500/10 text-rose-300">
                <span className="text-rose-400 font-bold">•</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Personalized Improvement Recommendations */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center space-x-2 text-white font-bold text-sm">
          <Lightbulb className="w-4 h-4 text-emerald-400" />
          <span>Actionable Monthly Optimization Levers</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {recommendations.map((rec, i) => (
            <div key={i} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-start space-x-3">
              <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0 border border-emerald-500/20">
                {i + 1}
              </span>
              <span className="leading-relaxed">{rec}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
