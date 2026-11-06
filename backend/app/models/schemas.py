from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import date, datetime

class UserProfile(BaseModel):
    id: Optional[str] = None
    firebase_uid: str
    full_name: Optional[str] = None
    email: str
    created_at: Optional[str] = None

class ExtractedTransaction(BaseModel):
    id: Optional[str] = None
    transaction_date: str
    description: str
    merchant: Optional[str] = ""
    amount: float
    transaction_type: str # 'debit' or 'credit'
    category: Optional[str] = "Other expenses"
    predicted_category: Optional[str] = "Other expenses"
    category_confidence: Optional[float] = 0.85
    is_duplicate: Optional[bool] = False
    validation_error: Optional[str] = None

class StatementUploadPreviewResponse(BaseModel):
    statement_id: str
    filename: str
    file_type: str
    opening_balance: float
    closing_balance: float
    total_extracted: int
    duplicates_count: int
    transactions: List[ExtractedTransaction]
    warnings: List[str] = []

class SaveExtractedTransactionsRequest(BaseModel):
    statement_id: str
    filename: str
    file_type: str
    opening_balance: float
    closing_balance: float
    transactions: List[ExtractedTransaction]

class TransactionResponse(BaseModel):
    id: str
    firebase_uid: str
    statement_id: Optional[str] = None
    transaction_date: str
    description: str
    merchant: Optional[str] = ""
    amount: float
    transaction_type: str
    category: str
    predicted_category: Optional[str] = None
    category_confidence: Optional[float] = 0.85
    is_reviewed: bool = False
    created_at: Optional[str] = None

class TransactionUpdateRequest(BaseModel):
    category: Optional[str] = None
    merchant: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[float] = None
    is_reviewed: Optional[bool] = None
    save_as_rule: Optional[bool] = True # remember for future categorization

class CategoryItem(BaseModel):
    id: Optional[str] = None
    category_name: str
    category_type: str = "expense"

class RecurringPaymentItem(BaseModel):
    id: Optional[str] = None
    firebase_uid: Optional[str] = None
    merchant: str
    amount: float
    frequency: str # 'weekly', 'bi-weekly', 'monthly', 'quarterly', 'yearly'
    next_expected_date: Optional[str] = None
    category: Optional[str] = "Bills and utilities"
    status: Optional[str] = "active" # 'active', 'paused', 'cancelled'
    created_at: Optional[str] = None

class RecurringPaymentsSummary(BaseModel):
    items: List[RecurringPaymentItem]
    total_monthly_recurring: float
    total_annual_recurring: float
    total_subscriptions: int
    forgotten_subscription_alerts: List[Dict[str, Any]] = []

class AnomalyAlertItem(BaseModel):
    id: str
    firebase_uid: str
    transaction_id: str
    anomaly_type: str
    severity: str # 'low', 'medium', 'high', 'critical'
    explanation: str
    reviewed: bool = False
    user_note: Optional[str] = None
    transaction_date: Optional[str] = None
    description: Optional[str] = None
    merchant: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    transaction_type: Optional[str] = None
    created_at: Optional[str] = None

class AnomalyReviewRequest(BaseModel):
    reviewed: bool
    user_note: Optional[str] = None

class HealthScoreDimension(BaseModel):
    name: str
    score: float # 0 to 100
    weight: float # e.g. 0.25
    status: str # 'excellent', 'good', 'moderate', 'needs_attention', 'critical'
    metric_value: str
    explanation: str

class FinancialHealthResponse(BaseModel):
    overall_score: int # 0 to 100
    grade: str # 'A+', 'A', 'B', 'C', 'D'
    breakdown: List[HealthScoreDimension]
    strengths: List[str]
    weaknesses: List[str]
    risk_indicators: List[str]
    improvement_suggestions: List[str]
    personalized_recommendations: List[str]
    methodology: Dict[str, Any]
    disclaimer: str

class DailyForecastItem(BaseModel):
    date: str
    predicted_balance: float
    expected_income: float
    expected_expenses: float
    confidence_lower: float
    confidence_upper: float
    is_shortage: bool

class CashFlowForecastResponse(BaseModel):
    current_balance: float
    forecast_7d_balance: float
    forecast_30d_balance: float
    forecast_90d_balance: float
    timeline: List[DailyForecastItem]
    possible_shortages: List[Dict[str, Any]]
    upcoming_payment_pressure: List[Dict[str, Any]]
    assumptions: List[str]
    limitations: List[str]
    disclaimer: str

class BudgetItem(BaseModel):
    id: Optional[str] = None
    category: str
    monthly_limit: float
    month: int
    year: int
    actual_spent: Optional[float] = 0.0
    remaining: Optional[float] = 0.0
    percent_used: Optional[float] = 0.0
    is_overbudget: Optional[bool] = False

class BudgetOverviewResponse(BaseModel):
    month: int
    year: int
    total_budget: float
    total_spent: float
    total_remaining: float
    overall_percent: float
    categories: List[BudgetItem]
    warnings: List[str]
    recommendations: List[str]

class UpsertBudgetRequest(BaseModel):
    category: str
    monthly_limit: float
    month: int
    year: int

class ChatMessage(BaseModel):
    role: str # 'user' or 'assistant'
    content: str
    timestamp: Optional[str] = None

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []

class ChatResponse(BaseModel):
    response: str
    financial_context_used: Dict[str, Any] = {}
    suggested_followups: List[str] = []
