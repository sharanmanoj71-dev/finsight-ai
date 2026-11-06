from typing import Optional
from fastapi import APIRouter, Depends, Query
from collections import defaultdict
from datetime import datetime
import numpy as np

from app.core.firebase_auth import get_current_user, AuthenticatedUser
from app.core.database import db

router = APIRouter(prefix="/analytics", tags=["Financial Analytics"])

@router.get("/overview")
async def get_overview(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    transaction_type: Optional[str] = Query(None),
    user: AuthenticatedUser = Depends(get_current_user)
):
    transactions = db.get_transactions(
        firebase_uid=user.uid,
        start_date=start_date,
        end_date=end_date,
        category=category,
        transaction_type=transaction_type,
        limit=3000
    )

    if not transactions:
        return {
            "total_income": 0.0,
            "total_expenses": 0.0,
            "net_savings": 0.0,
            "estimated_balance": 0.0,
            "monthly_savings_rate": 0.0,
            "average_daily_spending": 0.0,
            "highest_spending_category": "None",
            "highest_category_amount": 0.0,
            "total_transactions": 0,
            "month_over_month_change": 0.0,
            "month_over_month_pct": 0.0,
            "has_data": False
        }

    credits = [t for t in transactions if t.get("transaction_type") == "credit"]
    debits = [t for t in transactions if t.get("transaction_type") == "debit"]

    total_income = sum(float(t["amount"]) for t in credits)
    total_expenses = sum(float(t["amount"]) for t in debits)
    net_savings = total_income - total_expenses
    savings_rate = (net_savings / total_income * 100) if total_income > 0 else 0.0

    # Average daily spend
    dates = [datetime.strptime(str(t["transaction_date"])[:10], "%Y-%m-%d") for t in transactions]
    min_date = min(dates)
    max_date = max(dates)
    span_days = max(1, (max_date - min_date).days + 1)
    avg_daily_spend = total_expenses / span_days

    # Category breakdown
    cat_spend = defaultdict(float)
    for t in debits:
        cat_spend[t.get("category", "Other expenses")] += float(t["amount"])

    sorted_cats = sorted(cat_spend.items(), key=lambda x: x[1], reverse=True)
    top_cat = sorted_cats[0][0] if sorted_cats else "None"
    top_cat_amt = sorted_cats[0][1] if sorted_cats else 0.0

    # Month over month comparison
    monthly_debits = defaultdict(float)
    for t in debits:
        m_key = str(t.get("transaction_date"))[:7]
        monthly_debits[m_key] += float(t["amount"])

    sorted_months = sorted(monthly_debits.keys(), reverse=True)
    mom_change = 0.0
    mom_pct = 0.0
    if len(sorted_months) >= 2:
        curr_m = monthly_debits[sorted_months[0]]
        prev_m = monthly_debits[sorted_months[1]]
        mom_change = curr_m - prev_m
        mom_pct = (mom_change / max(prev_m, 1)) * 100

    # Estimated balance from latest statement or sum of net flows
    statements = db.get_statements(user.uid)
    if statements and statements[0].get("closing_balance"):
        estimated_balance = float(statements[0]["closing_balance"])
    else:
        estimated_balance = max(0.0, net_savings)

    return {
        "total_income": round(total_income, 2),
        "total_expenses": round(total_expenses, 2),
        "net_savings": round(net_savings, 2),
        "estimated_balance": round(estimated_balance, 2),
        "monthly_savings_rate": round(savings_rate, 1),
        "average_daily_spending": round(avg_daily_spend, 2),
        "highest_spending_category": top_cat,
        "highest_category_amount": round(top_cat_amt, 2),
        "total_transactions": len(transactions),
        "month_over_month_change": round(mom_change, 2),
        "month_over_month_pct": round(mom_pct, 1),
        "has_data": True
    }

@router.get("/charts")
async def get_chart_data(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    user: AuthenticatedUser = Depends(get_current_user)
):
    transactions = db.get_transactions(
        firebase_uid=user.uid,
        start_date=start_date,
        end_date=end_date,
        category=category,
        limit=3000
    )

    if not transactions:
        return {
            "income_vs_expense": [],
            "category_spending": [],
            "daily_spending": [],
            "cashflow_history": []
        }

    # 1. Income vs Expense by Month
    monthly_data = defaultdict(lambda: {"income": 0.0, "expense": 0.0, "net": 0.0})
    for t in transactions:
        m_key = str(t.get("transaction_date"))[:7] # YYYY-MM
        amt = float(t.get("amount", 0))
        if t.get("transaction_type") == "credit":
            monthly_data[m_key]["income"] += amt
        else:
            monthly_data[m_key]["expense"] += amt
        monthly_data[m_key]["net"] = monthly_data[m_key]["income"] - monthly_data[m_key]["expense"]

    sorted_months = sorted(monthly_data.keys())
    income_vs_expense = [
        {
            "month": m,
            "income": round(monthly_data[m]["income"], 2),
            "expense": round(monthly_data[m]["expense"], 2),
            "net": round(monthly_data[m]["net"], 2)
        }
        for m in sorted_months
    ]

    # 2. Category-wise Spending
    cat_totals = defaultdict(float)
    total_debits = 0.0
    for t in transactions:
        if t.get("transaction_type") == "debit":
            c = t.get("category", "Other expenses")
            amt = float(t.get("amount", 0))
            cat_totals[c] += amt
            total_debits += amt

    category_spending = [
        {
            "category": c,
            "amount": round(val, 2),
            "percentage": round((val / max(total_debits, 1)) * 100, 1)
        }
        for c, val in sorted(cat_totals.items(), key=lambda x: x[1], reverse=True)
    ]

    # 3. Daily Spending Patterns (Recent 30 recorded days)
    daily_totals = defaultdict(lambda: {"debit": 0.0, "credit": 0.0})
    for t in transactions:
        dt = str(t.get("transaction_date"))[:10]
        amt = float(t.get("amount", 0))
        if t.get("transaction_type") == "debit":
            daily_totals[dt]["debit"] += amt
        else:
            daily_totals[dt]["credit"] += amt

    sorted_days = sorted(daily_totals.keys())[-45:] # last 45 data points
    daily_spending = [
        {
            "date": dt,
            "spent": round(daily_totals[dt]["debit"], 2),
            "received": round(daily_totals[dt]["credit"], 2)
        }
        for dt in sorted_days
    ]

    # 4. Cumulative Cashflow History
    sorted_all_tx = sorted(transactions, key=lambda x: str(x.get("transaction_date"))[:10])
    running_balance = 0.0
    cashflow_history = []
    daily_net = defaultdict(float)
    for t in sorted_all_tx:
        dt = str(t.get("transaction_date"))[:10]
        amt = float(t.get("amount", 0))
        if t.get("transaction_type") == "credit":
            daily_net[dt] += amt
        else:
            daily_net[dt] -= amt

    for dt in sorted(daily_net.keys()):
        running_balance += daily_net[dt]
        cashflow_history.append({
            "date": dt,
            "net_flow": round(daily_net[dt], 2),
            "cumulative_balance": round(running_balance, 2)
        })

    return {
        "income_vs_expense": income_vs_expense,
        "category_spending": category_spending,
        "daily_spending": daily_spending,
        "cashflow_history": cashflow_history
    }
