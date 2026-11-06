from datetime import datetime, timedelta
from collections import defaultdict
from typing import List, Dict, Any, Tuple
import numpy as np

class RecurringPaymentDetector:
    """
    Advanced recurring financial transaction analyzer.
    Identifies periodicity, estimates frequencies, projects next scheduled payment dates,
    and flags potentially forgotten recurring subscriptions.
    """

    KNOWN_SUBSCRIPTIONS = {
        "netflix", "spotify", "hulu", "disney", "apple", "amazon prime", "youtube", "audible",
        "hbo", "paramount", "gym", "fitness", "planet fitness", "equinox", "nytimes", "wsj",
        "github", "chatgpt", "openai", "dropbox", "google storage", "icloud", "patreon",
        "comcast", "xfinity", "at&t", "verizon", "conedison", "electric", "power", "water",
        "rent", "apartments", "mortgage"
    }

    def detect(self, transactions: List[dict]) -> Tuple[List[dict], float, float, List[dict]]:
        if not transactions:
            return [], 0.0, 0.0, []

        merchant_groups = defaultdict(list)
        for tx in transactions:
            if tx.get("transaction_type") != "debit":
                continue
            merchant = (tx.get("merchant") or tx.get("description", "")).strip()
            norm_merchant = merchant.lower()
            cleaned = " ".join([w for w in norm_merchant.split() if not w.isdigit()][:3])
            if cleaned:
                merchant_groups[cleaned].append(tx)

        detected_recurring = []
        forgotten_alerts = []
        today = datetime.utcnow().date()
        seen_merchants = set()

        for norm_name, tx_list in merchant_groups.items():
            # Deduplicate multiple records of the exact same date to prevent duplicate statement skew
            unique_by_date = {}
            for t in tx_list:
                d_str = str(t["transaction_date"])[:10]
                if d_str not in unique_by_date:
                    unique_by_date[d_str] = t
            distinct_txs = list(unique_by_date.values())

            # Sort transactions by date
            sorted_txs = sorted(
                distinct_txs,
                key=lambda x: datetime.strptime(str(x["transaction_date"])[:10], "%Y-%m-%d")
            )
            dates = [datetime.strptime(str(x["transaction_date"])[:10], "%Y-%m-%d").date() for x in sorted_txs]
            amounts = [float(x["amount"]) for x in sorted_txs]
            display_name = sorted_txs[-1].get("merchant") or norm_name.title()
            cat = sorted_txs[-1].get("category", "Bills and utilities")
            amt = round(float(np.median(amounts)), 2)

            # Check if this merchant matches known subscription / rent / utility patterns
            is_known_sub = any(s in norm_name for s in self.KNOWN_SUBSCRIPTIONS)

            freq = None
            expected_days = 30

            if len(dates) >= 2:
                intervals = [(dates[i+1] - dates[i]).days for i in range(len(dates)-1)]
                avg_interval = np.mean(intervals) if intervals else 0
                std_interval = np.std(intervals) if intervals else 0

                if 5 <= avg_interval <= 9 and std_interval <= 4:
                    freq = "weekly"
                    expected_days = 7
                elif 11 <= avg_interval <= 17 and std_interval <= 5:
                    freq = "bi-weekly"
                    expected_days = 14
                elif 20 <= avg_interval <= 40:
                    freq = "monthly"
                    expected_days = 30
                elif 75 <= avg_interval <= 105:
                    freq = "quarterly"
                    expected_days = 91
                elif 330 <= avg_interval <= 390:
                    freq = "yearly"
                    expected_days = 365
                elif is_known_sub:
                    freq = "monthly"
                    expected_days = 30
            elif is_known_sub:
                freq = "monthly"
                expected_days = 30

            if freq and norm_name not in seen_merchants:
                seen_merchants.add(norm_name)
                latest_date = dates[-1]
                next_expected = latest_date + timedelta(days=expected_days)
                while next_expected < today:
                    next_expected += timedelta(days=expected_days)

                item = {
                    "merchant": display_name,
                    "amount": amt,
                    "frequency": freq,
                    "next_expected_date": next_expected.isoformat(),
                    "category": cat,
                    "status": "active"
                }
                detected_recurring.append(item)

                # Check forgotten subscription
                if is_known_sub and amt < 60 and cat in ["Entertainment", "Bills and utilities"]:
                    forgotten_alerts.append({
                        "merchant": display_name,
                        "amount": amt,
                        "frequency": freq,
                        "annual_cost": round(amt * (12 if freq == "monthly" else 1), 2),
                        "reason": "Active subscription detected. Verify ongoing usage to eliminate unutilized recurring drain."
                    })

        # Calculate totals
        total_monthly = 0.0
        for r in detected_recurring:
            a = r["amount"]
            f = r["frequency"]
            if f == "weekly":
                total_monthly += a * 4.33
            elif f == "bi-weekly":
                total_monthly += a * 2.16
            elif f == "monthly":
                total_monthly += a
            elif f == "quarterly":
                total_monthly += a / 3.0
            elif f == "yearly":
                total_monthly += a / 12.0

        total_annual = total_monthly * 12.0
        return detected_recurring, round(total_monthly, 2), round(total_annual, 2), forgotten_alerts

recurring_detector = RecurringPaymentDetector()
