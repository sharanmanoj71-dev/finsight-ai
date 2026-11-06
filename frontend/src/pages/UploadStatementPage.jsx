import React, { useState, useRef } from "react";
import {
  UploadCloud,
  FileText,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Save,
  FileCheck,
  Edit2,
  Copy,
  Info,
  Loader2,
  Database
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
  "Salary and income",
  "Transfers",
  "Entertainment",
  "Housing and rent",
  "Investments",
  "Other expenses"
];

export default function UploadStatementPage({ onImportSuccess }) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [preview, setPreview] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (selectedFile) => {
    setError(null);
    setSuccessMsg(null);
    const name = selectedFile.name.toLowerCase();
    if (!name.endsWith(".pdf") && !name.endsWith(".csv")) {
      setError("Please select a valid PDF (.pdf) or CSV (.csv) bank statement.");
      return;
    }
    if (selectedFile.size > 15 * 1024 * 1024) {
      setError("File exceeds maximum allowed size of 15MB.");
      return;
    }
    setFile(selectedFile);
    processUpload(selectedFile);
  };

  const processUpload = async (uploadFile) => {
    setExtracting(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", uploadFile);

    try {
      const res = await api.statements.upload(formData);
      setPreview(res);
      setTransactions(res.transactions || []);
    } catch (err) {
      setError(err.message || "Failed to extract bank statement");
      setPreview(null);
    } finally {
      setExtracting(false);
    }
  };

  // 1-Click Load Sample Statements
  const handleLoadSample = async (type) => {
    setExtracting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      // Create synthetic sample file based on realistic data
      let sampleData = "";
      let filename = "";
      if (type === "csv") {
        filename = "chase_checking_sample.csv";
        sampleData = `Date,Description,Debit,Credit,Balance
2026-03-01,EMPLOYER PAYROLL DIRECT DEPOSIT ACME CORP,,3200.00,7450.00
2026-03-01,METROPOLITAN APARTMENTS MONTHLY LEASE RENT,1450.00,,6000.00
2026-03-02,WHOLE FOODS MARKET GROCERY #1042,128.45,,5871.55
2026-03-03,SHELL OIL GAS STATION PUMP 04,45.20,,5826.35
2026-03-04,STARBUCKS STORE #0492 SEATTLE,6.75,,5819.60
2026-03-05,NETFLIX STREAMING MONTHLY SUBSCRIPTION,19.99,,5799.61
2026-03-05,SPOTIFY USA MUSIC SUBSCRIPTION,10.99,,5788.62
2026-03-06,UBER TRIP RIDE TO DOWNTOWN,24.50,,5764.12
2026-03-07,AMAZON.COM DIGITAL RETAIL ORDER,64.20,,5699.92
2026-03-08,CONEDISON ELECTRIC AND GAS UTILITY BILL,115.40,,5584.52
2026-03-09,CHIPOTLE MEXICAN GRILL LUNCH,15.80,,5568.72
2026-03-10,PLANET FITNESS MONTHLY GYM DUES,24.99,,5543.73
2026-03-11,COMCAST XFINITY INTERNET BROADBAND,79.99,,5463.74
2026-03-12,UBER EATS BURGER JOINT ORDER,34.50,,5429.24
2026-03-13,UBER EATS BURGER JOINT ORDER,34.50,,5394.74
2026-03-14,TRADER JOES GROCERY MARKET,92.15,,5302.59
2026-03-15,EMPLOYER PAYROLL DIRECT DEPOSIT ACME CORP,,3200.00,8502.59
2026-03-16,APPLE STORE #R102 NEW LAPTOP ACCESSORIES,2499.00,,6003.59
2026-03-17,CVS PHARMACY HEALTHCARE PRESCRIPTION,28.60,,5974.99
2026-03-18,TARGET SUPERSTORE SUPPLIES,84.10,,5890.89
2026-03-19,AT&T WIRELESS MONTHLY CELL PHONE,85.00,,5805.89
2026-03-20,ATM CASH WITHDRAWAL 5TH AVE BRANCH,800.00,,5005.89
2026-03-25,VANGUARD INDEX FUNDS RETIREMENT TRANSFER,400.00,,4408.25
2026-03-31,FREELANCE DESIGN INVOICE CLIENT PAYOUT,,1500.00,5262.35`;
        const blob = new Blob([sampleData], { type: "text/csv" });
        const mockFile = new File([blob], filename, { type: "text/csv" });
        setFile(mockFile);
        await processUpload(mockFile);
      } else {
        filename = "wells_fargo_statement.pdf";
        // Fetch or load PDF
        const response = await fetch("/api/v1/statements/").catch(() => null);
        // Fallback to uploading sample CSV representation labeled as PDF demo
        handleLoadSample("csv");
      }
    } catch (err) {
      setError(err.message || "Failed to load sample statement");
    } finally {
      setExtracting(false);
    }
  };

  const handleUpdateRow = (index, field, value) => {
    const updated = [...transactions];
    updated[index] = { ...updated[index], [field]: value };
    setTransactions(updated);
  };

  const handleRemoveRow = (index) => {
    setTransactions(transactions.filter((_, i) => i !== index));
  };

  const handleConfirmAndSave = async () => {
    if (!preview || transactions.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        statement_id: preview.statement_id,
        filename: preview.filename,
        file_type: preview.file_type,
        opening_balance: preview.opening_balance,
        closing_balance: preview.closing_balance,
        transactions: transactions
      };
      const res = await api.statements.save(payload);
      setSuccessMsg(`Successfully saved ${res.saved_count} transactions to Supabase! Recurring payments and anomaly detections updated.`);
      setPreview(null);
      setTransactions([]);
      setFile(null);
      if (onImportSuccess) onImportSuccess();
    } catch (err) {
      setError(err.message || "Failed to save transactions to database");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Upload Zone Card */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Upload Bank Statement</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Securely parse PDF and CSV bank statements. Features automatic OCR, merchant recognition, and duplicate detection.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Quick Test:</span>
            <button
              onClick={() => handleLoadSample("csv")}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold border border-slate-700 transition-colors"
            >
              Load Sample CSV
            </button>
          </div>
        </div>

        {/* Drag and Drop Box */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            dragActive
              ? "border-emerald-500 bg-emerald-500/10"
              : "border-slate-700/80 hover:border-slate-600 bg-slate-900/40"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.csv"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="flex flex-col items-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <UploadCloud className="w-6 h-6" />
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-200">
                {file ? file.name : "Drag and drop your statement here, or click to browse"}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Supported formats: PDF (.pdf), CSV (.csv) • Maximum file size: 15MB
              </p>
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {extracting && (
          <div className="mt-4 p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center space-x-3 text-xs text-emerald-400 animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
            <span>Analyzing bank statement layout, parsing dates, and classifying transactions with AI...</span>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center space-x-3 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center space-x-3 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>

      {/* Extraction Preview Section */}
      {preview && transactions.length > 0 && (
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white tracking-tight">
                  Extracted Transactions Preview
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold">
                  {transactions.length} Transactions
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Review extracted values below. You can correct dates, amounts, or categories before saving to database.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {preview.duplicates_count > 0 && (
                <span className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 font-medium">
                  {preview.duplicates_count} Potential Duplicate(s)
                </span>
              )}
              <button
                onClick={handleConfirmAndSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>{saving ? "Saving to Supabase..." : "Confirm & Save Transactions"}</span>
              </button>
            </div>
          </div>

          {/* Balance Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 text-xs">
            <div>
              <span className="text-slate-400 text-[11px]">Filename</span>
              <p className="font-semibold text-slate-200 truncate">{preview.filename}</p>
            </div>
            <div>
              <span className="text-slate-400 text-[11px]">Format</span>
              <p className="font-semibold text-slate-200 uppercase">{preview.file_type}</p>
            </div>
            <div>
              <span className="text-slate-400 text-[11px]">Opening Balance</span>
              <p className="font-bold text-emerald-400">${preview.opening_balance.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-slate-400 text-[11px]">Closing Balance</span>
              <p className="font-bold text-blue-400">${preview.closing_balance.toLocaleString()}</p>
            </div>
          </div>

          {/* Editable Preview Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-3 py-2.5">Date</th>
                  <th className="px-3 py-2.5">Description</th>
                  <th className="px-3 py-2.5">Merchant</th>
                  <th className="px-3 py-2.5">Type</th>
                  <th className="px-3 py-2.5">Amount</th>
                  <th className="px-3 py-2.5">AI Category</th>
                  <th className="px-3 py-2.5">Confidence</th>
                  <th className="px-3 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {transactions.map((tx, idx) => (
                  <tr key={tx.id || idx} className={`hover:bg-slate-800/30 ${tx.is_duplicate ? "bg-amber-500/5" : ""}`}>
                    {/* Date */}
                    <td className="px-3 py-2 whitespace-nowrap">
                      <input
                        type="date"
                        value={tx.transaction_date}
                        onChange={(e) => handleUpdateRow(idx, "transaction_date", e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </td>

                    {/* Description */}
                    <td className="px-3 py-2 max-w-xs truncate">
                      <input
                        type="text"
                        value={tx.description}
                        onChange={(e) => handleUpdateRow(idx, "description", e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-sans"
                      />
                    </td>

                    {/* Merchant */}
                    <td className="px-3 py-2 whitespace-nowrap">
                      <input
                        type="text"
                        value={tx.merchant || ""}
                        onChange={(e) => handleUpdateRow(idx, "merchant", e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-sans"
                      />
                    </td>

                    {/* Type */}
                    <td className="px-3 py-2 whitespace-nowrap">
                      <select
                        value={tx.transaction_type}
                        onChange={(e) => handleUpdateRow(idx, "transaction_type", e.target.value)}
                        className={`text-[11px] font-semibold px-2 py-1 rounded border bg-slate-900 ${
                          tx.transaction_type === "credit"
                            ? "text-emerald-400 border-emerald-500/30"
                            : "text-rose-400 border-rose-500/30"
                        }`}
                      >
                        <option value="debit">Debit (-)</option>
                        <option value="credit">Credit (+)</option>
                      </select>
                    </td>

                    {/* Amount */}
                    <td className="px-3 py-2 whitespace-nowrap">
                      <input
                        type="number"
                        step="0.01"
                        value={tx.amount}
                        onChange={(e) => handleUpdateRow(idx, "amount", parseFloat(e.target.value) || 0)}
                        className="w-24 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-right text-white focus:outline-none focus:border-emerald-500"
                      />
                    </td>

                    {/* Category */}
                    <td className="px-3 py-2 whitespace-nowrap font-sans">
                      <select
                        value={tx.category}
                        onChange={(e) => handleUpdateRow(idx, "category", e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </td>

                    {/* Confidence */}
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="text-[11px] text-slate-400 font-sans">
                        {Math.round((tx.category_confidence || 0.85) * 100)}%
                      </span>
                    </td>

                    {/* Action */}
                    <td className="px-3 py-2 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleRemoveRow(idx)}
                        className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                        title="Remove row"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
