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
      setTimeout(() => setSent(false), 3000);
    } catch (err: unknown) {
      if (typeof err === 'string') {
        setRejectionReason(err);
      }
    }
    setSubmitting(false);
  };

  // Render helpers
  const renderMailboxAnimation = () => (
    <div className="flex flex-col items-center py-8">
      {/* Mailbox */}
      <div className="relative" style={{ animation: 'mailboxBounce 0.6s ease-out' }}>
        {/* Letter flying in */}
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            animation: 'letterDrop 0.8s ease-in forwards',
            top: '-40px',
          }}
        >
          <svg width="32" height="24" viewBox="0 0 32 24" fill="none">
            <rect x="1" y="1" width="30" height="22" rx="2" fill="#faf8f4" stroke="#BF9B30" strokeWidth="1.5" />
            <path d="M1 1L16 13L31 1" stroke="#BF9B30" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>

        {/* Mailbox body */}
        <svg width="80" height="100" viewBox="0 0 80 100" fill="none">
          {/* Post */}
          <rect x="36" y="60" width="8" height="40" rx="2" fill="#3B2140" opacity="0.2" />
          {/* Box */}
          <rect x="8" y="20" width="64" height="44" rx="6" fill="#3B2140" opacity="0.9" />
          {/* Opening slot */}
          <rect x="20" y="28" width="40" height="6" rx="3" fill="#1a0f20" />
          {/* Flag */}
          <rect
            x="68" y="24" width="6" height="24" rx="2" fill="#BF9B30"
            style={{ animation: 'flagUp 0.4s ease-out 0.8s both' }}
          />
          <rect
            x="68" y="24" width="14" height="10" rx="2" fill="#BF9B30"
            style={{ animation: 'flagUp 0.4s ease-out 0.8s both' }}
          />
        </svg>
      </div>

      <p
        className="mt-4 font-serif text-lg font-bold text-navy"
        style={{ animation: 'fadeInUp 0.5s ease-out 0.6s both' }}
      >
        Consejo enviado
      </p>
      <p
        className="mt-1 text-sm text-slate/70"
        style={{ animation: 'fadeInUp 0.5s ease-out 0.8s both' }}
      >
        Puedes enviar otro consejo si lo deseas
      </p>
    </div>
  );

  return (
    <PageContainer>
      <style>{`
        @keyframes letterDrop {
          0% { opacity: 1; transform: translate(-50%, -30px) rotate(-5deg); }
          60% { opacity: 1; transform: translate(-50%, 28px) rotate(0deg); }
          100% { opacity: 0; transform: translate(-50%, 32px) scale(0.8); }
        }
        @keyframes mailboxBounce {
          0% { transform: scale(0.8); opacity: 0; }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes flagUp {
          0% { transform: translateY(12px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
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
