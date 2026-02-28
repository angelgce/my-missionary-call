import { useState, useRef, useEffect } from 'react';

import {
  SparklesIcon,
  ArrowPathIcon,
  XMarkIcon,
  ForwardIcon,
  PaperAirplaneIcon,
  QuestionMarkCircleIcon,
  LockOpenIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

interface HintsChatModalProps {
  messages: ChatMessage[];
  hintCount: number;
  isLoading: boolean;
  isDone: boolean;
  onSendMessage: (text: string) => void;
  onReveal: () => void;
  onReset: () => void;
  onClose: () => void;
}

function HintsChatModal({
  messages,
  hintCount,
  isLoading,
  isDone,
  onSendMessage,
  onReveal,
  onReset,
  onClose,
}: HintsChatModalProps) {
  // Local state
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Effects
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (!isLoading && !isDone) {
      inputRef.current?.focus();
    }
  }, [isLoading, isDone]);

  // Event handlers
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading || isDone) return;
    onSendMessage(text);
    setInput('');
  };

  // Computed values
  const hintsRemaining = 3 - hintCount;

  // Render helpers
  const renderHintDots = () => (
    <div className="flex items-center gap-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="relative flex h-[18px] w-[18px] items-center justify-center">
          <div
            className="absolute inset-0 rounded-full transition-all duration-500"
            style={{
              background: i < hintCount ? '#D4849B' : 'rgba(59,33,64,0.08)',
              boxShadow: i < hintCount ? '0 2px 8px rgba(212,132,155,0.4)' : 'none',
            }}
          />
          {i < hintCount ? (
            <CheckIcon className="relative z-10 h-2.5 w-2.5 text-white" strokeWidth={3} />
          ) : (
            <span className="relative z-10 text-[8px] font-bold text-slate/40">{i + 1}</span>
          )}
        </div>
      ))}
      <span className="ml-0.5 text-[11px] font-medium text-slate/60">
        {hintsRemaining > 0
          ? `${hintsRemaining} restante${hintsRemaining > 1 ? 's' : ''}`
          : 'Listo'}
      </span>
    </div>
  );

  const renderThinkingIndicator = () => (
    <div className="flex items-end gap-2.5 chat-msg-in">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blush">
        <SparklesIcon className="h-4 w-4 text-gold-dark chat-sparkle-spin" />
      </div>
      <div className="rounded-2xl rounded-bl-sm bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="chat-thinking-bar" />
          <span className="text-[11px] font-medium text-slate/50">Pensando...</span>
        </div>
      </div>
    </div>
  );

  const renderMessage = (msg: ChatMessage, i: number) => {
    const isUser = msg.role === 'user';
    const isLast = i === messages.length - 1 && !isLoading;

    return (
      <div
        key={i}
        className={`flex items-end gap-2.5 chat-msg-in ${isUser ? 'flex-row-reverse' : ''}`}
        style={{ animationDelay: `${Math.min(i * 0.05, 0.3)}s` }}
      >
        {!isUser && (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blush">
            <SparklesIcon className="h-4 w-4 text-gold-dark" />
          </div>
        )}
        <div className={`relative max-w-[80%] ${isLast ? 'chat-last-msg' : ''}`}>
          <div
            className={`rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed shadow-sm ${
              isUser
                ? 'rounded-br-sm bg-navy text-cream'
                : 'rounded-bl-sm bg-white text-navy'
            }`}
          >
            {msg.content}
          </div>
          {isLast && (
            <div className="chat-msg-glow absolute inset-0 rounded-2xl pointer-events-none" />
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 chat-backdrop-in"
        style={{
          background: 'rgba(59, 33, 64, 0.4)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      />

      {/* Chat container */}
      <div
        className="relative z-10 flex w-full max-w-[400px] flex-col overflow-hidden rounded-[28px] chat-container-in"
        style={{
          background: '#F8E0E8',
          boxShadow: '0 25px 80px rgba(59,33,64,0.2), 0 0 0 1px rgba(255,255,255,0.1)',
          maxHeight: '80vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-5 pb-3.5 pt-5">
          {/* Top row: title + actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="chat-icon-breathe flex h-10 w-10 items-center justify-center rounded-2xl bg-white/50">
                <SparklesIcon className="h-5 w-5 text-gold-dark" />
              </div>
              <div>
                <h2 className="font-serif text-[15px] font-semibold text-navy">
                  Pistas del Llamamiento
                </h2>
                <div className="mt-1.5">{renderHintDots()}</div>
              </div>
            </div>

            <div className="flex items-center">
              {!isDone && (
                <button
                  onClick={onReveal}
                  className="mr-0.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-gold-dark/70 transition-all hover:bg-white/40 active:scale-95"
                >
                  <ForwardIcon className="inline h-3 w-3 mr-0.5" />
                  Saltar
                </button>
              )}
              <button
                onClick={onReset}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-navy/30 transition-all hover:bg-white/40 hover:text-navy/60 active:scale-95"
              >
                <ArrowPathIcon className="h-4 w-4" />
              </button>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-navy/30 transition-all hover:bg-white/40 hover:text-navy/60 active:scale-95"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Messages area */}
        <div
          className="relative hide-scrollbar flex-1 overflow-y-auto rounded-t-[24px] bg-cream px-4 py-5"
          style={{ minHeight: '260px', maxHeight: '50vh' }}
        >
          {/* Subtle floral texture on messages bg */}
          <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.025]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="chatBgPattern" x="0" y="0" width="70" height="70" patternUnits="userSpaceOnUse">
                <g fill="#BE6B84" stroke="#BE6B84" strokeWidth="0.3">
                  <circle cx="35" cy="35" r="1.5" />
                  <ellipse cx="35" cy="30" rx="2" ry="3.5" />
                  <ellipse cx="39.7" cy="32.5" rx="2" ry="3.5" transform="rotate(72, 39.7, 32.5)" />
                  <ellipse cx="37.9" cy="37.8" rx="2" ry="3.5" transform="rotate(144, 37.9, 37.8)" />
                  <ellipse cx="32.1" cy="37.8" rx="2" ry="3.5" transform="rotate(216, 32.1, 37.8)" />
                  <ellipse cx="30.3" cy="32.5" rx="2" ry="3.5" transform="rotate(288, 30.3, 32.5)" />
                </g>
                <circle cx="12" cy="12" r="0.6" fill="#D4849B" opacity="0.5" />
                <circle cx="58" cy="55" r="0.5" fill="#D4849B" opacity="0.4" />
                <path d="M8,50 Q14,46 12,40" fill="none" stroke="#D4849B" strokeWidth="0.4" opacity="0.4" />
                <path d="M55,15 Q61,11 59,5" fill="none" stroke="#D4849B" strokeWidth="0.4" opacity="0.4" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#chatBgPattern)" />
          </svg>

          {messages.length === 0 && !isLoading && (
            <div className="flex h-full flex-col items-center justify-center py-10 text-center">
              <div className="chat-empty-icon mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-blush/70">
                <QuestionMarkCircleIcon className="h-8 w-8 text-gold" />
              </div>
              <p className="text-sm font-medium text-navy">
                Pregunta sobre tu llamamiento
              </p>
              <p className="mt-1 text-xs text-slate">
                Tienes 3 pistas disponibles
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {messages.map(renderMessage)}
            {isLoading && renderThinkingIndicator()}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input area */}
        <div className="bg-cream px-4 pb-5 pt-2 tablet:pb-4">
          {isDone ? (
            <button
              onClick={onReveal}
              className="chat-reveal-btn relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-navy py-4 text-sm font-semibold tracking-wide text-cream transition-all active:scale-[0.98]"
              style={{ boxShadow: '0 8px 30px rgba(59,33,64,0.25)' }}
            >
              <div className="chat-reveal-shimmer absolute inset-0 pointer-events-none" />
              <LockOpenIcon className="relative z-10 h-4 w-4" />
              <span className="relative z-10">Revelar mi Llamamiento</span>
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <div className="flex flex-1 items-center overflow-hidden rounded-2xl bg-white shadow-sm transition-all focus-within:shadow-md">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Pregunta sobre tu misión..."
                  disabled={isLoading}
                  className="flex-1 border-none bg-transparent px-4 py-3 text-[13px] text-navy outline-none placeholder:text-slate/40"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-sm transition-all active:scale-95 disabled:opacity-30 ${
                  input.trim()
                    ? 'bg-navy text-cream'
                    : 'bg-white text-rose-soft'
                }`}
              >
                <PaperAirplaneIcon className="h-4 w-4" />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Animations */}
      <style>{`
        .chat-thinking-bar {
          width: 52px;
          height: 4px;
          border-radius: 4px;
          background: rgba(212,132,155,0.15);
          position: relative;
          overflow: hidden;
        }
        .chat-thinking-bar::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 4px;
          background: linear-gradient(90deg, transparent, #D4849B, #BE6B84, #D4849B, transparent);
          animation: chatThinkShimmer 1.8s ease-in-out infinite;
        }
        @keyframes chatThinkShimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .chat-sparkle-spin {
          animation: chatSparkSpin 2s linear infinite;
        }
        @keyframes chatSparkSpin {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.1); }
          100% { transform: rotate(360deg) scale(1); }
        }

        .chat-icon-breathe {
          animation: chatBreath 3s ease-in-out infinite;
        }
        @keyframes chatBreath {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        .chat-empty-icon {
          animation: chatFloat 3s ease-in-out infinite;
        }
        @keyframes chatFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }

        .chat-reveal-btn {
          animation: chatRevealGlow 2s ease-in-out infinite;
        }
        @keyframes chatRevealGlow {
          0%, 100% { box-shadow: 0 8px 30px rgba(59,33,64,0.25); }
          50% { box-shadow: 0 8px 40px rgba(59,33,64,0.35), 0 0 50px rgba(212,132,155,0.15); }
        }
        .chat-reveal-shimmer {
          background: linear-gradient(105deg, transparent 40%, rgba(212,132,155,0.25) 50%, transparent 60%);
          background-size: 250% 100%;
          animation: chatRevealShimmer 2.5s ease-in-out infinite;
        }
        @keyframes chatRevealShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .chat-last-msg .chat-msg-glow {
          background: linear-gradient(120deg, transparent 30%, rgba(212,132,155,0.08) 50%, transparent 70%);
          background-size: 200% 100%;
          animation: chatGlow 3s ease-in-out infinite;
        }
        @keyframes chatGlow {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .chat-last-msg {
          filter: drop-shadow(0 2px 6px rgba(212,132,155,0.12));
        }

        @keyframes chatBackdropIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes chatContainerIn {
          from { opacity: 0; transform: scale(0.95) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes chatMsgIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .chat-backdrop-in {
          animation: chatBackdropIn 0.3s ease-out forwards;
        }
        .chat-container-in {
          animation: chatContainerIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .chat-msg-in {
          animation: chatMsgIn 0.3s ease-out both;
        }
      `}</style>
    </div>
  );
}

export default HintsChatModal;
