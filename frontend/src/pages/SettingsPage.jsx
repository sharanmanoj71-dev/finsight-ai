import React, { useState, useEffect } from "react";
import {
  Settings,
  Database,
  Shield,
  Tag,
  FileText,
  Trash2,
  Plus,
  CheckCircle2,
  RefreshCw,
  ExternalLink
} from "lucide-react";
import CategoryBadge from "../components/CategoryBadge";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function SettingsPage() {
  const { user, dbStatus } = useAuth();
  const [categories, setCategories] = useState([]);
  const [statements, setStatements] = useState([]);
  const [newCatName, setNewCatName] = useState("");
  const [newCatType, setNewCatType] = useState("expense");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cats, stmts] = await Promise.all([
        api.transactions.getCategories(),
        api.statements.list()
      ]);
      setCategories(cats || []);
      setStatements(stmts?.statements || []);
    } catch (err) {
      console.error("Failed to load settings data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      await api.transactions.addCategory(newCatName.trim(), newCatType);
      setNewCatName("");
      setMsg("Custom category added successfully!");
      loadData();
    } catch (err) {
      alert("Failed to add category: " + err.message);
    }
  };

  const handleDeleteStatement = async (stmtId) => {
    if (!confirm("Are you sure you want to delete this statement and its transactions?")) return;
    try {
      await api.statements.delete(stmtId);
      setMsg("Statement removed successfully.");
      loadData();
    } catch (err) {
      alert("Error deleting statement: " + err.message);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight">Application Settings & Configuration</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Manage Supabase database credentials, user identity, custom categories, and statement files.
        </p>
      </div>

      {msg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{msg}</span>
        </div>
      )}

      {/* Supabase & Firebase Infrastructure Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Supabase Status */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
              <Database className="w-4 h-4" />
              <span>Supabase Database Engine</span>
            </div>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Project Name:</span>
              <span className="font-semibold text-white">technovate</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Project ID:</span>
              <span className="font-mono text-emerald-400 font-semibold">pxacwjmgcxcxdtzjzyli</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Engine Mode:</span>
              <span className="text-slate-200">{dbStatus?.engine || "Supabase PostgreSQL"}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Endpoint:</span>
              <span className="font-mono text-[11px] text-slate-300 truncate max-w-xs">
                https://pxacwjmgcxcxdtzjzyli.supabase.co
              </span>
            </div>
          </div>
        </div>

        {/* Firebase Authentication Status */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-blue-400 font-bold text-xs">
              <Shield className="w-4 h-4" />
              <span>Firebase Authentication Provider</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/20">
              Active Session
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">User Identity:</span>
              <span className="font-semibold text-white truncate max-w-xs">{user?.displayName || "FinSight User"}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Email:</span>
              <span className="text-slate-200 truncate max-w-xs">{user?.email || "user@finsight.ai"}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Firebase UID:</span>
              <span className="font-mono text-[11px] text-slate-300 truncate max-w-xs">{user?.uid || "mock-uid"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Category Management */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <Tag className="w-4 h-4 text-emerald-400" />
            Category Taxonomy & Custom Labels
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            View available categorization classes and register personalized custom expense/income tags.
          </p>
        </div>

        {/* Add Category Form */}
        <form onSubmit={handleAddCategory} className="flex flex-wrap items-center gap-2 p-3 bg-slate-900 rounded-xl border border-slate-800">
          <input
            type="text"
            required
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="New Category Name (e.g. Pet Care, Gaming)..."
            className="flex-1 min-w-[200px] px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />

          <select
            value={newCatType}
            onChange={(e) => setNewCatType(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
            <option value="investment">Investment</option>
          </select>

          <button
            type="submit"
            className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs transition-colors"
          >
            Add Category
          </button>
        </form>

        {/* Existing Categories Pill Grid */}
        <div className="flex flex-wrap gap-2 pt-2">
          {categories.map((c) => (
            <CategoryBadge key={c.id || c.category_name} category={c.category_name} />
          ))}
        </div>
      </div>

      {/* Uploaded Statements Files Management */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" />
            Uploaded Bank Statement Files
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit files currently registered under your Firebase UID in Supabase.
          </p>
        </div>

        {statements.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800">
            No statement files recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-2.5">Filename</th>
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-4 py-2.5">Uploaded Date</th>
                  <th className="px-4 py-2.5">Closing Balance</th>
                  <th className="px-4 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {statements.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/30">
                    <td className="px-4 py-2.5 font-sans font-semibold text-slate-200">{s.filename}</td>
                    <td className="px-4 py-2.5 uppercase">{s.file_type}</td>
                    <td className="px-4 py-2.5 text-slate-400">{s.uploaded_at?.slice(0, 10)}</td>
                    <td className="px-4 py-2.5 text-emerald-400 font-bold">${Number(s.closing_balance || 0).toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => handleDeleteStatement(s.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                        title="Delete statement"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
