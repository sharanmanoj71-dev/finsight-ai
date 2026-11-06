from datetime import datetime
from fastapi import APIRouter, Depends, Query, Body, HTTPException, status
from app.core.firebase_auth import get_current_user, AuthenticatedUser
from app.core.database import db
from app.models.schemas import BudgetOverviewResponse, UpsertBudgetRequest
from app.services.budget_service import budget_service

router = APIRouter(prefix="/budgets", tags=["Budget Planner"])

@router.get("/", response_model=BudgetOverviewResponse)
async def get_budgets(
    month: int = Query(None),
    year: int = Query(None),
    user: AuthenticatedUser = Depends(get_current_user)
):
    now = datetime.utcnow()
    m = month or now.month
    y = year or now.year

    user_budgets = db.get_budgets(user.uid, m, y)
    transactions = db.get_transactions(user.uid, limit=3000)

    overview = budget_service.calculate_overview(user_budgets, transactions, m, y)
    return overview

@router.post("/")
async def upsert_budget(
    payload: UpsertBudgetRequest,
    user: AuthenticatedUser = Depends(get_current_user)
):
    if payload.monthly_limit < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Monthly limit must be positive."
        )

    saved = db.upsert_budget(
        firebase_uid=user.uid,
        category=payload.category,
        monthly_limit=payload.monthly_limit,
        month=payload.month,
        year=payload.year
    )
    return {"status": "success", "budget": saved}
