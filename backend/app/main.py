from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import db
from app.api import (
    auth,
    statements,
    transactions,
    analytics,
    recurring,
    anomalies,
    health,
    cashflow,
    budgets,
    assistant
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("=" * 60)
    print(f"🚀 FinSight AI Backend started")
    print(f"📦 Database Engine: {db.status_info['engine']}")
    print(f"🎯 Supabase Project ID: {settings.SUPABASE_PROJECT_ID}")
    print(f"🔐 Firebase Project ID: {settings.FIREBASE_PROJECT_ID}")
    print("=" * 60)
    yield
    print("🛑 FinSight AI Backend stopping")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI-Based Bank Statement Intelligence & Financial Health Analyzer API",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In development/hackathon allow all or settings.CORS_ORIGINS
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routers
api_v1 = settings.API_V1_STR
app.include_router(auth.router, prefix=api_v1)
app.include_router(statements.router, prefix=api_v1)
app.include_router(transactions.router, prefix=api_v1)
app.include_router(analytics.router, prefix=api_v1)
app.include_router(recurring.router, prefix=api_v1)
app.include_router(anomalies.router, prefix=api_v1)
app.include_router(health.router, prefix=api_v1)
app.include_router(cashflow.router, prefix=api_v1)
app.include_router(budgets.router, prefix=api_v1)
app.include_router(assistant.router, prefix=api_v1)

@app.get("/")
async def root():
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "database": db.status_info,
        "docs_url": "/docs"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "database": db.status_info
    }
