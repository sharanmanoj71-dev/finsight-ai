from typing import List, Dict, Any, Optional, Tuple
from collections import defaultdict
from datetime import datetime
import json

from app.core.config import settings

class AssistantService:
    """
    FinSight Assistant: Context-grounded Conversational Financial Advisor.
    Directly binds actual calculated figures from the user's authentic data.
    Never invents balances, transactions, or fake numbers.
    Uses Google Gemini API when available, with deterministic financial NLP fallback.
    """

    def process_query(
        self,
        query: str,
        transactions: List[dict],
        recurring: List[dict],
        anomalies: List[dict],
        budgets: List[dict],
        history: Optional[List[dict]] = None
    ) -> Tuple[str, Dict[str, Any], List[str]]:
        # 1. Precompute comprehensive user financial context
        debits = [t for t in transactions if t.get("transaction_type") == "debit"]
        credits = [t for t in transactions if t.get("transaction_type") == "credit"]

        total_income = sum(float(t["amount"]) for t in credits)
        total_expense = sum(float(t["amount"]) for t in debits)
        net_savings = total_income - total_expense

        # Spend by category
        cat_spend = defaultdict(float)
        for t in debits:
            cat_spend[t.get("category", "Other expenses")] += float(t["amount"])

        sorted_cats = sorted(cat_spend.items(), key=lambda x: x[1], reverse=True)
        top_category = sorted_cats[0][0] if sorted_cats else "None"
        top_cat_amount = sorted_cats[0][1] if sorted_cats else 0.0

        # Spend by merchant
        merch_spend = defaultdict(float)
        for t in debits:
            m = t.get("merchant") or t.get("description", "Unknown")
            merch_spend[m] += float(t["amount"])
        sorted_merchants = sorted(merch_spend.items(), key=lambda x: x[1], reverse=True)[:5]

        # Monthly breakdown
        monthly_spend = defaultdict(float)
        monthly_income = defaultdict(float)
        for t in debits:
            m_key = str(t.get("transaction_date"))[:7] # YYYY-MM
            monthly_spend[m_key] += float(t["amount"])
        for t in credits:
            m_key = str(t.get("transaction_date"))[:7]
            monthly_income[m_key] += float(t["amount"])

        months_sorted = sorted(monthly_spend.keys(), reverse=True)
        curr_month = months_sorted[0] if months_sorted else datetime.utcnow().strftime("%Y-%m")
        prev_month = months_sorted[1] if len(months_sorted) > 1 else None

        curr_month_spend = monthly_spend.get(curr_month, 0.0)
        prev_month_spend = monthly_spend.get(prev_month, 0.0) if prev_month else 0.0

        # Subscriptions
        rec_list = [f"{r['merchant']} (${float(r['amount']):,.2f} {r['frequency']})" for r in recurring]
        rec_total = sum(float(r["amount"]) for r in recurring)

        # Flagged anomalies
        anomaly_summaries = [f"{a['anomaly_type']}: {a['explanation']}" for a in anomalies[:5]]

        context_data = {
            "total_income": round(total_income, 2),
            "total_expense": round(total_expense, 2),
            "net_savings": round(net_savings, 2),
            "top_category": top_category,
            "top_category_amount": round(top_cat_amount, 2),
            "current_month": curr_month,
            "current_month_spending": round(curr_month_spend, 2),
            "previous_month_spending": round(prev_month_spend, 2) if prev_month else None,
            "active_recurring_count": len(recurring),
            "recurring_monthly_sum": round(rec_total, 2),
            "unusual_alerts_count": len(anomalies)
        }

        # 2. Try Gemini API first if configured
        if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip():
            try:
                from google import genai
                client = genai.Client(api_key=settings.GEMINI_API_KEY)
                prompt = f"""
You are FinSight Assistant, an expert, objective AI financial analyst.
Analyze the user's authentic financial records provided below and respond with precise numbers, clear breakdowns, and actionable financial guidance.
Never make up or extrapolate numbers not present in the authentic context.

AUTHENTIC FINANCIAL CONTEXT:
- Total Inflows/Income: ${total_income:,.2f}
- Total Outflows/Expenses: ${total_expense:,.2f}
- Net Savings: ${net_savings:,.2f} (Savings Rate: {(net_savings/max(total_income, 1))*100:.1f}%)
- Current Month ({curr_month}) Spend: ${curr_month_spend:,.2f}
- Previous Month ({prev_month or 'N/A'}) Spend: ${prev_month_spend:,.2f}
- Top Category: {top_category} (${top_cat_amount:,.2f})
- Category Breakdown: {json.dumps({k: round(v, 2) for k, v in sorted_cats[:6]})}
- Top Merchants: {json.dumps({k: round(v, 2) for k, v in sorted_merchants})}
- Recurring Payments: {', '.join(rec_list) if rec_list else 'None detected'}
- Flagged Anomaly Alerts: {'; '.join(anomaly_summaries) if anomaly_summaries else 'None'}

USER QUESTION:
"{query}"

Respond concisely in structured GitHub-style markdown. Highlight key figures in bold and provide tangible steps.
"""
                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt
                )
                if response.text:
                    followups = self._generate_followups(query, top_category)
                    return response.text, context_data, followups
            except Exception as e:
                print(f"[Assistant] Gemini API fallback notice: {e}")

        # 3. Grounded Deterministic NLP Engine
        q_lower = query.lower()
        followups = self._generate_followups(query, top_category)

        # Question: Where did most of my money go? / Highest spending category
        if any(w in q_lower for w in ["where did most", "highest spending", "biggest spend", "top category", "most of my money"]):
            if not sorted_cats:
                return "I don't have enough transaction data yet. Upload your bank statement to see spending breakdowns.", context_data, followups
            lines = [f"### 📊 Spending Allocation Breakdown\n\nYour highest spending category is **{top_category}**, which accounts for **${top_cat_amount:,.2f}** ({((top_cat_amount/max(total_expense,1))*100):.1f}% of total expenses).\n"]
            lines.append("Here is how your top categories rank:\n")
            for cat, amt in sorted_cats[:5]:
                pct = (amt / max(total_expense, 1)) * 100
                lines.append(f"- **{cat}**: ${amt:,.2f} ({pct:.1f}%)")
            lines.append(f"\nYour top merchant expenditure was **{sorted_merchants[0][0]}** at **${sorted_merchants[0][1]:,.2f}**.")
            return "\n".join(lines), context_data, followups

        # Question: How much did I spend this month?
        if any(w in q_lower for w in ["spend this month", "how much did i spend", "monthly spending", "spent this month"]):
            resp = f"### 💳 Current Month Spending ({curr_month})\n\n"
            resp += f"You have spent **${curr_month_spend:,.2f}** so far in {curr_month}.\n\n"
            if prev_month:
                diff = curr_month_spend - prev_month_spend
                pct_change = (diff / max(prev_month_spend, 1)) * 100
                direction = "higher" if diff > 0 else "lower"
                resp += f"- **Comparison**: That is **${abs(diff):,.2f} ({abs(pct_change):.1f}%) {direction}** than last month ({prev_month}: ${prev_month_spend:,.2f}).\n"
            resp += f"- **Total Recorded Outflows**: ${total_expense:,.2f} across all statements."
            return resp, context_data, followups

        # Question: How much money did I save?
        if any(w in q_lower for w in ["how much money did i save", "how much did i save", "net savings", "my savings"]):
            rate = (net_savings / max(total_income, 1)) * 100
            resp = f"### 💰 Net Savings Analysis\n\n"
            resp += f"- **Total Income**: ${total_income:,.2f}\n"
            resp += f"- **Total Expenses**: ${total_expense:,.2f}\n"
            resp += f"- **Net Savings**: **${net_savings:,.2f}**\n"
            resp += f"- **Savings Rate**: **{rate:.1f}%**\n\n"
            if rate >= 20.0:
                resp += "Great job! Your savings rate exceeds the recommended 20% personal finance benchmark."
            else:
                resp += f"Your savings rate is currently below the 20% guideline. Aim to trim ${max(0.0, total_income*0.20 - net_savings):,.2f} from discretionary categories to reach 20%."
            return resp, context_data, followups

        # Question: Which subscriptions are recurring?
        if any(w in q_lower for w in ["subscription", "recurring", "which subscriptions", "recurring payments"]):
            if not recurring:
                return "No recurring subscription commitments have been detected yet. Once recurring transactions occur, they will appear here.", context_data, followups
            resp = f"### 🔄 Detected Recurring Payments ({len(recurring)} active)\n\n"
            resp += f"Your estimated monthly recurring commitments total **${rec_total:,.2f}/month**:\n\n"
            for r in recurring:
                resp += f"- **{r['merchant']}**: ${float(r['amount']):,.2f} ({r['frequency'].title()}) — Next: {r.get('next_expected_date', 'Scheduled')}\n"
            resp += "\n*Review these in the 'Recurring Payments' tab to cancel any subscriptions you no longer use.*"
            return resp, context_data, followups

        # Question: Why was this transaction flagged?
        if any(w in q_lower for w in ["flagged", "anomaly", "unusual", "why was this"]):
            if not anomalies:
                return "There are currently no unusual activity flags on your account. All transactions fall within expected statistical baselines.", context_data, followups
            resp = f"### ⚠️ Flagged Unusual Activity Indicators ({len(anomalies)} alerts)\n\n"
            for a in anomalies[:4]:
                resp += f"- **{a['anomaly_type']}** ({a['severity'].upper()}):\n  {a['explanation']}\n"
            resp += "\n*Note: These are statistical deviation indicators for your review, not fraud confirmations. You can review or dismiss them in the 'Anomaly Detection' section.*"
            return resp, context_data, followups

        # Question: Compare my expenses with last month
        if any(w in q_lower for w in ["compare", "last month", "month over month", "vs last month"]):
            if not prev_month:
                return f"Currently, only data for {curr_month} is recorded (${curr_month_spend:,.2f}). Upload previous months' statements to view month-over-month comparisons.", context_data, followups
            diff = curr_month_spend - prev_month_spend
            pct_change = (diff / max(prev_month_spend, 1)) * 100
            resp = f"### 📈 Month-over-Month Comparison\n\n"
            resp += f"- **{curr_month} (Current)**: ${curr_month_spend:,.2f}\n"
            resp += f"- **{prev_month} (Previous)**: ${prev_month_spend:,.2f}\n"
            resp += f"- **Net Change**: **{'+' if diff > 0 else ''}${diff:,.2f} ({'+' if pct_change > 0 else ''}{pct_change:.1f}%)**\n\n"
            if diff > 0:
                resp += f"Spending rose by ${diff:,.2f}. The primary contributor was increased activity in **{top_category}**."
            else:
                resp += f"Excellent progress! You reduced spending by ${abs(diff):,.2f} compared to {prev_month}."
            return resp, context_data, followups

        # Question: Will I have enough money next month?
        if any(w in q_lower for w in ["enough money", "will i have", "shortage", "cash flow", "future"]):
            monthly_burn = curr_month_spend if curr_month_spend > 0 else total_expense
            burn_vs_income = total_income - monthly_burn
            resp = "### 🔮 Forward Cash-Flow Assessment\n\n"
            if burn_vs_income >= 0:
                resp += f"✅ **Yes, based on current patterns.**\n\n"
                resp += f"- Expected Monthly Inflow: ~${total_income:,.2f}\n"
                resp += f"- Expected Monthly Outflow: ~${monthly_burn:,.2f} (including ${rec_total:,.2f} in fixed recurring)\n"
                resp += f"- Projected Surplus: **+${burn_vs_income:,.2f}**\n\n"
                resp += "Check the **Cash-Flow Prediction** tab to inspect day-by-day 30 and 90-day balance trajectories."
            else:
                resp += f"⚠️ **Attention Needed:** Current monthly burn rate exceeds incoming cash flow by **${abs(burn_vs_income):,.2f}**.\n\n"
                resp += f"Recommended actions:\n1. Defer non-essential purchases in {top_category}.\n2. Ensure your checking buffer covers the ${rec_total:,.2f} in upcoming recurring bills."
            return resp, context_data, followups

        # Question: How can I reduce my monthly expenses? / Suggest a realistic budget
        if any(w in q_lower for w in ["reduce", "save money", "budget", "suggest", "cut"]):
            resp = "### 💡 Personalized Budget & Expense Optimization Plan\n\n"
            resp += "Based on your spending data, here are 3 high-impact optimization levers:\n\n"
            if sorted_cats:
                c1_name, c1_amt = sorted_cats[0]
                resp += f"1. **Cap {c1_name} Spending**: Currently your #1 expense (${c1_amt:,.2f}). Trimming 15% frees up **${c1_amt * 0.15:,.2f}/month**.\n"
            if len(sorted_cats) > 1:
                c2_name, c2_amt = sorted_cats[1]
                resp += f"2. **Target {c2_name}**: Currently ${c2_amt:,.2f}. Setting a ${c2_amt * 0.85:,.2f} budget cap saves **${c2_amt * 0.15:,.2f}/month**.\n"
            if recurring:
                resp += f"3. **Prune Recurring Subscriptions**: Review your {len(recurring)} recurring subscriptions (${rec_total:,.2f}/month) in the Recurring Payments tab to cancel unused plans.\n\n"
            resp += f"**Suggested 50/30/20 Distribution** (from ${total_income:,.2f} total inflows):\n"
            resp += f"- **Needs (50%)**: ${total_income * 0.50:,.2f} (Rent, Utilities, Groceries)\n"
            resp += f"- **Wants (30%)**: ${total_income * 0.30:,.2f} (Dining, Entertainment, Shopping)\n"
            resp += f"- **Savings/Investments (20%)**: ${total_income * 0.20:,.2f}"
            return resp, context_data, followups

        # Default helpful response
        general_resp = f"### 🏦 FinSight Financial Overview\n\n"
        general_resp += f"Here is a summary of your financial records:\n"
        general_resp += f"- **Total Inflows**: ${total_income:,.2f}\n"
        general_resp += f"- **Total Outflows**: ${total_expense:,.2f}\n"
        general_resp += f"- **Net Savings**: ${net_savings:,.2f}\n"
        general_resp += f"- **Top Spending Area**: {top_category} (${top_cat_amount:,.2f})\n"
        general_resp += f"- **Active Subscriptions**: {len(recurring)} (${rec_total:,.2f}/mo)\n\n"
        general_resp += f"You asked: *\"{query}\"*. You can ask me about your highest spending category, monthly comparisons, subscription breakdown, or budget advice!"
        return general_resp, context_data, followups

    def _generate_followups(self, query: str, top_cat: str) -> List[str]:
        return [
            "Where did most of my money go?",
            "Which subscriptions are recurring?",
            f"How can I reduce spending in {top_cat}?",
            "Will I have enough money next month?"
        ]

assistant_service = AssistantService()
