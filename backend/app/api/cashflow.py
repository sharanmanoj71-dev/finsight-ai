from fastapi import APIRouter, Depends, Query
from app.core.firebase_auth import get_current_user, AuthenticatedUser
from app.core.database import db
from app.models.schemas import CashFlowForecastResponse
from app.services.cashflow_forecaster import cashflow_forecaster

router = APIRouter(prefix="/cashflow", tags=["Cash-Flow Prediction"])

@router.get("/forecast", response_model=CashFlowForecastResponse)
async def get_forecast(
    days: int = Query(90, ge=7, le=90),
    user: AuthenticatedUser = Depends(get_current_user)
):
    transactions = db.get_transactions(user.uid, limit=3000)
    recurring = db.get_recurring_payments(user.uid)
    statements = db.get_statements(user.uid)

    # Determine starting balance
    if statements and statements[0].get("closing_balance"):
        current_balance = float(statements[0]["closing_balance"])
    elif transactions:
        credits = sum(float(t["amount"]) for t in transactions if t.get("transaction_type") == "credit")
        debits = sum(float(t["amount"]) for t in transactions if t.get("transaction_type") == "debit")
        current_balance = max(1000.0, credits - debits)
    else:
        current_balance = 3500.0

    forecast_res = cashflow_forecaster.forecast(
        transactions=transactions,
        recurring_payments=recurring,
        current_balance=current_balance,
        days=days
    )
    return forecast_res
