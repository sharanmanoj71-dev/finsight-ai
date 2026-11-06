# FinSight AI — Frontend Client

![Vercel Live Production](https://img.shields.io/badge/Vercel-Live_Production-black?style=for-the-badge&logo=vercel&logoColor=white)
![React 19](https://img.shields.io/badge/React-19.0.0-61dafb?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-8.3.6-646cff?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0.0-38bdf8?style=for-the-badge&logo=tailwindcss&logoColor=white)

The frontend client for **FinSight AI** is a responsive, dark-mode fintech intelligence dashboard built with React 19, Vite, Tailwind CSS v4, Lucide icons, and Recharts.

---

## 🌐 Live Production Deployment

- **Production URL**: [https://finsight-ai-technovate.vercel.app](https://finsight-ai-technovate.vercel.app)
- **Alternative URL**: [https://frontend-six-cyan-85.vercel.app](https://frontend-six-cyan-85.vercel.app)
- **Vercel Project**: [sharanmanoj71-5619/finsight-ai](https://vercel.com/sharanmanoj71-5619/finsight-ai)

---

## ✨ Features & Architecture

1. **11 Dedicated Financial Control Views**:
   - `DashboardPage`: High-level metrics, savings rate, spend velocity, donut & line charts.
   - `UploadStatementPage`: Drag-and-drop PDF & CSV parser with editable pre-save extraction grid.
   - `TransactionsPage`: Searchable transaction registry with category modification & rule memory.
   - `AnalyticsPage`: Inflow vs Outflow comparisons, category breakdowns, daily trends.
   - `RecurringPaymentsPage`: Active subscriptions, billing cadence, forgotten subscription alerts.
   - `AnomalyDetectionPage`: Statistical deviation outliers ($Z > 3.0$), duplicate charges, cash spikes.
   - `FinancialHealthPage`: Explainable 6-factor wellness score (0–100) and actionable monthly tips.
   - `CashFlowPredictionPage`: 7, 30, and 90-day trajectory curves with cash shortage alerts.
   - `BudgetPlannerPage`: Category spending limits, 50/30/20 budget allocations, pacing indicators.
   - `AIAssistantPage`: Contextually grounded AI assistant answering questions on actual statements.
   - `SettingsPage`: Supabase PostgreSQL & Firebase authentication status inspector.

2. **Interactive Video AI Chatbot (`FloatingChatbot.jsx`)**:
   - Persistent ambient video avatar (`/chatbot-avatar.webm`) streaming at the bottom-right of the screen.
   - 1-click instant navigation to the AI Assistant.

3. **Authentication**:
   - Firebase Authentication supporting Email/Password, Google Sign-In, and instant 1-Click Demo Login.

---

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Build for production:
```bash
npm run build
```
Production output is written to `dist/`.
