import uuid
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from typing import List

from app.core.firebase_auth import get_current_user, AuthenticatedUser
from app.core.database import db
from app.models.schemas import StatementUploadPreviewResponse, SaveExtractedTransactionsRequest
from app.services.statement_parser import statement_parser
from app.services.recurring_detector import recurring_detector
from app.services.anomaly_detector import anomaly_detector

router = APIRouter(prefix="/statements", tags=["Bank Statements"])

MAX_FILE_SIZE = 15 * 1024 * 1024 # 15MB limit

@router.post("/upload", response_model=StatementUploadPreviewResponse)
async def upload_bank_statement(
    file: UploadFile = File(...),
    user: AuthenticatedUser = Depends(get_current_user)
):
    filename = file.filename or "statement"
    lower_name = filename.lower()
    
    # 1. Validate file extension
    file_type = "pdf" if lower_name.endswith(".pdf") else "csv" if lower_name.endswith(".csv") else None
    if not file_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Please upload a PDF (.pdf) or CSV (.csv) bank statement."
        )

    # 2. Read and validate file size
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum allowed size of 15MB (File size: {len(contents) / (1024*1024):.2f}MB)"
        )
    if len(contents) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty."
        )

    # 3. Parse statement
    try:
        if file_type == "csv":
            extracted, op_bal, cl_bal, warnings = statement_parser.parse_csv(contents, filename)
        else:
            extracted, op_bal, cl_bal, warnings = statement_parser.parse_pdf(contents, filename)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to extract bank statement: {str(e)}"
        )

    # 4. Check for duplicates against existing transactions
    existing_txs = db.get_transactions(user.uid, limit=2000)
    checked_extracted = statement_parser.detect_duplicates(extracted, existing_txs)
    duplicates_count = sum(1 for tx in checked_extracted if tx.is_duplicate)

    statement_id = str(uuid.uuid4())

    return StatementUploadPreviewResponse(
        statement_id=statement_id,
        filename=filename,
        file_type=file_type,
        opening_balance=round(op_bal, 2),
        closing_balance=round(cl_bal, 2),
        total_extracted=len(checked_extracted),
        duplicates_count=duplicates_count,
        transactions=checked_extracted,
        warnings=warnings
    )

@router.post("/save")
async def save_extracted_transactions(
    payload: SaveExtractedTransactionsRequest,
    user: AuthenticatedUser = Depends(get_current_user)
):
    if not payload.transactions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No transactions provided to save."
        )

    # 1. Create statement record
    statement = db.create_statement(
        firebase_uid=user.uid,
        filename=payload.filename,
        file_type=payload.file_type,
        opening_balance=payload.opening_balance,
        closing_balance=payload.closing_balance
    )

    # 2. Filter out duplicates or user-deselected rows and save transactions
    to_save = []
    for tx in payload.transactions:
        to_save.append({
            "id": tx.id or str(uuid.uuid4()),
            "firebase_uid": user.uid,
            "statement_id": statement["id"],
            "transaction_date": tx.transaction_date,
            "description": tx.description,
            "merchant": tx.merchant or tx.description,
            "amount": tx.amount,
            "transaction_type": tx.transaction_type,
            "category": tx.category or tx.predicted_category or "Other expenses",
            "predicted_category": tx.predicted_category,
            "category_confidence": tx.category_confidence or 0.85,
            "is_reviewed": 0
        })

    saved = db.insert_transactions(to_save)

    # 3. Automatically trigger recurring payment analysis and anomaly alerts
    all_user_txs = db.get_transactions(user.uid, limit=3000)
    
    # Recurring detection
    rec_items, monthly_sum, annual_sum, forgotten = recurring_detector.detect(all_user_txs)
    db.save_recurring_payments(user.uid, rec_items)

    # Anomaly detection
    new_alerts = anomaly_detector.analyze(all_user_txs)
    db.save_anomaly_alerts(user.uid, new_alerts)

    return {
        "status": "success",
        "message": f"Successfully imported {len(saved)} transactions from '{payload.filename}'.",
        "statement_id": statement["id"],
        "saved_count": len(saved),
        "recurring_detected_count": len(rec_items),
        "anomalies_detected_count": len(new_alerts)
    }

@router.get("/")
async def list_statements(user: AuthenticatedUser = Depends(get_current_user)):
    statements = db.get_statements(user.uid)
    return {"statements": statements}

@router.delete("/{statement_id}")
async def delete_statement(
    statement_id: str,
    user: AuthenticatedUser = Depends(get_current_user)
):
    db.delete_statement_transactions(statement_id, user.uid)
    
    # Re-evaluate recurring & anomalies after deletion
    remaining_txs = db.get_transactions(user.uid, limit=3000)
    rec_items, _, _, _ = recurring_detector.detect(remaining_txs)
    db.save_recurring_payments(user.uid, rec_items)
    new_alerts = anomaly_detector.analyze(remaining_txs)
    db.save_anomaly_alerts(user.uid, new_alerts)

    return {"status": "success", "message": "Statement and associated transactions deleted."}
