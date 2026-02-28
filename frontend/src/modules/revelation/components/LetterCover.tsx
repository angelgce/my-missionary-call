import { useState } from 'react';

interface LetterCoverProps {
  onReveal: () => void;
  children: React.ReactNode;
}

function LetterCover({ onReveal, children }: LetterCoverProps) {
  // Local state
  const [isOpening, setIsOpening] = useState(false);
  const [isFullyOpen, setIsFullyOpen] = useState(false);

  // Event handlers
  const handleClick = () => {
    if (isOpening || isFullyOpen) return;
    setIsOpening(true);

    setTimeout(() => {
      setIsFullyOpen(true);
      onReveal();
    }, 1000);
  };

  // Main render
  if (isFullyOpen) {
    return (
      <div className="cover-content-reveal" style={{ opacity: 0 }}>
        {children}
      </div>
    );
  }

  return (
    <div
      className="relative mx-auto flex w-full max-w-2xl cursor-pointer items-center justify-center"
      style={{ minHeight: '70vh', perspective: '1200px' }}
      onClick={handleClick}
    >
      {/* Left door */}
      <div
        className={`absolute inset-y-0 left-0 w-1/2 overflow-hidden ${
          isOpening ? 'cover-left-open' : ''
        }`}
        style={{
          transformOrigin: 'left center',
          backfaceVisibility: 'hidden',
          borderTopLeftRadius: '1rem',
          borderBottomLeftRadius: '1rem',
          background: 'linear-gradient(135deg, #FFF8FA 0%, #FAE5ED 50%, #F3D4DE 100%)',
          boxShadow: '2px 0 12px rgba(59,33,64,0.08)',
        }}
      >
        {/* Subtle texture */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(201,168,76,0.8) 0.5px, transparent 0)',
            backgroundSize: '20px 20px',
          }}
        />
        {/* Gold corner accents - top left */}
        <svg className="absolute left-3 top-3 opacity-30" width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M0 0L20 0" stroke="#C9A84C" strokeWidth="0.8" />
          <path d="M0 0L0 20" stroke="#C9A84C" strokeWidth="0.8" />
          <circle cx="0" cy="0" r="1.5" fill="#C9A84C" />
        </svg>
        {/* Gold corner accents - bottom left */}
        <svg className="absolute bottom-3 left-3 opacity-30" width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M0 24L20 24" stroke="#C9A84C" strokeWidth="0.8" />
          <path d="M0 24L0 4" stroke="#C9A84C" strokeWidth="0.8" />
          <circle cx="0" cy="24" r="1.5" fill="#C9A84C" />
        </svg>
      </div>

      {/* Right door */}
      <div
        className={`absolute inset-y-0 right-0 w-1/2 overflow-hidden ${
          isOpening ? 'cover-right-open' : ''
        }`}
        style={{
          transformOrigin: 'right center',
          backfaceVisibility: 'hidden',
          borderTopRightRadius: '1rem',
          borderBottomRightRadius: '1rem',
          background: 'linear-gradient(225deg, #FFF8FA 0%, #FAE5ED 50%, #F3D4DE 100%)',
          boxShadow: '-2px 0 12px rgba(59,33,64,0.08)',
        }}
      >
        {/* Subtle texture */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(201,168,76,0.8) 0.5px, transparent 0)',
            backgroundSize: '20px 20px',
          }}
        />
        {/* Gold corner accents - top right */}
        <svg className="absolute right-3 top-3 opacity-30" width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M24 0L4 0" stroke="#C9A84C" strokeWidth="0.8" />
          <path d="M24 0L24 20" stroke="#C9A84C" strokeWidth="0.8" />
          <circle cx="24" cy="0" r="1.5" fill="#C9A84C" />
        </svg>
        {/* Gold corner accents - bottom right */}
        <svg className="absolute bottom-3 right-3 opacity-30" width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M24 24L4 24" stroke="#C9A84C" strokeWidth="0.8" />
          <path d="M24 24L24 4" stroke="#C9A84C" strokeWidth="0.8" />
          <circle cx="24" cy="24" r="1.5" fill="#C9A84C" />
        </svg>
      </div>

      {/* Center content (only visible before opening) */}
      {!isOpening && (
        <div className="relative z-10 flex flex-col items-center justify-center animate-cover-breathe">
          {/* Glow ring behind seal */}
          <div
            className="absolute top-0 h-28 w-28 rounded-full tablet:h-32 tablet:w-32"
            style={{
              background: 'radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%)',
              animation: 'coverSealGlow 3s ease-in-out infinite',
            }}
          />

          {/* Seal / emblem */}
          <div
            className="relative mb-5 flex h-20 w-20 items-center justify-center rounded-full tablet:h-24 tablet:w-24"
            style={{
              background: 'rgba(201,168,76,0.06)',
              boxShadow: '0 0 0 1px rgba(201,168,76,0.2), 0 0 0 6px rgba(201,168,76,0.05), 0 8px 32px rgba(201,168,76,0.12)',
            }}
          >
            {/* Inner ring */}
            <div
              className="absolute inset-[4px] rounded-full"
              style={{ border: '1px dashed rgba(201,168,76,0.2)' }}
            />
            <svg
              className="h-9 w-9 text-gold tablet:h-11 tablet:w-11"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
              />
            </svg>
          </div>

          <p className="font-serif text-xl font-bold text-navy tablet:text-3xl">
            Tu Llamamiento
          </p>

          <p className="mt-2 text-sm text-slate/50">
            Toca para abrir la carta
          </p>

        </div>
      )}

      <style>{`
        @keyframes coverSealGlow {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default LetterCover;
