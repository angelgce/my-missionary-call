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
      style={{ minHeight: '70vh' }}
      onClick={handleClick}
    >
      {/* Left door */}
      <div
        className={`absolute inset-y-0 left-0 w-1/2 border border-rose-soft bg-cream ${
          isOpening ? 'cover-left-open' : ''
        }`}
        style={{
          transformOrigin: 'left center',
          backfaceVisibility: 'hidden',
          borderTopLeftRadius: '1rem',
          borderBottomLeftRadius: '1rem',
        }}
      >
        <div className="flex h-full items-center justify-end pr-2">
          <div className="h-3/4 w-px bg-rose-soft" />
        </div>
      </div>

      {/* Right door */}
      <div
        className={`absolute inset-y-0 right-0 w-1/2 border border-rose-soft bg-cream ${
          isOpening ? 'cover-right-open' : ''
        }`}
        style={{
          transformOrigin: 'right center',
          backfaceVisibility: 'hidden',
          borderTopRightRadius: '1rem',
          borderBottomRightRadius: '1rem',
        }}
      >
        <div className="flex h-full items-center justify-start pl-2">
          <div className="h-3/4 w-px bg-rose-soft" />
        </div>
      </div>

      {/* Center content (only visible before opening) */}
      {!isOpening && (
        <div className="relative z-10 flex flex-col items-center justify-center animate-cover-breathe">
          {/* Seal / emblem */}
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-gold/40 bg-white/80 tablet:h-24 tablet:w-24">
            <svg
              className="h-10 w-10 text-gold tablet:h-12 tablet:w-12"
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
          <p className="mt-3 text-sm text-slate/60">
            Toca para abrir la carta
          </p>

          {/* Shimmer hint */}
          <div
            className="mt-5 h-0.5 w-28 rounded-full"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(212, 132, 155, 0.6), transparent)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 2s infinite',
            }}
          />
        </div>
      )}
    </div>
  );
}

export default LetterCover;
