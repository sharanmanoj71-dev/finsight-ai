import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  MessageSquare,
  RefreshCw,
  Info,
  Calendar,
  DollarSign
} from "lucide-react";
import SeverityBadge from "../components/SeverityBadge";
import CategoryBadge from "../components/CategoryBadge";
import { api } from "../services/api";

export default function AnomalyDetectionPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [noteText, setNoteText] = useState("");

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const data = await api.anomalies.list();
      setAlerts(data || []);
    } catch (err) {
      console.error("Failed to load anomaly alerts:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await api.anomalies.refresh();
      await fetchAlerts();
    } catch (err) {
      alert("Failed to refresh: " + err.message);
    } finally {
      setRefreshing(false);
    }
  };

  const handleReview = async (alertId, reviewed, note = null) => {
    try {
      await api.anomalies.review(alertId, { reviewed, user_note: note });
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, reviewed, user_note: note || a.user_note } : a))
      );
      setSelectedAlert(null);
      setNoteText("");
    } catch (err) {
      alert("Error updating alert: " + err.message);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-400 font-medium">Scanning transaction deviations against historical baselines...</p>
        </div>
      </div>
    );
  }

  const unreviewedCount = alerts.filter((a) => !a.reviewed).length;
  const criticalCount = alerts.filter((a) => a.severity === "critical" || a.severity === "high").length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header & Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Unusual Transaction & Activity Detection</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Statistical deviation analyzer tracking unexpected spending spikes, duplicate charges, and baseline outliers.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition-colors disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-emerald-400" : ""}`} />
          <span>{refreshing ? "Re-analyzing..." : "Run Anomaly Scan"}</span>
        </button>
      </div>

      {/* Mandatory Regulatory / Educational Disclaimer */}
      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200/90 flex items-start space-x-3">
        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Important Advisory:</strong> Flagged records are statistical unusual-activity indicators computed from your transaction distribution for review purposes. They are <em>not definitive fraud predictions</em>.
        </p>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-card rounded-xl p-4 border border-slate-800">
          <span className="text-[11px] text-slate-400">Total Flags</span>
          <p className="text-2xl font-bold text-white mt-1">{alerts.length}</p>
        </div>
        <div className="glass-card rounded-xl p-4 border border-slate-800">
          <span className="text-[11px] text-slate-400">High / Critical</span>
          <p className="text-2xl font-bold text-rose-400 mt-1">{criticalCount}</p>
        </div>
        <div className="glass-card rounded-xl p-4 border border-slate-800">
          <span className="text-[11px] text-slate-400">Pending Review</span>
          <p className="text-2xl font-bold text-amber-400 mt-1">{unreviewedCount}</p>
        </div>
        <div className="glass-card rounded-xl p-4 border border-slate-800">
          <span className="text-[11px] text-slate-400">Reviewed / Cleared</span>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{alerts.length - unreviewedCount}</p>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center text-xs text-slate-400 border border-slate-800">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
            <h4 className="text-sm font-bold text-white mb-1">All Clear!</h4>
            <p>No unusual financial anomalies or duplicate transactions detected in your statements.</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`glass-card rounded-xl p-5 border transition-all ${
                alert.reviewed
                  ? "border-slate-800/80 bg-slate-900/30 opacity-70"
                  : "border-slate-700 bg-slate-900/70"
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                <div className="flex items-center space-x-3">
                  <SeverityBadge severity={alert.severity} />
                  <span className="text-sm font-bold text-white">{alert.anomaly_type}</span>
                  {alert.category && <CategoryBadge category={alert.category} />}
                </div>

                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-slate-400 font-mono text-[11px]">{alert.transaction_date}</span>
                  {alert.amount !== null && alert.amount !== undefined && (
                    <span className="font-mono font-bold text-white px-2 py-0.5 rounded bg-slate-800">
                      ${Number(alert.amount).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              {/* Body */}
              <div className="py-3 space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 font-medium">Merchant / Description: </span>
                  <span className="font-semibold text-slate-200">{alert.merchant || alert.description || "N/A"}</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800 text-slate-300 leading-relaxed">
                  <p><strong className="text-emerald-400">Why was this flagged:</strong> {alert.explanation}</p>
                </div>

                {alert.user_note && (
                  <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-emerald-300 text-[11px]">
                    <strong>User Explanation:</strong> "{alert.user_note}"
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs border-t border-slate-800/60">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleReview(alert.id, !alert.reviewed)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                      alert.reviewed
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{alert.reviewed ? "Reviewed" : "Mark as Reviewed"}</span>
                  </button>

                  <button
                    onClick={() => setSelectedAlert(alert)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-700 border border-slate-700 transition-colors flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Add Note</span>
                  </button>
                </div>

                {alert.reviewed && (
                  <span className="text-[11px] text-slate-500">Status: Reviewed & verified by user</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Note Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-card rounded-2xl border border-slate-700 w-full max-w-md p-5 space-y-4">
            <h3 className="text-sm font-bold text-white">Add Explanation to Activity Indicator</h3>
            <p className="text-xs text-slate-400">
              Provide context for this flagged transaction (e.g. "Authorized laptop purchase for work"):
            </p>
            <textarea
              rows={3}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Enter explanation..."
              className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
            />
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setSelectedAlert(null)}
                className="px-3.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReview(selectedAlert.id, true, noteText)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                Save & Mark Reviewed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
