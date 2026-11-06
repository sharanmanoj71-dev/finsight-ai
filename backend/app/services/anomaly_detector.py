import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any
from collections import defaultdict
import numpy as np

class AnomalyDetector:
    """
    Statistical and behavioral anomaly detector for financial transactions.
    Identifies unusual activity indicators while maintaining transparency and explainability.
    Emphasizes: These are indicators for user review, not fraud accusations.
    """

    def analyze(self, transactions: List[dict]) -> List[dict]:
        if not transactions:
            return []

        alerts: List[dict] = []
        debits = [t for t in transactions if t.get("transaction_type") == "debit"]
        if not debits:
            return []

        # 1. Historical baseline calculations
        amounts = [float(t["amount"]) for t in debits]
        overall_mean = np.mean(amounts)
        overall_std = np.std(amounts) if len(amounts) > 1 else overall_mean * 0.5
        overall_p95 = np.percentile(amounts, 95) if len(amounts) >= 10 else overall_mean * 2.5

        # Group by category for category-level norms
        cat_amounts = defaultdict(list)
        for t in debits:
            cat_amounts[t.get("category", "Other expenses")].append(float(t["amount"]))

        cat_stats = {}
        for cat, vals in cat_amounts.items():
            cat_stats[cat] = {
                "mean": np.mean(vals),
                "std": np.std(vals) if len(vals) > 1 else np.mean(vals) * 0.5,
                "max": np.max(vals)
            }

        # Track merchant frequency
        merchant_txs = defaultdict(list)
        for t in debits:
            m = (t.get("merchant") or t.get("description", "")).strip().lower()
            merchant_txs[m].append(t)

        # 2. Anomaly Checks per transaction
        for tx in debits:
            tx_id = tx.get("id")
            amt = float(tx.get("amount", 0))
            desc = tx.get("description", "")
            cat = tx.get("category", "Other expenses")
            merchant = tx.get("merchant", desc)
            tx_date_str = str(tx.get("transaction_date"))[:10]

            cat_stat = cat_stats.get(cat, {"mean": overall_mean, "std": overall_std})
            c_mean = cat_stat["mean"]
            c_std = max(cat_stat["std"], 1.0)
            z_score = (amt - c_mean) / c_std if c_std > 0 else 0

            # Check A: Unusually Large Transaction
            if z_score > 3.0 and amt > 150.0:
                severity = "critical" if z_score > 4.5 or amt > 2500 else "high"
                alerts.append({
                    "id": str(uuid.uuid4()),
                    "transaction_id": tx_id,
                    "anomaly_type": "Unusually Large Amount",
                    "severity": severity,
                    "explanation": f"Amount ${amt:,.2f} is {z_score:.1f} standard deviations above your historical average of ${c_mean:,.2f} for '{cat}'.",
                    "historical_comparison": f"Category average: ${c_mean:,.2f} | Transaction: ${amt:,.2f} (+{((amt/max(c_mean, 1))-1)*100:.0f}%)",
                    "reviewed": False
                })
            elif amt > overall_p95 and amt > 300.0 and z_score > 2.0:
                alerts.append({
                    "id": str(uuid.uuid4()),
                    "transaction_id": tx_id,
                    "anomaly_type": "High Outlier Spending",
                    "severity": "medium",
                    "explanation": f"This transaction falls within your top 5% highest expenses (${amt:,.2f}).",
                    "historical_comparison": f"95th percentile baseline: ${overall_p95:,.2f}",
                    "reviewed": False
                })

            # Check B: Unusual Cash Withdrawal
            if any(w in desc.lower() for w in ["atm", "withdrawal", "cash"]) and amt >= 200.0:
                if amt > overall_mean * 2.0:
                    alerts.append({
                        "id": str(uuid.uuid4()),
                        "transaction_id": tx_id,
                        "anomaly_type": "Large Cash Withdrawal",
                        "severity": "medium",
                        "explanation": f"Cash withdrawal of ${amt:,.2f} exceeds typical withdrawal amounts.",
                        "historical_comparison": f"Typical spend baseline: ${overall_mean:,.2f}",
                        "reviewed": False
                    })

        # Check C: Duplicate-Looking Transactions (Identical amount & merchant within 48h)
        for m, m_txs in merchant_groups_time(debits):
            if len(m_txs) >= 2:
                # check pairs
                for i in range(len(m_txs)):
                    for j in range(i + 1, len(m_txs)):
                        t1 = m_txs[i]
                        t2 = m_txs[j]
                        amt1 = float(t1["amount"])
                        amt2 = float(t2["amount"])
                        if abs(amt1 - amt2) < 0.01:
                            d1 = datetime.strptime(str(t1["transaction_date"])[:10], "%Y-%m-%d")
                            d2 = datetime.strptime(str(t2["transaction_date"])[:10], "%Y-%m-%d")
                            diff_hours = abs((d2 - d1).total_seconds()) / 3600
                            if diff_hours <= 48:
                                # Flag the second transaction
                                alerts.append({
                                    "id": str(uuid.uuid4()),
                                    "transaction_id": t2["id"],
                                    "anomaly_type": "Potential Duplicate Charge",
                                    "severity": "high",
                                    "explanation": f"Two identical charges of ${amt1:,.2f} detected at '{t2.get('merchant', m)}' within {int(diff_hours)} hours.",
                                    "historical_comparison": f"Matches prior charge on {str(t1['transaction_date'])[:10]}",
                                    "reviewed": False
                                })

        # Check D: Daily Velocity Spike (Sudden single-day expenditure jump)
        daily_spends = defaultdict(float)
        daily_tx_ids = defaultdict(list)
        for t in debits:
            dt = str(t["transaction_date"])[:10]
            daily_spends[dt] += float(t["amount"])
            daily_tx_ids[dt].append(t["id"])

        if len(daily_spends) >= 5:
            d_vals = list(daily_spends.values())
            d_mean = np.mean(d_vals)
            d_std = np.std(d_vals)
            for dt, d_sum in daily_spends.items():
                if d_sum > (d_mean + 2.5 * d_std) and d_sum > 500:
                    lead_tx_id = daily_tx_ids[dt][0]
                    alerts.append({
                        "id": str(uuid.uuid4()),
                        "transaction_id": lead_tx_id,
                        "anomaly_type": "Daily Spending Spike",
                        "severity": "medium",
                        "explanation": f"Total spending on {dt} reached ${d_sum:,.2f}, more than 2.5x your average daily expenditure (${d_mean:,.2f}).",
                        "historical_comparison": f"Average daily spending: ${d_mean:,.2f} vs Day total: ${d_sum:,.2f}",
                        "reviewed": False
                    })

        # Deduplicate alerts for same transaction
        seen_txs = set()
        final_alerts = []
        for a in alerts:
            if a["transaction_id"] not in seen_txs:
                seen_txs.add(a["transaction_id"])
                final_alerts.append(a)

        return final_alerts

def merchant_groups_time(debits: List[dict]):
    groups = defaultdict(list)
    for t in debits:
        m = (t.get("merchant") or t.get("description", "")).strip().lower()
        groups[m].append(t)
    return groups.items()

anomaly_detector = AnomalyDetector()
