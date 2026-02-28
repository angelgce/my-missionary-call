import { useState, useEffect } from 'react';

import { useSelector } from 'react-redux';

import { RootState } from '@/core/store/store';
import { useAppDispatch } from '@/core/hooks/useAppDispatch';
import { getSessionId } from '@/core/utils/session';
import {
  setAdviceGuestName,
  setAdviceText,
  submitAdvice,
} from '@/core/store/slices/adviceSlice';

import PageContainer from '@/shared/components/PageContainer';
import DecorativeDivider from '@/shared/components/DecorativeDivider';

function AdvicePage() {
  // Local state
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState({ guestName: false, advice: false });
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);

  // Redux selectors
  const { guestName, advice } = useSelector(
    (state: RootState) => state.advice
  );
  const predictionName = useSelector(
    (state: RootState) => state.prediction.guestName
  );
  const dispatch = useAppDispatch();

  // Effects
  useEffect(() => {
    if (!guestName && predictionName) {
      dispatch(setAdviceGuestName(predictionName));
    }
  }, [predictionName, guestName, dispatch]);

  // Event handlers
  const handleSubmit = async () => {
    const newErrors = {
      guestName: !guestName.trim(),
      advice: !advice.trim(),
    };
    setErrors(newErrors);

    const hasErrors = Object.values(newErrors).some(Boolean);
    if (hasErrors || submitting) return;

    setSubmitting(true);
    setRejectionReason(null);
    try {
      await dispatch(
        submitAdvice({
          name: guestName,
          advice,
          sessionId: getSessionId(),
        })
      ).unwrap();

      setSent(true);
      setTimeout(() => setSent(false), 6000);
    } catch (err: unknown) {
      if (typeof err === 'string') {
        setRejectionReason(err);
      } else {
        setRejectionReason('Ocurrió un error al enviar. Intenta de nuevo.');
      }
    }
    setSubmitting(false);
  };

  // Render helpers
  const renderMailboxAnimation = () => (
    <div className="flex flex-col items-center py-10">
      <div className="relative" style={{ animation: 'mailboxBounce 0.8s ease-out' }}>
        {/* Letter flying into mailbox */}
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            animation: 'letterDrop 1.2s ease-in forwards',
            top: '-60px',
          }}
        >
          <svg width="60" height="44" viewBox="0 0 60 44" fill="none">
            <rect x="2" y="2" width="56" height="40" rx="4" fill="#faf8f4" stroke="#BF9B30" strokeWidth="2" />
            <path d="M2 2L30 24L58 2" stroke="#BF9B30" strokeWidth="2" strokeLinecap="round" />
            <circle cx="30" cy="30" r="6" fill="#BF9B30" opacity="0.15" />
          </svg>
        </div>

        {/* Mailbox */}
        <svg width="160" height="200" viewBox="0 0 160 200" fill="none">
          {/* Post */}
          <rect x="70" y="120" width="20" height="80" rx="4" fill="#3B2140" opacity="0.25" />
          {/* Post base */}
          <rect x="55" y="190" width="50" height="8" rx="4" fill="#3B2140" opacity="0.15" />
          {/* Mailbox body */}
          <rect x="12" y="40" width="136" height="84" rx="12" fill="#3B2140" opacity="0.9" />
          {/* Mailbox top (rounded) */}
          <path d="M12 52C12 45.373 17.373 40 24 40H136C142.627 40 148 45.373 148 52V60H12V52Z" fill="#3B2140" />
          {/* Mail slot */}
          <rect x="40" y="56" width="80" height="10" rx="5" fill="#1a0f20" />
          {/* Slot shine */}
          <rect x="50" y="58" width="30" height="3" rx="1.5" fill="#2a1a30" opacity="0.5" />
          {/* Mailbox door outline */}
          <rect x="55" y="78" width="50" height="36" rx="6" fill="none" stroke="#BF9B30" strokeWidth="1.5" opacity="0.3" />
          {/* Door handle */}
          <circle cx="92" cy="96" r="3" fill="#BF9B30" opacity="0.4" />
          {/* Flag pole */}
          <rect
            x="148" y="44" width="8" height="50" rx="3" fill="#BF9B30"
            style={{ animation: 'flagUp 0.5s ease-out 1.2s both' }}
          />
          {/* Flag */}
          <path
            d="M156 44H178C180 44 181 45.5 180 47L172 54L180 61C181 62.5 180 64 178 64H156V44Z"
            fill="#BF9B30"
            style={{ animation: 'flagUp 0.5s ease-out 1.2s both' }}
          />
          {/* Flag shine */}
          <path
            d="M160 48H172L168 54L172 60H160V48Z"
            fill="#D4AF37"
            opacity="0.3"
            style={{ animation: 'flagUp 0.5s ease-out 1.2s both' }}
          />
          {/* Sparkles around mailbox */}
          <circle cx="30" cy="35" r="2" fill="#BF9B30" style={{ animation: 'sparkle 1.5s ease-in-out 1.5s both' }} />
          <circle cx="130" cy="30" r="1.5" fill="#BF9B30" style={{ animation: 'sparkle 1.5s ease-in-out 1.7s both' }} />
          <circle cx="20" cy="70" r="1.5" fill="#BF9B30" style={{ animation: 'sparkle 1.5s ease-in-out 1.9s both' }} />
          <circle cx="145" cy="75" r="2" fill="#BF9B30" style={{ animation: 'sparkle 1.5s ease-in-out 2.1s both' }} />
        </svg>
      </div>

      <p
        className="mt-2 font-serif text-2xl font-bold text-navy"
        style={{ animation: 'fadeInUp 0.6s ease-out 1.4s both' }}
      >
        Consejo enviado
      </p>
      <p
        className="mt-2 text-sm text-slate/70"
        style={{ animation: 'fadeInUp 0.6s ease-out 1.8s both' }}
      >
        Puedes enviar otro consejo si lo deseas
      </p>
    </div>
  );

  return (
    <PageContainer>
      <style>{`
        @keyframes letterDrop {
          0% { opacity: 1; transform: translate(-50%, -80px) rotate(-8deg); }
          40% { opacity: 1; transform: translate(-50%, -20px) rotate(3deg); }
          70% { opacity: 1; transform: translate(-50%, 20px) rotate(-1deg); }
          90% { opacity: 0.8; transform: translate(-50%, 40px) scale(0.9) rotate(0deg); }
          100% { opacity: 0; transform: translate(-50%, 45px) scale(0.7); }
        }
        @keyframes mailboxBounce {
          0% { transform: scale(0) rotate(-5deg); opacity: 0; }
          40% { transform: scale(1.1) rotate(2deg); opacity: 1; }
          60% { transform: scale(0.95) rotate(-1deg); }
          80% { transform: scale(1.03) rotate(0deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes flagUp {
          0% { transform: translateY(20px); opacity: 0; }
          60% { transform: translateY(-4px); opacity: 1; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(15px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes sparkle {
          0% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1.5); }
          100% { opacity: 0; transform: scale(0); }
        }
      `}</style>

      <div className="animate-fade-in">
        <div className="text-center">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-gold">
            Buzón de Consejos
          </p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-navy tablet:text-4xl">
            Deja tu consejo
          </h1>
          <p className="mt-2 text-slate">
            Comparte un mensaje o consejo para la misionera
          </p>
        </div>

        <DecorativeDivider className="my-6" />

        {/* Mailbox animation after sending */}
        {sent && renderMailboxAnimation()}

        {/* Form */}
        {!sent && (
          <div className="mx-auto max-w-lg">
            <div className="rounded-xl border border-rose-soft bg-warm-white p-6 shadow-sm">
              <div className="mb-4">
                <label
                  htmlFor="adviceGuestName"
                  className="mb-1 block text-sm font-medium text-navy"
                >
                  Tu nombre
                </label>
                <input
                  id="adviceGuestName"
                  type="text"
                  value={guestName}
                  onChange={(e) => {
                    dispatch(setAdviceGuestName(e.target.value));
                    if (e.target.value.trim())
                      setErrors((prev) => ({ ...prev, guestName: false }));
                  }}
                  placeholder="Escribe tu nombre..."
                  className={`w-full rounded-lg border bg-cream px-4 py-3 text-navy outline-none transition-colors placeholder:text-slate/40 focus:border-gold ${
                    errors.guestName ? 'border-red-400' : 'border-rose-soft'
                  }`}
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="adviceText"
                  className="mb-1 block text-sm font-medium text-navy"
                >
                  Tu consejo o mensaje
                </label>
                <textarea
                  id="adviceText"
                  value={advice}
                  onChange={(e) => {
                    dispatch(setAdviceText(e.target.value));
                    if (e.target.value.trim())
                      setErrors((prev) => ({ ...prev, advice: false }));
                  }}
                  placeholder="Escribe tu consejo para la misionera..."
                  rows={4}
                  className={`w-full resize-none rounded-lg border bg-cream px-4 py-3 text-navy outline-none transition-colors placeholder:text-slate/40 focus:border-gold ${
                    errors.advice ? 'border-red-400' : 'border-rose-soft'
                  }`}
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full rounded-full bg-gold py-3 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-gold-dark disabled:opacity-50"
              >
                {submitting ? 'Enviando...' : 'Enviar Consejo'}
              </button>

              {rejectionReason && (
                <p className="mt-3 text-center text-sm text-red-500">
                  {rejectionReason}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}

export default AdvicePage;
