from fastapi import APIRouter, Depends
from app.core.firebase_auth import get_current_user, AuthenticatedUser
from app.core.database import db
from app.models.schemas import RecurringPaymentsSummary, RecurringPaymentItem
from app.services.recurring_detector import recurring_detector

router = APIRouter(prefix="/recurring", tags=["Recurring Payments"])

@router.get("/", response_model=RecurringPaymentsSummary)
async def get_recurring_payments(user: AuthenticatedUser = Depends(get_current_user)):
    items = db.get_recurring_payments(user.uid)
    transactions = db.get_transactions(user.uid, limit=3000)
    
    # If no items stored yet, calculate dynamically
    if not items and transactions:
        detected, monthly_sum, annual_sum, forgotten = recurring_detector.detect(transactions)
        db.save_recurring_payments(user.uid, detected)
        items = db.get_recurring_payments(user.uid)
    else:
        # compute summary metrics from stored items
        monthly_sum = 0.0
        for r in items:
            a = float(r["amount"])
            f = r["frequency"]
            if f == "weekly":
                monthly_sum += a * 4.33
            elif f == "bi-weekly":
                monthly_sum += a * 2.16
            elif f == "monthly":
                monthly_sum += a
            elif f == "quarterly":
                monthly_sum += a / 3.0
            elif f == "yearly":
                monthly_sum += a / 12.0
        annual_sum = monthly_sum * 12.0
        _, _, _, forgotten = recurring_detector.detect(transactions)

    return RecurringPaymentsSummary(
        items=[RecurringPaymentItem(**item) for item in items],
        total_monthly_recurring=round(monthly_sum, 2),
        total_annual_recurring=round(annual_sum, 2),
        total_subscriptions=len(items),
        forgotten_subscription_alerts=forgotten
    )

@router.post("/refresh", response_model=RecurringPaymentsSummary)
async def refresh_recurring_payments(user: AuthenticatedUser = Depends(get_current_user)):
    transactions = db.get_transactions(user.uid, limit=3000)
    detected, monthly_sum, annual_sum, forgotten = recurring_detector.detect(transactions)
    db.save_recurring_payments(user.uid, detected)
    items = db.get_recurring_payments(user.uid)
    return RecurringPaymentsSummary(
        items=[RecurringPaymentItem(**item) for item in items],
        total_monthly_recurring=round(monthly_sum, 2),
        total_annual_recurring=round(annual_sum, 2),
        total_subscriptions=len(items),
        forgotten_subscription_alerts=forgotten
    )
