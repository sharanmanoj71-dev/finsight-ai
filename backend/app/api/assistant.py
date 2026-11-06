from fastapi import APIRouter, Depends, Body
from app.core.firebase_auth import get_current_user, AuthenticatedUser
from app.core.database import db
from app.models.schemas import ChatRequest, ChatResponse
from app.services.assistant_service import assistant_service

router = APIRouter(prefix="/assistant", tags=["FinSight Assistant"])

@router.post("/chat", response_model=ChatResponse)
async def chat_with_assistant(
    payload: ChatRequest,
    user: AuthenticatedUser = Depends(get_current_user)
):
    transactions = db.get_transactions(user.uid, limit=3000)
    recurring = db.get_recurring_payments(user.uid)
    anomalies = db.get_anomaly_alerts(user.uid)
    budgets = db.get_budgets(user.uid, 3, 2026) # default lookup

    hist_dicts = [{"role": h.role, "content": h.content} for h in (payload.history or [])]

    answer, ctx_used, followups = assistant_service.process_query(
        query=payload.message,
        transactions=transactions,
        recurring=recurring,
        anomalies=anomalies,
        budgets=budgets,
        history=hist_dicts
    )

    return ChatResponse(
        response=answer,
        financial_context_used=ctx_used,
        suggested_followups=followups
    )
