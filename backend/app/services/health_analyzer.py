from typing import List, Dict, Any, Tuple
from collections import defaultdict
import numpy as np
from app.models.schemas import FinancialHealthResponse, HealthScoreDimension

class FinancialHealthAnalyzer:
    """
    Transparent Multi-Factor Financial Health Scoring Engine.
    Evaluates 6 rigorous financial wellness dimensions with weights,
    calculates normalized score (0-100), and outputs personalized strengths,
    risks, and actionable monthly optimization levers.
    """

    METHODOLOGY = {
        "dimensions": [
            {"name": "Savings Rate", "weight": 0.25, "benchmark": ">= 20% of net income"},
            {"name": "Expense-to-Income Ratio", "weight": 0.20, "benchmark": "<= 70% of income"},
            {"name": "Income Stability", "weight": 0.15, "benchmark": "Predictable recurring deposits"},
            {"name": "Spending Consistency", "weight": 0.15, "benchmark": "Low day-to-day variance"},
            {"name": "Recurring Expense Burden", "weight": 0.15, "benchmark": "<= 35% of monthly income"},
            {"name": "Cash Flow Stability", "weight": 0.10, "benchmark": "Positive net flow & safety cushion"}
        ],
        "disclaimer": "This score is an educational financial wellness indicator computed solely from statement transaction data. It is not a credit score (FICO/Vantage) and does not guarantee loan eligibility or financial outcomes."
    }

    def evaluate(self, transactions: List[dict], recurring_monthly: float = 0.0) -> FinancialHealthResponse:
        if not transactions:
            return self._empty_response()

        # Split credits and debits
        credits = [t for t in transactions if t.get("transaction_type") == "credit"]
        debits = [t for t in transactions if t.get("transaction_type") == "debit"]

        total_income = sum(float(t["amount"]) for t in credits)
        total_expenses = sum(float(t["amount"]) for t in debits)
        net_savings = total_income - total_expenses

        # 1. Dimension: Savings Rate (Weight: 25%)
        if total_income > 0:
            savings_rate = max(0.0, net_savings / total_income)
        else:
            savings_rate = 0.0

        if savings_rate >= 0.30:
            dim1_score = 100.0
            dim1_status = "excellent"
        elif savings_rate >= 0.20:
            dim1_score = 85.0 + (savings_rate - 0.20) * 150
            dim1_status = "good"
        elif savings_rate >= 0.10:
            dim1_score = 65.0 + (savings_rate - 0.10) * 200
            dim1_status = "moderate"
        elif savings_rate > 0:
            dim1_score = 40.0 + savings_rate * 250
            dim1_status = "needs_attention"
        else:
            dim1_score = 20.0
            dim1_status = "critical"

        dim1 = HealthScoreDimension(
            name="Savings Rate",
            score=round(dim1_score, 1),
            weight=0.25,
            status=dim1_status,
            metric_value=f"{savings_rate * 100:.1f}%",
            explanation=f"Net savings of ${max(0.0, net_savings):,.2f} represents {savings_rate * 100:.1f}% of total inflows."
        )

        # 2. Dimension: Expense-to-Income Ratio (Weight: 20%)
        if total_income > 0:
            eti_ratio = total_expenses / total_income
        else:
            eti_ratio = 1.5

        if eti_ratio <= 0.50:
            dim2_score = 100.0
            dim2_status = "excellent"
        elif eti_ratio <= 0.70:
            dim2_score = 85.0 - (eti_ratio - 0.50) * 75
            dim2_status = "good"
        elif eti_ratio <= 0.90:
            dim2_score = 65.0 - (eti_ratio - 0.70) * 100
            dim2_status = "moderate"
        elif eti_ratio <= 1.00:
            dim2_score = 45.0
            dim2_status = "needs_attention"
        else:
            dim2_score = max(10.0, 40.0 - (eti_ratio - 1.0) * 50)
            dim2_status = "critical"

        dim2 = HealthScoreDimension(
            name="Expense-to-Income Ratio",
            score=round(dim2_score, 1),
            weight=0.20,
            status=dim2_status,
            metric_value=f"{eti_ratio * 100:.1f}%",
            explanation=f"Expenses consume {eti_ratio * 100:.1f}% of total inflows."
        )

        # 3. Dimension: Income Stability (Weight: 15%)
        # Check count of income deposits and variance
        credit_amounts = [float(t["amount"]) for t in credits]
        if len(credit_amounts) >= 2:
            std_income = np.std(credit_amounts)
            mean_income = np.mean(credit_amounts)
            income_cv = std_income / (mean_income + 1e-6)
            if income_cv < 0.25:
                dim3_score = 95.0
                dim3_status = "excellent"
            elif income_cv < 0.60:
                dim3_score = 80.0
                dim3_status = "good"
            else:
                dim3_score = 65.0
                dim3_status = "moderate"
        elif len(credit_amounts) == 1:
            dim3_score = 70.0
            dim3_status = "moderate"
        else:
            dim3_score = 30.0
            dim3_status = "critical"

        dim3 = HealthScoreDimension(
            name="Income Stability",
            score=round(dim3_score, 1),
            weight=0.15,
            status=dim3_status,
            metric_value=f"{len(credit_amounts)} deposit events",
            explanation=f"Based on frequency and variance across {len(credit_amounts)} income deposits."
        )

        # 4. Dimension: Spending Consistency (Weight: 15%)
        # Daily spending variance
        daily_spends = defaultdict(float)
        for t in debits:
            dt = str(t["transaction_date"])[:10]
            daily_spends[dt] += float(t["amount"])

        if daily_spends:
            d_vals = list(daily_spends.values())
            d_std = np.std(d_vals)
            d_mean = np.mean(d_vals)
            spending_cv = d_std / (d_mean + 1e-6)
            if spending_cv < 0.8:
                dim4_score = 90.0
                dim4_status = "excellent"
            elif spending_cv < 1.4:
                dim4_score = 75.0
                dim4_status = "good"
            elif spending_cv < 2.0:
                dim4_score = 60.0
                dim4_status = "moderate"
            else:
                dim4_score = 45.0
                dim4_status = "needs_attention"
        else:
            dim4_score = 70.0
            dim4_status = "moderate"

        dim4 = HealthScoreDimension(
            name="Spending Consistency",
            score=round(dim4_score, 1),
            weight=0.15,
            status=dim4_status,
            metric_value=f"${np.mean(list(daily_spends.values())):,.2f}/day avg" if daily_spends else "$0",
            explanation="Measures spending volatility and vulnerability to abrupt cash drains."
        )

        # 5. Dimension: Recurring Expense Burden (Weight: 15%)
        est_monthly_income = total_income if total_income > 0 else 3000.0
        rec_ratio = recurring_monthly / est_monthly_income

        if rec_ratio <= 0.20:
            dim5_score = 95.0
            dim5_status = "excellent"
        elif rec_ratio <= 0.35:
            dim5_score = 80.0
            dim5_status = "good"
        elif rec_ratio <= 0.50:
            dim5_score = 60.0
            dim5_status = "moderate"
        else:
            dim5_score = 40.0
            dim5_status = "critical"

        dim5 = HealthScoreDimension(
            name="Recurring Expense Burden",
            score=round(dim5_score, 1),
            weight=0.15,
            status=dim5_status,
            metric_value=f"${recurring_monthly:,.2f}/mo ({rec_ratio*100:.1f}%)",
            explanation=f"Fixed subscriptions, rent, and utility commitments comprise {rec_ratio*100:.1f}% of income."
        )

        # 6. Dimension: Cash Flow Stability & Buffer (Weight: 10%)
        if net_savings > 1000:
            dim6_score = 95.0
            dim6_status = "excellent"
        elif net_savings >= 0:
            dim6_score = 75.0
            dim6_status = "good"
        elif net_savings > -500:
            dim6_score = 50.0
            dim6_status = "needs_attention"
        else:
            dim6_score = 25.0
            dim6_status = "critical"

        dim6 = HealthScoreDimension(
            name="Cash Flow Stability",
            score=round(dim6_score, 1),
            weight=0.10,
            status=dim6_status,
            metric_value=f"+${net_savings:,.2f}" if net_savings >= 0 else f"-${abs(net_savings):,.2f}",
            explanation="Reflects whether operational cash flow is expanding or diminishing liquidity reserves."
        )

        dimensions = [dim1, dim2, dim3, dim4, dim5, dim6]
        overall = sum(d.score * d.weight for d in dimensions)
        overall_score = int(round(overall))

        # Determine letter grade
        if overall_score >= 90:
            grade = "A+"
        elif overall_score >= 80:
            grade = "A"
        elif overall_score >= 70:
            grade = "B"
        elif overall_score >= 60:
            grade = "C"
        else:
            grade = "D"

        # Formulate strengths, weaknesses, risks, and recommendations
        strengths = []
        weaknesses = []
        risks = []
        improvements = []
        recommendations = []

        if savings_rate >= 0.20:
            strengths.append(f"Strong savings efficiency: You save {savings_rate*100:.1f}% of income, well above the 20% rule.")
        else:
            weaknesses.append(f"Low savings buffer: Currently saving {savings_rate*100:.1f}% of income.")
            improvements.append("Automate a 5% transfer to savings on each payday before discretionary spending.")

        if eti_ratio <= 0.70:
            strengths.append(f"Controlled operating expenses: Only {eti_ratio*100:.1f}% of income allocated to expenses.")
        else:
            weaknesses.append(f"Elevated burn rate: Expenses consume {eti_ratio*100:.1f}% of gross inflows.")
            risks.append("Living close to cash-inflow limits leaves minimal margin for emergencies.")

        if rec_ratio > 0.35:
            weaknesses.append(f"High fixed payment commitments (${recurring_monthly:,.2f}/month).")
            risks.append("Recurring subscription and utility obligations exceed recommended 35% threshold.")
            recommendations.append("Audit monthly subscriptions in the 'Recurring Payments' tab to cancel dormant services.")

        if net_savings >= 0:
            strengths.append(f"Positive net cash accumulation: +${net_savings:,.2f} retained in this period.")
        else:
            risks.append(f"Deficit cash flow: Net outflows exceeded income by ${abs(net_savings):,.2f}.")
            improvements.append("Impose a temporary 2-week freeze on non-essential dining and shopping.")

        recommendations.append("Build or maintain a 3-month emergency cushion in a high-yield savings vehicle.")
        recommendations.append("Set category budget caps in Budget Planner for your highest expense categories.")

        return FinancialHealthResponse(
            overall_score=overall_score,
            grade=grade,
            breakdown=dimensions,
            strengths=strengths if strengths else ["Consistent transaction activity recorded."],
            weaknesses=weaknesses if weaknesses else ["None detected at current spending levels."],
            risk_indicators=risks if risks else ["No critical structural financial risks identified."],
            improvement_suggestions=improvements if improvements else ["Continue maintaining current savings habits."],
            personalized_recommendations=recommendations,
            methodology=self.METHODOLOGY,
            disclaimer=self.METHODOLOGY["disclaimer"]
        )

    def _empty_response(self) -> FinancialHealthResponse:
        return FinancialHealthResponse(
            overall_score=50,
            grade="N/A",
            breakdown=[],
            strengths=["Upload statements to begin health assessment."],
            weaknesses=[],
            risk_indicators=[],
            improvement_suggestions=["Upload your primary checking statement to establish a baseline."],
            personalized_recommendations=["Import at least 30 days of transaction data."],
            methodology=self.METHODOLOGY,
            disclaimer=self.METHODOLOGY["disclaimer"]
        )

health_analyzer = FinancialHealthAnalyzer()
