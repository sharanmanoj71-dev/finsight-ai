from fastapi import APIRouter, Depends, Body
from app.core.firebase_auth import get_current_user, AuthenticatedUser
from app.core.database import db

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.get("/me")
async def get_me(user: AuthenticatedUser = Depends(get_current_user)):
    profile = db.get_profile(user.uid)
    return {
        "user": user,
        "profile": profile,
        "database_status": db.status_info
    }

@router.post("/sync-profile")
async def sync_profile(
    full_name: str = Body(None, embed=True),
    user: AuthenticatedUser = Depends(get_current_user)
):
    profile = db.upsert_profile(user.uid, user.email, full_name or user.name)
    return {"status": "success", "profile": profile}
