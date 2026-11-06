import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  DollarSign,
  Plus,
  RefreshCw,
  Sparkles,
  Check,
  Edit2
} from "lucide-react";
import CategoryBadge from "../components/CategoryBadge";
import TransactionModal from "../components/TransactionModal";
import { api } from "../services/api";

const CATEGORIES = [
  "Food and dining",
  "Shopping",
  "Travel and transportation",
  "Bills and utilities",
  "Healthcare",
  "Education",
  "Salary and income",
  "Transfers",
  "Entertainment",
  "Housing and rent",
  "Investments",
  "Other expenses"
];

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTxId, setEditingTxId] = useState(null);
  const [saveRuleForMerchant, setSaveRuleForMerchant] = useState(true);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const data = await api.transactions.list({
        search: search || undefined,
        category: selectedCategory || undefined,
        transaction_type: selectedType || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        limit: 500
      });
      setTransactions(data || []);
    } catch (err) {
      console.error("Failed to load transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [selectedCategory, selectedType, startDate, endDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTransactions();
  };

  const handleCategoryChange = async (txId, newCategory, merchant) => {
    try {
      await api.transactions.update(txId, {
        category: newCategory,
        save_as_rule: saveRuleForMerchant
      });
      setEditingTxId(null);
      // Update local state
      setTransactions((prev) =>
        prev.map((t) => (t.id === txId ? { ...t, category: newCategory, is_reviewed: true } : t))
      );
    } catch (err) {
      alert(`Error updating category: ${err.message}`);
    }
  };

  const handleToggleReviewed = async (txId, currentReviewed) => {
    try {
      await api.transactions.update(txId, {
        is_reviewed: !currentReviewed
      });
      setTransactions((prev) =>
        prev.map((t) => (t.id === txId ? { ...t, is_reviewed: !currentReviewed } : t))
      );
    } catch (err) {
      console.error("Failed to toggle review:", err);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Filter Bar */}
      <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by merchant, store, or memo..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </form>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs transition-colors shadow-sm shadow-emerald-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Transaction</span>
            </button>
            <button
              onClick={fetchTransactions}
              title="Refresh"
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80">
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Types</option>
              <option value="debit">Expense (Debit)</option>
              <option value="credit">Income (Credit)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Showing <strong className="text-white">{transactions.length}</strong> recorded transactions</span>
          <div className="flex items-center gap-1.5 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>AI categorized • Click category to reclassify & remember rule</span>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-400" />
            Loading transactions...
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No transactions match the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Merchant / Payee</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                    {/* Date */}
                    <td className="px-4 py-3 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                      {tx.transaction_date}
                    </td>

                    {/* Merchant */}
                    <td className="px-4 py-3 whitespace-nowrap font-semibold text-slate-200">
                      {tx.merchant || "Bank Item"}
                    </td>

                    {/* Description */}
                    <td className="px-4 py-3 max-w-sm truncate text-slate-400">
                      {tx.description}
                    </td>

                    {/* Category with in-place editor */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {editingTxId === tx.id ? (
                        <div className="flex items-center gap-2">
                          <select
                            autoFocus
                            defaultValue={tx.category}
                            onChange={(e) => handleCategoryChange(tx.id, e.target.value, tx.merchant)}
                            onBlur={() => setEditingTxId(null)}
                            className="bg-slate-900 border border-emerald-500 rounded px-2 py-1 text-xs text-white"
                          >
                            {CATEGORIES.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingTxId(tx.id)}
                          className="group flex items-center gap-1.5 hover:opacity-85 text-left"
                          title="Click to reclassify category"
                        >
                          <CategoryBadge category={tx.category} />
                          <Edit2 className="w-2.5 h-2.5 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      )}
                    </td>

                    {/* Amount */}
                    <td className={`px-4 py-3 whitespace-nowrap text-right font-mono font-bold text-xs ${
                      tx.transaction_type === "credit" ? "text-emerald-400" : "text-slate-100"
                    }`}>
                      {tx.transaction_type === "credit" ? "+" : "-"}${Number(tx.amount).toFixed(2)}
                    </td>

                    {/* Reviewed */}
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleToggleReviewed(tx.id, tx.is_reviewed)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                          tx.is_reviewed
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <Check className="w-3 h-3" />
                        <span>{tx.is_reviewed ? "Reviewed" : "Review"}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchTransactions}
      />
    </div>
  );
}
