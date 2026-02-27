import { useState } from 'react';

interface EnvelopeAnimationProps {
  missionaryName: string;
  missionName: string;
  language: string;
  trainingCenter: string;
  entryDate: string;
  onClose: () => void;
}

function EnvelopeAnimation({
  missionaryName,
  missionName,
  language,
  trainingCenter,
  entryDate,
  onClose,
}: EnvelopeAnimationProps) {
  // Local state
  const [isOpen, setIsOpen] = useState(false);
  const [showLetter, setShowLetter] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Event handlers
  const handleOpenEnvelope = () => {
    setIsOpen(true);
    setTimeout(() => setShowLetter(true), 600);
    setTimeout(() => setShowDetails(true), 1200);
  };

  if (showLetter) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/80 p-4">
        <div
          className="relative mx-auto w-full max-w-lg rounded-2xl border border-rose-soft bg-white p-6 shadow-xl tablet:p-10"
          style={{
            animation: 'revealFadeIn 0.8s ease-out forwards',
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-slate/40 transition-colors hover:text-navy"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Letter header */}
          <div className="mb-4 text-center">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate/60">
              La Iglesia de Jesucristo de los Santos de los Últimos Días
            </p>
          </div>

          <div className="h-px bg-rose-soft" />

          {/* Letter content */}
          <div className="mt-4 space-y-3 text-slate">
            <p className="text-navy">
              Querida <span className="font-semibold">{missionaryName}</span>,
            </p>

            <p className="text-sm leading-relaxed">
              Usted ha sido llamada a servir como misionera en la
            </p>

            <div
              className="rounded-xl bg-cream py-4 text-center"
              style={{
                animation: showDetails ? 'revealFadeIn 0.6s ease-out forwards' : 'none',
                opacity: showDetails ? 1 : 0,
              }}
            >
              <p className="text-xs uppercase tracking-wider text-slate/60">Misión</p>
              <p className="mt-1 text-2xl font-bold text-navy">{missionName}</p>
            </div>

            <div
              className="flex justify-between gap-4"
              style={{
                animation: showDetails ? 'revealFadeIn 0.6s ease-out 0.3s forwards' : 'none',
                opacity: showDetails ? 1 : 0,
              }}
            >
              <div className="flex-1 rounded-lg bg-cream p-3 text-center">
                <p className="text-xs uppercase tracking-wider text-slate/60">Idioma</p>
                <p className="mt-1 font-semibold text-navy">{language}</p>
              </div>
              <div className="flex-1 rounded-lg bg-cream p-3 text-center">
                <p className="text-xs uppercase tracking-wider text-slate/60">CCM</p>
                <p className="mt-1 font-semibold text-navy">{trainingCenter}</p>
              </div>
            </div>

            <div
              className="rounded-lg bg-cream p-3 text-center"
              style={{
                animation: showDetails ? 'revealFadeIn 0.6s ease-out 0.6s forwards' : 'none',
                opacity: showDetails ? 1 : 0,
              }}
            >
              <p className="text-xs uppercase tracking-wider text-slate/60">Fecha de Entrada</p>
              <p className="mt-1 text-lg font-bold text-navy">{entryDate}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/80 p-4">
      <div className="text-center">
        {/* Envelope */}
        <div
          onClick={!isOpen ? handleOpenEnvelope : undefined}
          className={`relative mx-auto w-72 cursor-pointer ${!isOpen ? 'hover:scale-105' : ''} transition-transform`}
          style={{
            animation: !isOpen ? 'envelopeShake 2s ease-in-out infinite, pulseGlow 2s ease-in-out infinite' : 'none',
          }}
        >
          {/* Envelope body */}
          <div className="relative h-48 overflow-hidden rounded-lg border-2 border-gold/30 bg-cream">
            {/* Envelope flap */}
            <div
              className="absolute inset-x-0 top-0 z-10 h-24 origin-top border-b-2 border-gold/30 bg-cream"
              style={{
                clipPath: 'polygon(0 0, 50% 100%, 100% 0)',
                animation: isOpen ? 'envelopeFlapOpen 0.6s ease-in-out forwards' : 'none',
                transformStyle: 'preserve-3d',
              }}
            />

            {/* Inner envelope pattern */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold/60">
                  Llamamiento Misional
                </p>
                <p className="mt-2 font-serif text-lg font-bold text-navy/80">
                  {missionaryName}
                </p>
              </div>
            </div>

            {/* Gold seal */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <div className="h-10 w-10 rounded-full border-2 border-gold/40 bg-gold/10 flex items-center justify-center">
                <span className="text-gold text-xs font-bold">SUD</span>
              </div>
            </div>
          </div>
        </div>

        {!isOpen && (
          <p className="mt-6 text-sm text-white/70">
            Toca el sobre para abrirlo
          </p>
        )}
      </div>
    </div>
  );
}

export default EnvelopeAnimation;
