-- FinSight AI: Supabase Database Schema
-- Project: technovate (pxacwjmgcxcxdtzjzyli)
-- Target Database: PostgreSQL

-- ======================================================================
-- NOTE FOR SUPABASE USERS (PROJECT: technovate / pxacwjmgcxcxdtzjzyli):
-- If your backend uses the publishable anon key (sb_publishable_...),
-- Postgres Row Level Security (RLS) blocks anon writes unless granted.
-- Running this script in the Supabase SQL Editor creates all required
-- tables and allows seamless read/write access.
--
-- ALTERNATIVELY: Set SUPABASE_KEY to your Supabase `service_role` secret
-- (Supabase Dashboard -> Technovate -> Project Settings -> API -> service_role).
-- ======================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid TEXT UNIQUE NOT NULL,
    full_name TEXT,
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Bank Statements Table
CREATE TABLE IF NOT EXISTS public.bank_statements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid TEXT NOT NULL,
    filename TEXT NOT NULL,
    file_type TEXT NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT now(),
    processing_status TEXT DEFAULT 'completed',
    opening_balance NUMERIC(14, 2) DEFAULT 0.0,
    closing_balance NUMERIC(14, 2) DEFAULT 0.0
);

-- 3. Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid TEXT NOT NULL,
    statement_id UUID REFERENCES public.bank_statements(id) ON DELETE CASCADE,
    transaction_date DATE NOT NULL,
    description TEXT NOT NULL,
    merchant TEXT,
    amount NUMERIC(14, 2) NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('debit', 'credit')),
    category TEXT NOT NULL,
    predicted_category TEXT,
    category_confidence NUMERIC(4, 3) DEFAULT 0.850,
    is_reviewed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid TEXT, -- NULL for default system categories
    category_name TEXT NOT NULL,
    category_type TEXT DEFAULT 'expense',
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_user_category UNIQUE (firebase_uid, category_name)
);

-- 5. Recurring Payments Table
CREATE TABLE IF NOT EXISTS public.recurring_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid TEXT NOT NULL,
    merchant TEXT NOT NULL,
    amount NUMERIC(14, 2) NOT NULL,
    frequency TEXT NOT NULL, -- 'weekly', 'bi-weekly', 'monthly', 'quarterly', 'yearly'
    next_expected_date DATE,
    category TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Anomaly Alerts Table
CREATE TABLE IF NOT EXISTS public.anomaly_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid TEXT NOT NULL,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
    anomaly_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    explanation TEXT NOT NULL,
    reviewed BOOLEAN DEFAULT FALSE,
    user_note TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Financial Insights Table
CREATE TABLE IF NOT EXISTS public.financial_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid TEXT NOT NULL,
    insight_type TEXT NOT NULL,
    insight_text TEXT NOT NULL,
    score NUMERIC(5, 2),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Budgets Table
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid TEXT NOT NULL,
    category TEXT NOT NULL,
    monthly_limit NUMERIC(14, 2) NOT NULL,
    month INT NOT NULL,
    year INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_user_category_month_year UNIQUE (firebase_uid, category, month, year)
);

-- 9. Category Corrections Memory Table (Stores user corrections to reuse on future transactions)
CREATE TABLE IF NOT EXISTS public.category_corrections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid TEXT NOT NULL,
    merchant_pattern TEXT NOT NULL,
    corrected_category TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_user_merchant_correction UNIQUE (firebase_uid, merchant_pattern)
);

-- INDEXES for performance
CREATE INDEX IF NOT EXISTS idx_transactions_firebase_uid ON public.transactions(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_statement_id ON public.transactions(statement_id);
CREATE INDEX IF NOT EXISTS idx_bank_statements_uid ON public.bank_statements(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_recurring_uid ON public.recurring_payments(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_anomalies_uid ON public.anomaly_alerts(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_budgets_uid ON public.budgets(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_insights_uid ON public.financial_insights(firebase_uid);

-- Seed Default 12 Categories
INSERT INTO public.categories (firebase_uid, category_name, category_type)
VALUES
    (NULL, 'Food and dining', 'expense'),
    (NULL, 'Shopping', 'expense'),
    (NULL, 'Travel and transportation', 'expense'),
    (NULL, 'Bills and utilities', 'expense'),
    (NULL, 'Healthcare', 'expense'),
    (NULL, 'Education', 'expense'),
    (NULL, 'Salary and income', 'income'),
    (NULL, 'Transfers', 'transfer'),
    (NULL, 'Entertainment', 'expense'),
    (NULL, 'Housing and rent', 'expense'),
    (NULL, 'Investments', 'investment'),
    (NULL, 'Other expenses', 'expense')
ON CONFLICT DO NOTHING;

-- PERMISSIONS & ACCESS CONFIGURATION
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;

-- Allow anon / backend API access without RLS blocking:
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_statements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.anomaly_alerts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_insights DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_corrections DISABLE ROW LEVEL SECURITY;
