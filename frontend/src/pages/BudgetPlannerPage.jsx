import React, { useState, useEffect } from "react";
import {
  PiggyBank,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Plus,
  Edit2,
  DollarSign,
  Lightbulb,
  X,
  Sparkles
} from "lucide-react";
import CategoryBadge from "../components/CategoryBadge";
import { api } from "../services/api";

const CATEGORIES = [
  "Food and dining",
  "Shopping",
  "Travel and transportation",
  "Bills and utilities",
  "Healthcare",
  "Education",
  "Entertainment",
  "Housing and rent",
  "Investments",
  "Other expenses"
];

export default function BudgetPlannerPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState("Food and dining");
  const [editLimit, setEditLimit] = useState("");

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const res = await api.budgets.get(selectedMonth, selectedYear);
      setData(res);
    } catch (err) {
      console.error("Failed to load budgets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [selectedMonth, selectedYear]);

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    if (!editLimit || parseFloat(editLimit) <= 0) return;
    try {
      await api.budgets.upsert({
        category: editCategory,
        monthly_limit: parseFloat(editLimit),
        month: selectedMonth,
        year: selectedYear
      });
      setEditModalOpen(false);
      setEditLimit("");
      fetchBudgets();
    } catch (err) {
      alert("Failed to save budget: " + err.message);
    }
  };

  const openEditModal = (cat, currentLimit) => {
    setEditCategory(cat);
    setEditLimit(currentLimit ? currentLimit.toString() : "500");
    setEditModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-400 font-medium">Balancing budget allocations against actual expenditures...</p>
        </div>
      </div>
    );
  }

  const categories = data?.categories || [];
  const warnings = data?.warnings || [];
  const recommendations = data?.recommendations || [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner with Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Personalized Budget Planner</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Set category limits, monitor real-time utilization, and receive overspending alerts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Month/Year selector */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200">
            <span className="text-slate-400 mr-2 font-medium">Period:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="bg-transparent text-emerald-400 font-bold focus:outline-none cursor-pointer"
            >
              {[
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
              ].map((m, idx) => (
                <option key={m} value={idx + 1} className="bg-slate-900 text-white">{m}</option>
              ))}
            </select>
            <span className="mx-1 text-slate-600">/</span>
            <span>{selectedYear}</span>
          </div>

          <button
            onClick={() => openEditModal("Food and dining", 600)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs transition-colors shadow-sm shadow-emerald-500/20 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Set Category Limit</span>
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-5 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Planned Budget</span>
          <p className="text-2xl font-bold text-white mt-1">
            ${(data?.total_budget || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="glass-card rounded-xl p-5 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Actual Spent This Month</span>
          <p className="text-2xl font-bold text-rose-400 mt-1">
            ${(data?.total_spent || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="glass-card rounded-xl p-5 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Remaining Cushion</span>
          <p className={`text-2xl font-bold mt-1 ${(data?.total_remaining || 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            ${(data?.total_remaining || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="glass-card rounded-xl p-5 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Overall Utilization</span>
          <p className="text-2xl font-bold text-purple-400 mt-1">
            {data?.overall_percent || 0}%
          </p>
        </div>
      </div>

      {/* Warnings & AI Recommendations */}
      {warnings.length > 0 && (
        <div className="glass-card rounded-2xl p-5 border border-rose-500/30 bg-rose-500/5 space-y-2">
          <div className="flex items-center space-x-2 text-rose-400 font-bold text-xs">
            <AlertTriangle className="w-4 h-4" />
            <span>Active Budget Warnings ({warnings.length})</span>
          </div>
          <div className="space-y-1 text-xs text-rose-200">
            {warnings.map((w, idx) => (
              <p key={idx}>• {w}</p>
            ))}
          </div>
        </div>
      )}

      {/* Category Budgets Grid */}
      <div>
        <h3 className="text-sm font-bold text-white tracking-tight mb-3">Category Allocations & Spent Progress</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((c) => {
            const isOver = c.is_overbudget;
            const pct = Math.min(100, c.percent_used || 0);

            return (
              <div
                key={c.category}
                className={`glass-card rounded-xl p-5 border transition-all ${
                  isOver ? "border-rose-500/40 bg-rose-500/5" : "border-slate-800"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <CategoryBadge category={c.category} />
                  <button
                    onClick={() => openEditModal(c.category, c.monthly_limit)}
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Edit category budget"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-baseline justify-between mb-2">
                  <div>
                    <span className="text-lg font-bold text-white font-mono">${c.actual_spent.toFixed(2)}</span>
                    <span className="text-xs text-slate-400 ml-1">/ ${c.monthly_limit.toFixed(2)}</span>
                  </div>
                  <span className={`text-xs font-bold font-mono ${isOver ? "text-rose-400" : "text-emerald-400"}`}>
                    {c.percent_used}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isOver ? "bg-rose-500" : c.percent_used >= 80 ? "bg-amber-400" : "bg-emerald-400"
                    }`}
                    style={{ width: `${pct}%` }}
                  ></div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                  <span>{isOver ? "Over budget by:" : "Remaining limit:"}</span>
                  <span className={`font-mono font-semibold ${isOver ? "text-rose-400" : "text-slate-200"}`}>
                    ${Math.abs(c.remaining).toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Budget Guidance */}
      {recommendations.length > 0 && (
        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-2">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
            <Lightbulb className="w-4 h-4" />
            <span>AI Budget Recommendations</span>
          </div>
          <div className="space-y-1 text-xs text-slate-300">
            {recommendations.map((r, i) => (
              <p key={i}>• {r}</p>
            ))}
          </div>
        </div>
      )}

      {/* Edit Budget Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-card rounded-2xl border border-slate-700 w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Set Category Monthly Budget</h3>
              <button onClick={() => setEditModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Category</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Monthly Limit ($)</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  required
                  value={editLimit}
                  onChange={(e) => setEditLimit(e.target.value)}
                  placeholder="e.g. 600"
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  Save Budget Cap
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
