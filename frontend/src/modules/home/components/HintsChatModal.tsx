import { useState, useRef, useEffect } from 'react';

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
    <div className="flex items-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-2.5 w-2.5 rounded-full transition-all duration-300"
          style={{
            background: i < hintCount ? '#BF9B30' : 'rgba(191,155,48,0.25)',
          }}
        />
      ))}
      <span className="ml-1.5 text-xs" style={{ color: 'rgba(191,155,48,0.7)' }}>
        {hintsRemaining > 0 ? `${hintsRemaining} pista${hintsRemaining > 1 ? 's' : ''} restante${hintsRemaining > 1 ? 's' : ''}` : 'Pistas agotadas'}
      </span>
    </div>
  );

  const renderTypingIndicator = () => (
    <div className="flex items-start gap-2">
      <div
        className="rounded-2xl rounded-tl-sm px-4 py-3"
        style={{ background: '#f0e9dd' }}
      >
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-2 w-2 rounded-full"
              style={{
                background: '#BF9B30',
                animation: `typingDot 1.4s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 tablet:p-6"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background: 'rgba(59, 33, 64, 0.7)',
          backdropFilter: 'blur(4px)',
          animation: 'revealFadeIn 0.3s ease-out forwards',
        }}
      />

      {/* Chat container */}
      <div
        className="relative z-10 flex w-full max-w-md flex-col overflow-hidden rounded-2xl"
        style={{
          background: '#faf8f4',
          boxShadow: '0 25px 80px rgba(59, 33, 64, 0.35)',
          animation: 'revealFadeIn 0.4s ease-out forwards',
          maxHeight: '85vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ background: '#3B2140' }}
        >
          <div>
            <h2
              className="text-base font-bold tablet:text-lg"
              style={{ color: '#BF9B30' }}
            >
              Pistas de tu Llamamiento
            </h2>
            <div className="mt-1">{renderHintDots()}</div>
          </div>
          <div className="flex items-center gap-1">
            {!isDone && (
              <button
                onClick={onReveal}
                className="mr-1 rounded-lg px-3 py-1.5 text-xs font-semibold tracking-wide transition-opacity hover:opacity-90"
                style={{
                  background: 'rgba(191,155,48,0.2)',
                  color: '#BF9B30',
                  border: '1px solid rgba(191,155,48,0.3)',
                }}
                title="Saltar al llamamiento"
              >
                Skip
              </button>
            )}
            <button
              onClick={onReset}
              className="flex h-8 w-8 items-center justify-center rounded-full transition-colors"
              style={{ color: 'rgba(191,155,48,0.6)' }}
              title="Empezar de nuevo"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 4v6h6" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full transition-colors"
              style={{ color: 'rgba(191,155,48,0.6)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages area */}
        <div
          className="hide-scrollbar flex-1 overflow-y-auto px-4 py-4"
          style={{ minHeight: '250px', maxHeight: '55vh' }}
        >
          <div className="flex flex-col gap-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user' ? 'rounded-tr-sm' : 'rounded-tl-sm'
                  }`}
                  style={
                    msg.role === 'user'
                      ? { background: '#3B2140', color: '#faf8f4' }
                      : { background: '#f0e9dd', color: '#3B2140' }
                  }
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {isLoading && renderTypingIndicator()}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input area or reveal button */}
        <div
          className="border-t px-4 pb-5 pt-3 tablet:pb-3"
          style={{ borderColor: 'rgba(59, 33, 64, 0.08)' }}
        >
          {isDone ? (
            <button
              onClick={onReveal}
              className="w-full rounded-xl py-3 text-sm font-bold tracking-wide transition-transform active:scale-[0.98]"
              style={{
                background: '#BF9B30',
                color: '#faf8f4',
                boxShadow: '0 4px 16px rgba(191, 155, 48, 0.3)',
              }}
            >
              Revelar mi Llamamiento
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Pregunta sobre tu misión..."
                disabled={isLoading}
                className="flex-1 rounded-xl border-none px-4 py-2.5 text-sm outline-none"
                style={{
                  background: '#f0e9dd',
                  color: '#3B2140',
                }}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="flex h-10 w-10 items-center justify-center rounded-xl transition-opacity disabled:opacity-40"
                style={{ background: '#3B2140' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#BF9B30" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Typing animation keyframes */}
      <style>{`
        @keyframes typingDot {
          0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}

export default HintsChatModal;
