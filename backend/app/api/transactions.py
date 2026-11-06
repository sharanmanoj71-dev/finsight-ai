import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException, status, Body

from app.core.firebase_auth import get_current_user, AuthenticatedUser
from app.core.database import db
from app.models.schemas import TransactionResponse, TransactionUpdateRequest, CategoryItem

router = APIRouter(prefix="/transactions", tags=["Transactions"])

@router.get("/", response_model=List[TransactionResponse])
async def list_transactions(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    transaction_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    statement_id: Optional[str] = Query(None),
    limit: int = Query(500, le=2000),
    user: AuthenticatedUser = Depends(get_current_user)
):
    rows = db.get_transactions(
        firebase_uid=user.uid,
        start_date=start_date,
        end_date=end_date,
        category=category,
        transaction_type=transaction_type,
        search=search,
        statement_id=statement_id,
        limit=limit
    )
    return rows

@router.patch("/{transaction_id}")
async def update_transaction(
    transaction_id: str,
    payload: TransactionUpdateRequest,
    user: AuthenticatedUser = Depends(get_current_user)
):
    update_data = {}
    if payload.category is not None:
        update_data["category"] = payload.category
        update_data["is_reviewed"] = 1
    if payload.merchant is not None:
        update_data["merchant"] = payload.merchant
    if payload.description is not None:
        update_data["description"] = payload.description
    if payload.amount is not None:
        update_data["amount"] = float(payload.amount)
    if payload.is_reviewed is not None:
        update_data["is_reviewed"] = 1 if payload.is_reviewed else 0

    if not update_data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields provided to update.")

    updated = db.update_transaction(transaction_id, user.uid, update_data)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found or unauthorized.")

    # If user corrected category and opted to remember rule, save pattern for future categorization
    if payload.category and payload.save_as_rule:
        merchant_name = updated.get("merchant") or updated.get("description", "")
        if merchant_name:
            db.save_category_correction(user.uid, merchant_name, payload.category)

    return {"status": "success", "transaction": updated}

@router.post("/", response_model=TransactionResponse)
async def create_manual_transaction(
    transaction_date: str = Body(...),
    description: str = Body(...),
    merchant: Optional[str] = Body(None),
    amount: float = Body(...),
    transaction_type: str = Body("debit"),
    category: Optional[str] = Body("Other expenses"),
    user: AuthenticatedUser = Depends(get_current_user)
):
    tx_id = str(uuid.uuid4())
    item = {
        "id": tx_id,
        "firebase_uid": user.uid,
        "statement_id": None,
        "transaction_date": transaction_date,
        "description": description,
        "merchant": merchant or description,
        "amount": round(abs(amount), 2),
        "transaction_type": transaction_type,
        "category": category or "Other expenses",
        "predicted_category": category,
        "category_confidence": 1.0,
        "is_reviewed": 1
    }
    db.insert_transactions([item])
    return item

@router.get("/categories", response_model=List[CategoryItem])
async def list_categories(user: AuthenticatedUser = Depends(get_current_user)):
    cats = db.get_categories(user.uid)
    return cats

@router.post("/categories")
async def add_custom_category(
    category_name: str = Body(..., embed=True),
    category_type: str = Body("expense", embed=True),
    user: AuthenticatedUser = Depends(get_current_user)
):
    cat = db.create_category(user.uid, category_name.strip(), category_type)
    return {"status": "success", "category": cat}
