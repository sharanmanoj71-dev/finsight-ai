import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import TransactionModal from "./components/TransactionModal";
import FloatingChatbot from "./components/FloatingChatbot";

// Pages
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import UploadStatementPage from "./pages/UploadStatementPage";
import TransactionsPage from "./pages/TransactionsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import RecurringPaymentsPage from "./pages/RecurringPaymentsPage";
import AnomalyDetectionPage from "./pages/AnomalyDetectionPage";
import FinancialHealthPage from "./pages/FinancialHealthPage";
import CashFlowPredictionPage from "./pages/CashFlowPredictionPage";
import BudgetPlannerPage from "./pages/BudgetPlannerPage";
import AIAssistantPage from "./pages/AIAssistantPage";
import SettingsPage from "./pages/SettingsPage";

function AppContent() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-400 font-medium">Initializing FinSight AI...</p>
        </div>
      </div>
    );
  }

  // If user is not logged in, render LoginPage
  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="flex h-screen bg-[#070b14] text-slate-100 overflow-hidden font-sans">
      {/* 11-Tab Navigation Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          activeTab={activeTab}
          onUploadClick={() => setActiveTab("upload")}
          onNewTransactionClick={() => setIsModalOpen(true)}
        />

        <main className="flex-1 overflow-y-auto">
          {activeTab === "overview" && <DashboardPage setActiveTab={setActiveTab} />}
          {activeTab === "upload" && <UploadStatementPage onImportSuccess={() => setActiveTab("overview")} />}
          {activeTab === "transactions" && <TransactionsPage />}
          {activeTab === "analytics" && <AnalyticsPage />}
          {activeTab === "recurring" && <RecurringPaymentsPage />}
          {activeTab === "anomalies" && <AnomalyDetectionPage />}
          {activeTab === "health" && <FinancialHealthPage />}
          {activeTab === "cashflow" && <CashFlowPredictionPage />}
          {activeTab === "budgets" && <BudgetPlannerPage />}
          {activeTab === "assistant" && <AIAssistantPage />}
          {activeTab === "settings" && <SettingsPage />}
        </main>
      </div>

      {/* Global Manual Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          // If on transactions or overview, trigger reload
        }}
      />

      {/* Floating Video AI Chatbot Trigger (Click redirects to AI Assistant) */}
      <FloatingChatbot
        activeTab={activeTab}
        onOpenAssistant={() => setActiveTab("assistant")}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
