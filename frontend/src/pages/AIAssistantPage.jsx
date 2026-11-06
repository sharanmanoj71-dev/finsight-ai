import React, { useState, useRef, useEffect } from "react";
import {
  BotMessageSquare,
  Send,
  Sparkles,
  User,
  ShieldCheck,
  ChevronRight,
  Database,
  ArrowRight
} from "lucide-react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

const SUGGESTED_PROMPTS = [
  "Where did most of my money go?",
  "How much did I spend this month?",
  "What is my highest spending category?",
  "How much money did I save?",
  "Which subscriptions are recurring?",
  "Why was this transaction flagged?",
  "How can I reduce my monthly expenses?",
  "Will I have enough money next month?",
  "Compare my expenses with last month.",
  "Suggest a realistic monthly budget."
];

export default function AIAssistantPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hello ${user?.displayName || "there"}! I'm **FinSight Assistant**, your personal AI financial analyst.\n\nI have real-time access to your uploaded bank statements, recurring commitments, anomaly flags, and budget targets. Ask me anything about where your money went, your subscription burden, or cash flow forecasts!`
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const newMessages = [...messages, { role: "user", content: query }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      // Build history
      const history = newMessages.slice(-6).map((m) => ({ role: m.role, content: m.content }));
      const res = await api.assistant.chat(query, history);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.response,
          contextUsed: res.financial_context_used,
          followups: res.suggested_followups
        }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ Sorry, I encountered an issue analyzing your records: ${err.message}. Please verify your bank statements are uploaded.`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto h-[calc(100vh-4.5rem)] flex flex-col space-y-4">
      {/* Top Banner */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3.5">
          {/* Animated Video Chatbot Avatar */}
          <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-emerald-400/80 shadow-lg shadow-emerald-500/25 bg-slate-950 shrink-0">
            <video
              src="/chatbot-avatar.webm"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover scale-110 pointer-events-none"
            />
            <span className="absolute bottom-0 right-0 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-slate-950"></span>
            </span>
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
              FinSight Assistant
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                Grounded Financial AI
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">Contextually grounded in your authentic Supabase transaction records</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Zero Hallucination Guarantee</span>
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 glass-card rounded-2xl p-5 border border-slate-800 overflow-y-auto space-y-4">
        {messages.map((msg, index) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={index}
              className={`flex items-start space-x-3 ${isUser ? "flex-row-reverse space-x-reverse" : ""}`}
            >
              <div
                className={`w-8 h-8 rounded-full overflow-hidden shrink-0 ${
                  isUser
                    ? "bg-slate-700 text-white border border-slate-600 flex items-center justify-center"
                    : "border border-emerald-400/70 shadow-sm shadow-emerald-500/20 bg-slate-950"
                }`}
              >
                {isUser ? (
                  <User className="w-4 h-4" />
                ) : (
                  <video
                    src="/chatbot-avatar.webm"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover scale-110 pointer-events-none"
                  />
                )}
              </div>

              <div
                className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed ${
                  isUser
                    ? "bg-emerald-600 text-white rounded-tr-none shadow-md"
                    : "glass-card border border-slate-800 text-slate-200 rounded-tl-none space-y-2"
                }`}
              >
                <div className="whitespace-pre-wrap font-sans">
                  {msg.content}
                </div>

                {/* Grounded Context Badge */}
                {msg.contextUsed && Object.keys(msg.contextUsed).length > 0 && (
                  <div className="pt-2 mt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                    <span className="text-emerald-400 font-semibold">Context Bound:</span>
                    <span>Total Inflow: ${msg.contextUsed.total_income}</span>
                    <span>•</span>
                    <span>Total Outflow: ${msg.contextUsed.total_expense}</span>
                    <span>•</span>
                    <span>Top: {msg.contextUsed.top_category}</span>
                  </div>
                )}

                {/* Followups pills */}
                {msg.followups && msg.followups.length > 0 && (
                  <div className="pt-2 mt-2 border-t border-slate-800/80 flex flex-wrap gap-1.5">
                    {msg.followups.map((f, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(f)}
                        className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 transition-colors"
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center space-x-3 text-xs text-slate-400">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-emerald-400/70 shadow-sm shadow-emerald-500/20 bg-slate-950 shrink-0">
              <video
                src="/chatbot-avatar.webm"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover scale-110 pointer-events-none"
              />
            </div>
            <div className="glass-card rounded-2xl px-4 py-3 border border-slate-800 flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce"></div>
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]"></div>
              <span className="text-[11px] text-slate-400 ml-1">Analyzing statement records...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 shrink-0 scrollbar-none">
        {SUGGESTED_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSend(prompt)}
            className="text-[11px] whitespace-nowrap px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors shrink-0"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="glass-card rounded-2xl p-2 border border-slate-800 flex items-center space-x-2 shrink-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask FinSight (e.g. 'Where did most of my money go?' or 'Will I have enough next month?')..."
          className="flex-1 bg-transparent px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
