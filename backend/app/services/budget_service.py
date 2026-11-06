from typing import List, Dict, Any, Tuple
from collections import defaultdict
from app.models.schemas import BudgetItem, BudgetOverviewResponse

class BudgetService:
    """
    Intelligent budgeting service for monitoring category caps,
    tracking monthly actuals against targets, detecting overages, and generating recommendations.
    """

    DEFAULT_BUDGET_TARGETS = {
        "Food and dining": 600.0,
        "Shopping": 350.0,
        "Travel and transportation": 250.0,
        "Bills and utilities": 400.0,
        "Healthcare": 200.0,
        "Education": 150.0,
        "Entertainment": 200.0,
        "Housing and rent": 1500.0,
        "Investments": 500.0,
        "Other expenses": 250.0
    }

    def calculate_overview(
        self,
        budgets_from_db: List[dict],
        transactions: List[dict],
        month: int,
        year: int
    ) -> BudgetOverviewResponse:
        # Filter transactions for specified month and year
        month_debits = []
        for t in transactions:
            if t.get("transaction_type") != "debit":
                continue
            date_str = str(t.get("transaction_date"))[:10]
            try:
                # Expecting YYYY-MM-DD
                parts = date_str.split("-")
                t_year = int(parts[0])
                t_month = int(parts[1])
                if t_year == year and t_month == month:
                    month_debits.append(t)
            except Exception:
                continue

        # Aggregate actual spent by category
        spent_by_category = defaultdict(float)
        for t in month_debits:
            cat = t.get("category", "Other expenses")
            spent_by_category[cat] += float(t.get("amount", 0))

        # Build budget map from DB, falling back to defaults if user has none configured
        budget_map = {}
        for b in budgets_from_db:
            budget_map[b["category"]] = float(b["monthly_limit"])

        # If user has no custom budgets for this month, suggest defaults
        if not budget_map:
            budget_map = dict(self.DEFAULT_BUDGET_TARGETS)

        # Include any categories where user has spent money even if not initially budgeted
        for cat in spent_by_category.keys():
            if cat not in budget_map and cat != "Salary and income" and cat != "Transfers":
                budget_map[cat] = round(spent_by_category[cat] * 1.15, 2)

        category_items: List[BudgetItem] = []
        total_budget = 0.0
        total_spent = 0.0
        warnings = []
        recommendations = []

        for cat, limit in budget_map.items():
            if cat in ["Salary and income", "Transfers"]:
                continue
            spent = round(spent_by_category.get(cat, 0.0), 2)
            remaining = round(limit - spent, 2)
            pct = round((spent / limit) * 100, 1) if limit > 0 else 100.0
            is_over = spent > limit

            total_budget += limit
            total_spent += spent

            if is_over:
                over_amt = spent - limit
                warnings.append(f"Over budget in '{cat}': Spent ${spent:,.2f} of ${limit:,.2f} limit (+${over_amt:,.2f} / {pct:.0f}%).")
            elif pct >= 85.0:
                warnings.append(f"Approaching budget cap in '{cat}': {pct:.0f}% utilized with ${remaining:,.2f} remaining.")

            category_items.append(BudgetItem(
                category=cat,
                monthly_limit=limit,
                month=month,
                year=year,
                actual_spent=spent,
                remaining=remaining,
                percent_used=pct,
                is_overbudget=is_over
            ))

        total_remaining = round(total_budget - total_spent, 2)
        overall_pct = round((total_spent / total_budget) * 100, 1) if total_budget > 0 else 0.0

        if overall_pct > 100.0:
            recommendations.append(f"Total spending exceeds planned budget by ${abs(total_remaining):,.2f}. Consider trimming flexible shopping and dining allocations.")
        elif overall_pct > 80.0:
            recommendations.append(f"Overall monthly spending is at {overall_pct:.0f}%. Pace daily spending under ${(total_remaining / 10):,.2f}/day for remainder of month.")
        else:
            recommendations.append(f"Healthy pacing: You have preserved ${total_remaining:,.2f} of your planned monthly budget.")

        # Sort category items: overbudget first, then highest spend
        category_items.sort(key=lambda x: (not x.is_overbudget, -x.actual_spent))

        return BudgetOverviewResponse(
            month=month,
            year=year,
            total_budget=round(total_budget, 2),
            total_spent=round(total_spent, 2),
            total_remaining=total_remaining,
            overall_percent=overall_pct,
            categories=category_items,
            warnings=warnings,
            recommendations=recommendations
        )

budget_service = BudgetService()
