from fastapi import APIRouter, Depends
from app.core.firebase_auth import get_current_user, AuthenticatedUser
from app.core.database import db
from app.models.schemas import FinancialHealthResponse
from app.services.health_analyzer import health_analyzer
from app.services.recurring_detector import recurring_detector

router = APIRouter(prefix="/health", tags=["Financial Health"])

@router.get("/", response_model=FinancialHealthResponse)
async def get_financial_health(user: AuthenticatedUser = Depends(get_current_user)):
    transactions = db.get_transactions(user.uid, limit=3000)
    recurring = db.get_recurring_payments(user.uid)
    
    # Calculate monthly recurring total
    rec_monthly = 0.0
    for r in recurring:
        a = float(r["amount"])
        f = r["frequency"]
        if f == "weekly":
            rec_monthly += a * 4.33
        elif f == "bi-weekly":
            rec_monthly += a * 2.16
        elif f == "monthly":
            rec_monthly += a
        elif f == "quarterly":
            rec_monthly += a / 3.0
        elif f == "yearly":
            rec_monthly += a / 12.0

    report = health_analyzer.evaluate(transactions, rec_monthly)
    return report
