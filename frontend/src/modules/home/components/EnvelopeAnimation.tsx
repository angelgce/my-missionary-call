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

  // Render helpers
  const renderOrnament = () => (
    <div className="flex items-center justify-center gap-3 py-1">
      <div className="h-px flex-1 bg-rose-soft" />
      <svg width="14" height="14" viewBox="0 0 14 14" className="text-gold/60">
        <path
          d="M7 0L8.5 5.5L14 7L8.5 8.5L7 14L5.5 8.5L0 7L5.5 5.5Z"
          fill="currentColor"
        />
      </svg>
      <div className="h-px flex-1 bg-rose-soft" />
    </div>
  );

  if (showLetter) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/85 p-4 backdrop-blur-sm">
        <div
          className="relative mx-auto w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
          style={{
            animation: 'revealFadeIn 0.8s ease-out forwards',
          }}
        >
          {/* Decorative top border */}
          <div className="h-1.5 bg-gold" />

          {/* Inner content with padding */}
          <div className="p-6 tablet:p-10">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-cream text-slate/50 transition-all hover:bg-rose-soft hover:text-navy"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Letter header */}
            <div className="mb-5 text-center">
              <div className="mb-2 flex items-center justify-center gap-2">
                <div className="h-px w-8 bg-gold/40" />
                <svg width="18" height="18" viewBox="0 0 24 24" className="text-gold">
                  <path
                    d="M12 2L14.09 8.26L21 9.27L16 14.14L17.18 21.02L12 17.77L6.82 21.02L8 14.14L3 9.27L9.91 8.26Z"
                    fill="currentColor"
                    opacity="0.7"
                  />
                </svg>
                <div className="h-px w-8 bg-gold/40" />
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate/50">
                La Iglesia de Jesucristo
              </p>
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate/40">
                de los Santos de los Últimos Días
              </p>
            </div>

            {renderOrnament()}

            {/* Letter content */}
            <div className="mt-5 space-y-4 text-slate">
              <p className="text-center text-navy">
                Querida{' '}
                <span className="font-serif text-lg font-semibold italic">{missionaryName}</span>,
              </p>

              <p className="text-center text-sm leading-relaxed text-slate/70">
                Usted ha sido llamada a servir como misionera en la
              </p>

              {/* Mission name - hero section */}
              <div
                className="relative overflow-hidden rounded-xl border border-rose-soft/60 bg-cream px-4 py-5 text-center"
                style={{
                  animation: showDetails ? 'revealFadeIn 0.6s ease-out forwards' : 'none',
                  opacity: showDetails ? 1 : 0,
                }}
              >
                <div className="absolute inset-0 opacity-[0.03]" style={{
                  backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
                  backgroundSize: '16px 16px',
                }} />
                <p className="relative text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">
                  Misión
                </p>
                <p className="relative mt-2 font-serif text-2xl font-bold leading-tight text-navy tablet:text-3xl">
                  {missionName}
                </p>
              </div>

              {/* Details grid */}
              <div
                className="grid grid-cols-2 gap-3"
                style={{
                  animation: showDetails ? 'revealFadeIn 0.6s ease-out 0.3s forwards' : 'none',
                  opacity: showDetails ? 1 : 0,
                }}
              >
                <div className="rounded-xl border border-rose-soft/40 bg-cream/60 px-3 py-3 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gold">
                    Idioma
                  </p>
                  <p className="mt-1 text-sm font-semibold text-navy">{language}</p>
                </div>
                <div className="rounded-xl border border-rose-soft/40 bg-cream/60 px-3 py-3 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gold">
                    CCM
                  </p>
                  <p className="mt-1 text-sm font-semibold text-navy">{trainingCenter}</p>
                </div>
              </div>

              {/* Entry date */}
              <div
                className="rounded-xl border border-rose-soft/40 bg-cream/60 px-4 py-3 text-center"
                style={{
                  animation: showDetails ? 'revealFadeIn 0.6s ease-out 0.6s forwards' : 'none',
                  opacity: showDetails ? 1 : 0,
                }}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gold">
                  Fecha de Entrada al CCM
                </p>
                <p className="mt-1 text-lg font-bold text-navy">{entryDate}</p>
              </div>
            </div>

            {/* Bottom ornament */}
            <div className="mt-5">
              {renderOrnament()}
            </div>
          </div>

          {/* Decorative bottom border */}
          <div className="h-1 bg-gold/40" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/85 p-4 backdrop-blur-sm">
      <div className="text-center">
        {/* Envelope wrapper */}
        <div
          onClick={!isOpen ? handleOpenEnvelope : undefined}
          className={`group relative mx-auto w-80 cursor-pointer ${!isOpen ? 'hover:scale-[1.03]' : ''} transition-transform duration-300`}
          style={{
            animation: !isOpen ? 'envelopeFloat 3s ease-in-out infinite' : 'none',
          }}
        >
          {/* Shadow layer */}
          <div
            className="absolute -bottom-3 left-4 right-4 h-8 rounded-[50%] bg-navy/20 blur-xl transition-all duration-300 group-hover:-bottom-4 group-hover:bg-navy/25"
          />

          {/* Envelope body */}
          <div className="relative overflow-hidden rounded-xl border border-gold/20 shadow-lg"
            style={{
              backgroundColor: '#FAE5ED',
              animation: !isOpen ? 'sparklePulse 3s ease-in-out infinite' : 'none',
            }}
          >
            {/* Inner paper texture */}
            <div className="absolute inset-0 opacity-[0.02]" style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
              backgroundSize: '12px 12px',
            }} />

            {/* Envelope back (V-shape behind flap) */}
            <div className="relative h-52">
              {/* Bottom V decoration */}
              <div
                className="absolute inset-x-0 bottom-0 h-28 border-t border-gold/10"
                style={{
                  clipPath: 'polygon(0 100%, 50% 20%, 100% 100%)',
                  background: 'linear-gradient(to bottom, rgba(243,212,222,0.5), rgba(250,229,237,0.3))',
                }}
              />

              {/* Flap */}
              <div
                className="absolute inset-x-0 top-0 z-10 h-28 origin-top border-b border-gold/15"
                style={{
                  clipPath: 'polygon(0 0, 50% 100%, 100% 0)',
                  backgroundColor: '#F3D4DE',
                  animation: isOpen ? 'envelopeFlapOpen 0.6s ease-in-out forwards' : 'none',
                  transformStyle: 'preserve-3d',
                  boxShadow: '0 2px 8px rgba(59,33,64,0.06)',
                }}
              />

              {/* Center content */}
              <div className="absolute inset-0 z-[5] flex flex-col items-center justify-center px-6">
                {/* Decorative line top */}
                <div className="mb-3 flex items-center gap-2">
                  <div className="h-px w-10 bg-gold/30" />
                  <div className="h-1 w-1 rotate-45 bg-gold/40" />
                  <div className="h-px w-10 bg-gold/30" />
                </div>

                <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-gold/50">
                  Llamamiento Misional
                </p>

                <p className="mt-2 font-serif text-xl font-bold text-navy/80">
                  {missionaryName}
                </p>

                {/* Decorative line bottom */}
                <div className="mt-3 flex items-center gap-2">
                  <div className="h-px w-6 bg-gold/30" />
                  <div className="h-1 w-1 rotate-45 bg-gold/40" />
                  <div className="h-px w-6 bg-gold/30" />
                </div>
              </div>

              {/* Wax seal */}
              <div className="absolute bottom-3 left-1/2 z-20 -translate-x-1/2">
                <div
                  className="relative flex h-14 w-14 items-center justify-center rounded-full"
                  style={{
                    background: 'radial-gradient(circle at 40% 35%, #e8a0b5, #d4849b 50%, #be6b84)',
                    boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.15), 0 3px 8px rgba(190,107,132,0.4)',
                    animation: !isOpen ? 'sealGlow 2.5s ease-in-out infinite' : 'none',
                  }}
                >
                  {/* Seal scalloped edge */}
                  <div className="absolute inset-[-3px] rounded-full" style={{
                    background: 'radial-gradient(circle at 40% 35%, #e8a0b5, #d4849b 50%, #be6b84)',
                    mask: 'radial-gradient(circle, transparent 54%, black 55%)',
                    WebkitMask: 'radial-gradient(circle, transparent 54%, black 55%)',
                    filter: 'blur(0.5px)',
                  }} />
                  {/* Seal inner circle */}
                  <div className="absolute inset-1.5 rounded-full border border-white/20" />
                  {/* Seal text */}
                  <span className="relative text-[11px] font-bold tracking-wider text-white drop-shadow-sm">
                    SUD
                  </span>
                </div>
              </div>
            </div>

            {/* Envelope bottom lip */}
            <div className="h-2 border-t border-gold/10" style={{
              background: 'linear-gradient(to bottom, #F3D4DE, #FAE5ED)',
            }} />
          </div>
        </div>

        {!isOpen && (
          <div className="mt-8" style={{ animation: 'revealFadeIn 1s ease-out 0.3s both' }}>
            <p className="text-sm font-medium text-white/80">
              Toca el sobre para abrirlo
            </p>
            <div className="mx-auto mt-2 flex items-center justify-center gap-1">
              <div className="h-1 w-1 animate-pulse rounded-full bg-white/40" />
              <div className="h-1 w-1 animate-pulse rounded-full bg-white/60" style={{ animationDelay: '0.3s' }} />
              <div className="h-1 w-1 animate-pulse rounded-full bg-white/40" style={{ animationDelay: '0.6s' }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EnvelopeAnimation;
