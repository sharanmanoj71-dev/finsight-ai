from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.firebase_auth import get_current_user, AuthenticatedUser
from app.core.database import db
from app.models.schemas import AnomalyAlertItem, AnomalyReviewRequest
from app.services.anomaly_detector import anomaly_detector

router = APIRouter(prefix="/anomalies", tags=["Anomaly Detection"])

@router.get("/", response_model=List[AnomalyAlertItem])
async def list_anomalies(user: AuthenticatedUser = Depends(get_current_user)):
    alerts = db.get_anomaly_alerts(user.uid)
    transactions = db.get_transactions(user.uid, limit=3000)

    # If no alerts stored yet, calculate dynamically
    if not alerts and transactions:
        detected = anomaly_detector.analyze(transactions)
        db.save_anomaly_alerts(user.uid, detected)
        alerts = db.get_anomaly_alerts(user.uid)

    items = []
    for a in alerts:
        items.append(AnomalyAlertItem(
            id=a["id"],
            firebase_uid=user.uid,
            transaction_id=a["transaction_id"],
            anomaly_type=a["anomaly_type"],
            severity=a["severity"],
            explanation=a["explanation"],
            reviewed=bool(a.get("reviewed")),
            user_note=a.get("user_note"),
            transaction_date=a.get("transaction_date"),
            description=a.get("description"),
            merchant=a.get("merchant"),
            amount=float(a["amount"]) if a.get("amount") is not None else None,
            category=a.get("category"),
            transaction_type=a.get("transaction_type"),
            created_at=a.get("created_at")
        ))
    return items

@router.patch("/{alert_id}")
async def review_anomaly_alert(
    alert_id: str,
    payload: AnomalyReviewRequest,
    user: AuthenticatedUser = Depends(get_current_user)
):
    success = db.update_anomaly_alert(
        alert_id=alert_id,
        firebase_uid=user.uid,
        reviewed=payload.reviewed,
        user_note=payload.user_note
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found or unauthorized."
        )
    return {"status": "success", "message": "Alert status updated successfully."}

@router.post("/refresh")
async def refresh_anomalies(user: AuthenticatedUser = Depends(get_current_user)):
    transactions = db.get_transactions(user.uid, limit=3000)
    detected = anomaly_detector.analyze(transactions)
    db.save_anomaly_alerts(user.uid, detected)
    return {"status": "success", "message": f"Evaluated transactions. {len(detected)} unusual activity alerts recorded."}
