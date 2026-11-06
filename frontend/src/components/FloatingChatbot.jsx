import React, { useState } from "react";
import { Sparkles, MessageSquare, X, ArrowRight } from "lucide-react";

export default function FloatingChatbot({ activeTab, onOpenAssistant }) {
  const [showBubble, setShowBubble] = useState(true);
  const isAlreadyOnAssistant = activeTab === "assistant";

  const handleClick = () => {
    onOpenAssistant();
  };

  return (
    <aside 
      aria-label="AI Assistant Chatbot"
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-auto select-none"
    >
      {/* Interactive Speech Bubble Prompt */}
      {showBubble && !isAlreadyOnAssistant && (
        <div className="relative mb-3 max-w-[260px] animate-fade-in group">
          <div 
            onClick={handleClick}
            className="cursor-pointer glass-card bg-[#0d1527]/95 hover:bg-[#121c33] border border-emerald-500/30 hover:border-emerald-400/60 p-3.5 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-all duration-300 transform hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80 mb-2">
              <div className="flex items-center space-x-1.5">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[11px] font-bold text-white tracking-wide flex items-center gap-1">
                  FinSight AI
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                </span>
              </div>
              <button
                type="button"
                aria-label="Dismiss chat bubble"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowBubble(false);
                }}
                className="text-slate-400 hover:text-slate-200 p-0.5 rounded transition-colors"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <p className="text-xs text-slate-300 leading-relaxed font-normal">
              Have questions about your statement or cash flow?
            </p>
            
            <div className="mt-2.5 flex items-center justify-between text-[11px] font-semibold text-emerald-400 group-hover:text-emerald-300 transition-colors">
              <span>Ask AI Assistant</span>
              <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Speech Bubble Arrow Tail */}
          <div className="absolute -bottom-1.5 right-7 w-3 h-3 bg-[#0d1527] border-r border-b border-emerald-500/30 transform rotate-45"></div>
        </div>
      )}

      {/* Video Chatbot Avatar Trigger Button */}
      <button
        onClick={handleClick}
        title={isAlreadyOnAssistant ? "You are chatting with FinSight AI" : "Click to chat with FinSight AI Assistant"}
        className={`relative group rounded-full p-0.5 focus:outline-none transition-all duration-300 transform hover:scale-105 active:scale-95 ${
          isAlreadyOnAssistant
            ? "ring-4 ring-emerald-500/70 shadow-[0_0_30px_rgba(16,185,129,0.5)]"
            : "ring-2 ring-emerald-400/80 hover:ring-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.4)] hover:shadow-[0_0_35px_rgba(16,185,129,0.6)]"
        }`}
      >
        {/* Animated Glow Halo */}
        <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 opacity-60 group-hover:opacity-100 blur-sm transition-opacity duration-300 animate-pulse"></span>

        {/* Video Container */}
        <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-full overflow-hidden bg-slate-950 border-2 border-emerald-400/60 shadow-inner flex items-center justify-center">
          <video
            src="/chatbot-avatar.webm"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="w-full h-full object-cover scale-110 pointer-events-none"
          />
        </div>

        {/* Online Status Beacon */}
        <span className="absolute bottom-0.5 right-0.5 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-slate-950"></span>
        </span>

        {/* Mini AI Badge */}
        <span className="absolute -top-1 -right-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded-full border border-slate-900 shadow-md">
          AI
        </span>
      </button>
    </aside>
  );
}
