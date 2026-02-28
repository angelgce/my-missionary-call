import { useState, useEffect, useMemo } from 'react';

import api from '@/core/services/api';
import { useAppSelector } from '@/core/hooks/useAppDispatch';

import PageContainer from '@/shared/components/PageContainer';
import DecorativeDivider from '@/shared/components/DecorativeDivider';
import BlurredField from './components/BlurredField';
import LetterCover from './components/LetterCover';

interface RevelationData {
  missionaryName: string;
  missionName: string;
  language: string;
  trainingCenter: string;
  entryDate: string;
  isRevealed: boolean;
}

function RevelationPage() {
  // Local state
  const [data, setData] = useState<RevelationData | null>(null);
  const [coverOpened, setCoverOpened] = useState(false);
  const [eventSettings, setEventSettings] = useState<{ openingDate: string } | null>(null);

  // Redux selectors
  const isAdmin = useAppSelector((s) => s.admin.isAuthenticated);

  // Effects
  useEffect(() => {
    const fetchRevelation = async () => {
      try {
        const res = await api.get('/revelation');
        if (res.data) {
          setData(res.data);
        }
      } catch {
        // silently fail
      }
      try {
        const settingsRes = await api.get('/revelation/event-settings');
        if (settingsRes?.data) {
          setEventSettings(settingsRes.data);
        }
      } catch {
        // silently fail
      }
    };
    fetchRevelation();

    // Poll every 5 seconds for live reveal
    const interval = setInterval(fetchRevelation, 5000);
    return () => clearInterval(interval);
  }, []);

  // Computed values
  const isRevealed = data?.isRevealed ?? false;
  const missionaryName = data?.missionaryName ?? 'Hermana Nombre Apellido';
  const rawMissionName = data?.missionName ?? 'Misión Ciudad País';
  const missionName = rawMissionName.replace(/^misi[oó]n\s+/i, '');
  const language = data?.language ?? 'Idioma';
  const trainingCenter = data?.trainingCenter ?? 'Ciudad CCM';
  const entryDate = data?.entryDate ?? 'DD de Mes de AAAA';

  const isDateExpired = useMemo(() => {
    if (!eventSettings?.openingDate) return true;
    const localDate = new Date(eventSettings.openingDate);
    const VILLAHERMOSA_OFFSET_MIN = 360;
    const adjustment = (VILLAHERMOSA_OFFSET_MIN - localDate.getTimezoneOffset()) * 60_000;
    const targetUtc = localDate.getTime() + adjustment;
    return Date.now() >= targetUtc;
  }, [eventSettings?.openingDate]);

  const isFreeForAll = isRevealed && isDateExpired;
  const canViewContent = isFreeForAll || (isAdmin && isRevealed);

  return (
    <PageContainer>
      <div className="animate-fade-in">
        <div className="text-center">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-gold">
            El Llamamiento
          </p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-navy tablet:text-4xl">
            Carta Misional
          </h1>
        </div>

        <DecorativeDivider className="my-6" />

        {/* Letter card with cover */}
        <LetterCover onReveal={() => setCoverOpened(true)}>
          <div className="mx-auto max-w-2xl rounded-2xl border border-rose-soft bg-white p-6 shadow-sm tablet:p-10">
            {/* Header */}
            <div className="mb-6 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate/60">
                La Iglesia de Jesucristo de los Santos de los Últimos Días
              </p>
              <p className="mt-1 text-xs font-medium uppercase tracking-[0.15em] text-slate/50">
                Oficina de la Primera Presidencia
              </p>
              <p className="mt-1 text-[10px] text-slate/40">
                47 East South Temple Street, Salt Lake City, Utah 84150-1200
              </p>
            </div>

            <div className="h-px bg-rose-soft" />

            {/* Letter body */}
            <div className="mt-6 space-y-4 text-slate">
              <p className="text-right text-sm text-slate/50">
                1 de mayo de 2026
              </p>

              <p className="text-lg text-navy">
                Querida <span className="font-semibold">{missionaryName}</span>,
              </p>

              <p className="leading-relaxed">
                Usted ha sido llamada a servir como misionera de La Iglesia de Jesucristo
                de los Santos de los Últimos Días. Se le asigna para trabajar en la
              </p>

              <div className="rounded-xl bg-cream py-4 text-center">
                <p className="text-sm uppercase tracking-wider text-slate/60">Misión</p>
                <p className="mt-1 text-2xl font-bold text-navy tablet:text-3xl">
                  <BlurredField text={missionName} isRevealed={canViewContent} />
                </p>
              </div>

              <p className="leading-relaxed">
                hablando el idioma{' '}
                <span className="font-semibold">
                  <BlurredField text={language} isRevealed={canViewContent} />
                </span>
                .
              </p>

              <p className="leading-relaxed">
                Se espera que se presente en el Centro de Capacitación Misional de{' '}
                <BlurredField text={trainingCenter} isRevealed={canViewContent} /> el día
              </p>

              <div className="rounded-xl bg-cream py-4 text-center">
                <p className="text-sm uppercase tracking-wider text-slate/60">
                  Fecha de Entrada al CCM
                </p>
                <p className="mt-1 text-xl font-bold text-navy">
                  <BlurredField text={entryDate} isRevealed={canViewContent} />
                </p>
              </div>

              <p className="leading-relaxed">
                Le animamos a que se prepare espiritual, física e intelectualmente
                para este sagrado servicio. Estamos seguros de que será una gran bendición
                para las personas a las que sirva.
              </p>

              <div className="mt-8 text-right">
                <p className="text-sm text-slate/60">Con amor,</p>
                <p className="mt-1 font-medium text-navy">
                  La Primera Presidencia
                </p>
              </div>
            </div>
          </div>
        </LetterCover>

        {/* Instruction */}
        <p className="mt-6 text-center text-sm text-slate/50">
          {canViewContent
            ? '¡La misión ha sido revelada!'
            : isRevealed && !isFreeForAll && !isAdmin
              ? 'El llamamiento sera revelado cuando llegue la fecha de apertura.'
              : coverOpened
                ? 'La información borrosa será revelada durante el evento.'
                : 'Toca la carta para abrirla'}
        </p>
      </div>
    </PageContainer>
  );
}

export default RevelationPage;
