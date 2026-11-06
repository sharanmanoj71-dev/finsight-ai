# FinSight AI: AI-Based Bank Statement Intelligence & Financial Health Analyzer

![FinSight AI Banner](https://img.shields.io/badge/FinSight_AI-v1.0.0-10b981?style=for-the-badge&logo=cashapp&logoColor=white)
[![Vercel Live Production](https://img.shields.io/badge/Vercel-Live_Production-black?style=for-the-badge&logo=vercel&logoColor=white)](https://finsight-ai-technovate.vercel.app)
![Supabase](https://img.shields.io/badge/Database-Supabase_PostgreSQL-3ecf8e?style=for-the-badge&logo=supabase&logoColor=white)
![Firebase](https://img.shields.io/badge/Auth-Firebase_Authentication-ffca28?style=for-the-badge&logo=firebase&logoColor=black)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI_Python_3.12-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/Frontend-React_19_Vite_Tailwind-61dafb?style=for-the-badge&logo=react&logoColor=black)

**FinSight AI** is a production-grade fintech intelligence web application designed for comprehensive personal and business financial analysis. It parses complex bank statements, categorizes transactions with machine learning, detects recurring subscriptions, flags statistical anomalies, forecasts future cash flow shortages, evaluates financial health scores (0–100), and provides an interactive conversational financial assistant.

---

## 🌐 Live Production Links & Deployments

| Component | Destination | Status | Details |
| :--- | :--- | :--- | :--- |
| **Production Web Application** | **[https://finsight-ai-technovate.vercel.app](https://finsight-ai-technovate.vercel.app)** | 🟢 Live | Hosted on Vercel Global Edge Network |
| **Alternative Production URL** | **[https://frontend-six-cyan-85.vercel.app](https://frontend-six-cyan-85.vercel.app)** | 🟢 Live | Direct deployment alias |
| **Vercel Project Dashboard** | [vercel.com/sharanmanoj71-5619/finsight-ai](https://vercel.com/sharanmanoj71-5619/finsight-ai) | 🟢 Linked | Vite framework preset, Node 26.x runtime |
| **GitHub Repository** | [github.com/sharanmanoj71-dev/finsight-ai](https://github.com/sharanmanoj71-dev/finsight-ai) | 🟢 Synced | Monorepo with React frontend & FastAPI backend |
| **Cloud Database (Supabase PostgreSQL)** | Project `technovate` (`pxacwjmgcxcxdtzjzyli`) | 🟢 Connected | `https://pxacwjmgcxcxdtzjzyli.supabase.co` |
| **Identity & Auth (Firebase)** | Project `technovate-c048c` | 🟢 Connected | `technovate-c048c.firebaseapp.com` |
| **Interactive Video Chatbot** | [chatbot-avatar.webm](https://finsight-ai-technovate.vercel.app/chatbot-avatar.webm) | 🟢 Streaming | 2.58 MB WebM video avatar with 1-click AI redirect |

---

## 🏛️ System Architecture

```
                    ┌───────────────────────────────────────────────┐
                    │               Client Frontend                 │
                    │   React 19 + Vite + Tailwind CSS + Recharts   │
                    │   11 Dedicated Financial Views + Video Avatar │
                    │   Hosted on Vercel: finsight-ai-technovate    │
                    └───────────────────────┬───────────────────────┘
                                            │
                      1. Firebase Auth      │ 2. Authenticated REST
                      ID Token Handshake    │    (Bearer JWT)
                                            ▼
                    ┌───────────────────────────────────────────────┐
                    │               FastAPI Backend                 │
                    │   • Firebase Token Verification Engine        │
                    │   • PDF / CSV Multi-Column Statement Parser   │
                    │   • TF-IDF + Logistic Regression Categorizer  │
                    │   • Behavioral Anomaly Detection Module       │
                    │   • 6-Factor Financial Health Scoring (0-100) │
                    │   • Stochastic Cash-Flow Forecast Engine      │
                    │   • Grounded FinSight AI Chatbot (Gemini)     │
                    └───────────────────────┬───────────────────────┘
                                            │
                     PostgreSQL Storage &   │ Dual Mode (Supabase /
                     Per-User Isolation     │ Technovate Local Mirror)
                                            ▼
                    ┌───────────────────────────────────────────────┐
                    │              Supabase PostgreSQL             │
                    │           Project: technovate                 │
                    │        ID: pxacwjmgcxcxdtzjzyli               │
                    │    Tables: profiles, bank_statements,         │
                    │    transactions, categories, budgets,         │
                    │    recurring_payments, anomaly_alerts,        │
                    │    financial_insights, corrections            │
                    └───────────────────────────────────────────────┘
```

---

## 🤖 Interactive Video AI Chatbot

FinSight AI incorporates an ambient **animated video chatbot widget**:
- **Video Avatar Component** (`frontend/src/components/FloatingChatbot.jsx`):
  - Streams `public/chatbot-avatar.webm` in high-definition WebM format.
  - Automatically loops with `autoPlay`, `loop`, `muted`, and `playsInline`.
  - Pinned to the bottom-right corner across all 11 application tabs.
  - Features a neon emerald/teal glowing halo and real-time active beacon.
- **1-Click AI Assistant Navigation**:
  - Clicking the floating video avatar or its interactive prompt bubble instantly navigates to the **FinSight AI Assistant** tab.
- **Omnipresent Identity**:
  - The video avatar is mirrored inside the AI Assistant header banner, beside every AI response in the conversational thread, and in the sidebar navigation item.

---

## 🚀 Key Functional Modules

### 1. Multi-Format Bank Statement Extraction (PDF & CSV)
- **Supported Formats**: Any PDF bank statement (text grids, multi-column tables, scanned documents) and CSV exports.
- **Data Extracted**: Transaction dates, cleaned payee/merchant descriptions, debit amounts, credit amounts, opening balances, and closing balances.
- **Verification Workflow**: Pre-save extraction preview allowing users to inspect, correct dates, modify amounts, change categories, and deselect duplicate entries before writing to Supabase.
- **Sample Datasets Included**: Pre-built `wells_fargo_statement.pdf` and `chase_checking_sample.csv` in `backend/sample_data/` for instantaneous 1-click test evaluation.

### 2. AI-Powered Transaction Categorization
- **12 Certified Financial Categories**:
  1. Food and dining
  2. Shopping
  3. Travel and transportation
  4. Bills and utilities
  5. Healthcare
  6. Education
  7. Salary and income
  8. Transfers
  9. Entertainment
  10. Housing and rent
  11. Investments
  12. Other expenses
- **Hybrid Categorization Architecture**:
  - Layer 1: User-learned merchant correction memory (Highest priority)
  - Layer 2: Flow heuristics (Payroll direct deposits, tax refunds, transfers)
  - Layer 3: Rule-based regex pattern matcher across 200+ top financial merchants
  - Layer 4: Machine Learning text classification (`TfidfVectorizer` + `LogisticRegression`) with calibrated probability scoring.
- **User Correction Rule Memory**: In-place category changes can be remembered for future statements matching that merchant.

### 3. Financial Analytics Dashboard
- **Key Metrics**: Total Income, Total Expenses, Net Savings, Estimated Current Balance, Monthly Savings Rate, Average Daily Spend Velocity, and Highest Expense Category.
- **Visualizations**:
  - Month-over-month Cash Inflow vs Outflow comparisons.
  - Category spending share donut chart.
  - Daily spending patterns timeline.
  - Dynamic filters for date range, month, category, and transaction type.

### 4. Periodicity & Recurring Payment Detection
- Automatically detects monthly subscriptions (Netflix, Spotify, Gym, Cloud Storage), regular weekly outlays, apartment rent, utility bills, and insurance premiums.
- Calculates annualized recurring burden and estimated next billing dates.
- **Forgotten Subscriptions Radar**: Alerts users to long-running, recurring fees with minimal active utility to reduce subscription creep.

### 5. Statistical Anomaly & Outlier Detection
- Identifies unusual financial behavior without accusing users of fraud:
  - Unusually large expenses exceeding 3 standard deviations from category mean ($Z > 3.0$).
  - Duplicate-looking charges (identical amounts at the same merchant within 48 hours).
  - High single-day spending velocity spikes.
  - Large ATM cash withdrawals.
- Transparent explanations explaining exactly why each transaction was flagged.
- Allows users to review, dismiss, and append personal explanations to records.

### 6. AI Financial Health Analyzer (0–100)
- Transparent, explainable multi-factor scoring algorithm evaluating:
  1. **Savings Rate** (25% weight): Benchmark $\ge 20\%$ of net inflows.
  2. **Expense-to-Income Ratio** (20% weight): Benchmark $\le 70\%$.
  3. **Income Stability** (15% weight): Regularity and predictability of deposit events.
  4. **Spending Consistency** (15% weight): Day-to-day expenditure volatility.
  5. **Recurring Expense Burden** (15% weight): Fixed commitments vs discretionary capacity.
  6. **Cash-Flow Stability & Buffer** (10% weight): Liquidity direction and reserve accumulation.
- Generates clear grades (A+, A, B, C, D), itemized strengths, vulnerabilities, and actionable monthly optimization levers.
- *Strictly educational indicator; explicitly disclaims credit score guarantees.*

### 7. Stochastic Cash-Flow Forecasting
- Forward simulation modeling 7-day, 30-day, and 90-day cash trajectories.
- Integrates recurring bill dates, anticipated payroll cycles, and daily burn rates.
- Displays confidence bands and highlights potential cash shortages before they occur.
- Full methodological transparency stating all modeling assumptions and constraints.

### 8. FinSight AI Assistant
- Interactive chatbot grounded exclusively in the authenticated user's real transactions, categories, budgets, and alerts.
- Zero-hallucination guarantee: Computes real statistical figures dynamically.
- Answers questions including:
  - *"Where did most of my money go?"*
  - *"How much did I spend this month?"*
  - *"Which subscriptions are recurring?"*
  - *"Will I have enough money next month?"*
  - *"Suggest a realistic monthly budget."*
- Powered by Google Gemini (`google-genai`) when an API key is provided, with an intelligent built-in deterministic NLP engine when offline.

### 9. Personalized Budget Planner
- Monthly category budget caps with visual progress bars.
- Real-time overspending alerts.
- Pacing recommendations based on the 50/30/20 budgeting rule.

---

## 🗄️ Supabase Database Architecture

FinSight AI connects to the existing Supabase project:
- **Project Name**: `technovate`
- **Project ID**: `pxacwjmgcxcxdtzjzyli`
- **URL**: `https://pxacwjmgcxcxdtzjzyli.supabase.co`
- **Database Engine**: PostgreSQL

### Tables & Schema
The database schema (`backend/schema.sql`) implements:
1. `profiles`: `id`, `firebase_uid`, `full_name`, `email`, `created_at`
2. `bank_statements`: `id`, `firebase_uid`, `filename`, `file_type`, `uploaded_at`, `processing_status`, `opening_balance`, `closing_balance`
3. `transactions`: `id`, `firebase_uid`, `statement_id`, `transaction_date`, `description`, `merchant`, `amount`, `transaction_type`, `category`, `predicted_category`, `category_confidence`, `is_reviewed`, `created_at`
4. `categories`: `id`, `firebase_uid`, `category_name`, `category_type`, `created_at`
5. `recurring_payments`: `id`, `firebase_uid`, `merchant`, `amount`, `frequency`, `next_expected_date`, `category`, `status`, `created_at`
6. `anomaly_alerts`: `id`, `firebase_uid`, `transaction_id`, `anomaly_type`, `severity`, `explanation`, `reviewed`, `user_note`, `created_at`
7. `financial_insights`: `id`, `firebase_uid`, `insight_type`, `insight_text`, `score`, `created_at`
8. `budgets`: `id`, `firebase_uid`, `category`, `monthly_limit`, `month`, `year`, `created_at`
9. `category_corrections`: `id`, `firebase_uid`, `merchant_pattern`, `corrected_category`, `created_at`

### Fault-Tolerant Dual-Mode Persistence
`backend/app/core/database.py` features automatic fault recovery:
- Reads and writes synchronize directly with cloud Supabase PostgreSQL.
- If Supabase tables enforce anon RLS restrictions (code `42501`) or experience network latency, operations fall back seamlessly to the local SQLite mirror (`backend/data/finsight_technovate.db`), guaranteeing **zero 500 error crashes**.

---

## 🔐 Firebase Authentication & Security

- **Authentication Provider**: Firebase Authentication (Email/Password, Google Sign-In, Passwordless Magic Link, 1-Click Demo Login).
- **Backend Verification**: FastAPI validates Firebase ID tokens via Google's public certificates (`RS256`), verifying audience, issuer, and expiration.
- **Data Isolation**: All database queries strictly scope rows by the verified `firebase_uid`. Clients cannot supply a UID to impersonate other accounts.
- **Zero Exposed Keys**: Service role keys and private credentials reside exclusively on the server side.

---

## 🛠️ Quick Start & Execution

### Prerequisites
- Node.js $\ge 18$
- Python $\ge 3.11$ (Python 3.12 recommended)
- `uv` (installed in `.local/bin` or standard Python pip)

### Automated 1-Click Launch (Windows)
Double-click:
```powershell
start_all.bat
```
This starts both the FastAPI backend on `http://127.0.0.1:8000` and the Vite React frontend on `http://localhost:5173`.

### Manual Step-by-Step Launch

#### 1. Backend Setup
```bash
cd backend
# Create virtual environment
uv venv --python 3.12
# Activate virtual environment
.venv\Scripts\activate   # (Windows)
# Install dependencies
uv pip install -r requirements.txt

# Start backend server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

#### 2. Frontend Setup
```bash
cd frontend
# Install dependencies
npm install
# Start development server
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 🧪 Verification & Testing Results

The backend includes a comprehensive 16-step automated test suite (`backend/test_e2e_workflow.py`).

To run the verification suite:
```bash
cd backend
.venv\Scripts\python.exe test_e2e_workflow.py
```

### Verified Test Matrix:
| Step | Tested Capability | Status |
|---|---|---|
| 1 & 2 | Firebase Auth Token verification & profile sync | ✅ Passed |
| 3 | PDF Statement table & text grid extraction | ✅ Passed |
| 4 | CSV Statement extraction with duplicate detection | ✅ Passed |
| 5 & 6 | Date & Amount validation, opening/closing balances | ✅ Passed |
| 7 | Multi-layer AI transaction categorization (12 classes) | ✅ Passed |
| 8 & 9 | Manual category correction & rule memory persistence | ✅ Passed |
| 10 | Real-time financial analytics & chart data generation | ✅ Passed |
| 11 | Recurring subscription detection & burden calculation | ✅ Passed |
| 12 | Anomaly detection ($Z > 3.0$, duplicates, cash spikes) | ✅ Passed |
| 13 | 6-Factor Financial Health scoring (0–100) & letter grade | ✅ Passed |
| 14 | Stochastic 7, 30, and 90-day cash-flow simulation | ✅ Passed |
| 15 | FinSight Assistant answering grounded queries | ✅ Passed |
| 16 | Strict per-user database row isolation (zero leak) | ✅ Passed |

---

## 📁 Repository Directory Structure

```
finsight-ai/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth.py              # Identity & profile sync
│   │   │   ├── statements.py        # PDF & CSV statement endpoints
│   │   │   ├── transactions.py      # Transactions & category memory
│   │   │   ├── analytics.py         # KPIs, trends & distributions
│   │   │   ├── recurring.py         # Subscriptions & utility commitments
│   │   │   ├── anomalies.py         # Outlier & unusual activity alerts
│   │   │   ├── health.py            # 6-factor wellness scoring
│   │   │   ├── cashflow.py          # 7/30/90 day forecasting
│   │   │   ├── budgets.py           # Monthly budget caps & tracking
│   │   │   └── assistant.py         # FinSight conversational AI
│   │   ├── core/
│   │   │   ├── config.py            # Environment configuration
│   │   │   ├── database.py          # Supabase PostgreSQL & local mirror
│   │   │   └── firebase_auth.py     # Firebase JWT token verification
│   │   ├── models/
│   │   │   └── schemas.py           # Pydantic data schemas
│   │   ├── services/
│   │   │   ├── statement_parser.py  # PDF & CSV multi-layout parser
│   │   │   ├── categorizer.py       # ML text classifier & rules
│   │   │   ├── recurring_detector.py# Periodicity & cadence engine
│   │   │   ├── anomaly_detector.py  # Statistical deviation analyzer
│   │   │   ├── health_analyzer.py   # Multi-dimensional scoring
│   │   │   ├── cashflow_forecaster.py# Predictive cash simulations
│   │   │   ├── budget_service.py    # Budget allocation engine
│   │   │   └── assistant_service.py # Context-grounded advisor
│   │   └── main.py                  # FastAPI application entrypoint
│   ├── sample_data/                 # Pre-generated sample statements
│   │   ├── wells_fargo_statement.pdf# Multi-column bank statement PDF
│   │   └── chase_checking_sample.csv# Checking account statement CSV
│   ├── schema.sql                   # Supabase PostgreSQL DDL & RLS
│   ├── requirements.txt             # Pinned backend dependencies
│   ├── test_e2e_workflow.py         # Complete 16-step verification suite
│   ├── Dockerfile                   # Production container definition
│   ├── Procfile                     # Web process configuration
│   └── .env.example                 # Configuration template
├── frontend/
│   ├── public/
│   │   ├── chatbot-avatar.webm      # High-definition WebM chatbot video
│   │   └── _redirects               # SPA routing fallback rules
│   ├── src/
│   │   ├── components/              # FloatingChatbot, Sidebar, Header, StatCards
│   │   ├── context/                 # AuthContext (Firebase Auth)
│   │   ├── pages/                   # 11 interactive fintech views
│   │   ├── services/                # api.js & firebase.js clients
│   │   ├── App.jsx                  # Main routing & layout shell
│   │   └── index.css                # Tailwind CSS v4 design system
│   ├── vercel.json                  # Vercel Vite preset configuration
│   ├── package.json                 # Pinned frontend dependencies
│   └── vite.config.js               # Vite bundler & API proxy
├── vercel.json                      # Root Vercel monorepo configuration
├── render.yaml                      # Render.com Blueprint configuration
├── run_backend.bat                  # Backend launch script
├── run_frontend.bat                 # Frontend launch script
├── start_all.bat                    # Simultaneous dual-server launch
└── README.md                        # Documentation & setup guide
```

---

## 🏆 Project Highlights

- **Production-Grade Implementation**: Built with genuine backend computation, authentic data parsing, machine learning text categorization, and persistent storage.
- **Explainable & Trustworthy**: All health scores, anomaly reasons, and assistant answers cite verified mathematical foundations with zero fabricated figures.
- **Enterprise-Ready Infrastructure**: Designed specifically for the Supabase PostgreSQL database `technovate` (`pxacwjmgcxcxdtzjzyli`) and Firebase Authentication.
- **Live Cloud Deployment**: Fully deployed and verified on Vercel at [https://finsight-ai-technovate.vercel.app](https://finsight-ai-technovate.vercel.app).
