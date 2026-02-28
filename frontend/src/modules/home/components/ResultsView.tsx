import { lazy, Suspense, useCallback, useMemo, useRef, useState } from 'react';

import { Prediction } from '@/core/store/slices/predictionSlice';
import { haversineDistance } from '@/core/utils/haversine';

import PageContainer from '@/shared/components/PageContainer';
import DecorativeDivider from '@/shared/components/DecorativeDivider';

import SparkleBackground from './SparkleBackground';

const WorldMap = lazy(() => import('@/modules/predict/components/WorldMap'));

interface ResultsViewProps {
  predictions: Prediction[];
  destination: { lat: number; lng: number; missionName: string };
  onBack?: () => void;
  inline?: boolean;
}

interface RankedPrediction extends Prediction {
  distanceKm: number;
}

const MEDAL_COLORS = ['#BF9B30', '#C0C0C0', '#CD7F32'] as const;
const MEDAL_LABELS = ['1er', '2do', '3er'] as const;
const ITEMS_PER_PAGE = 10;

function ResultsView({ predictions, destination, onBack, inline }: ResultsViewProps) {
  // Computed values
  const ranked = useMemo<RankedPrediction[]>(() => {
    return predictions
      .filter((p) => p.latitude && p.longitude)
      .map((p) => ({
        ...p,
        distanceKm: haversineDistance(
          parseFloat(p.latitude!),
          parseFloat(p.longitude!),
          destination.lat,
          destination.lng
        ),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [predictions, destination.lat, destination.lng]);

  const winner = ranked[0] ?? null;
  const runnerUps = ranked.slice(1, 3);
  const rest = ranked.slice(3);

  const uniqueCountries = useMemo(() => {
    const countries = new Set(predictions.map((p) => p.country));
    return countries.size;
  }, [predictions]);

  const maxDistance = useMemo(() => {
    if (rest.length === 0) return 1;
    return Math.max(...rest.map((p) => p.distanceKm), 1);
  }, [rest]);

  // Local state
  const [rankingPage, setRankingPage] = useState(0);
  const [focusCoords, setFocusCoords] = useState<{ lat: number; lng: number; key: number } | null>(null);
  const mapCardRef = useRef<HTMLDivElement>(null);

  // Event handlers
  const handleFocusPrediction = useCallback((prediction: RankedPrediction) => {
    if (!prediction.latitude || !prediction.longitude) return;
    setFocusCoords({
      lat: parseFloat(prediction.latitude),
      lng: parseFloat(prediction.longitude),
      key: Date.now(),
    });
    mapCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  // Computed values — pagination
  const totalPages = Math.ceil(rest.length / ITEMS_PER_PAGE);
  const pagedRest = rest.slice(
    rankingPage * ITEMS_PER_PAGE,
    (rankingPage + 1) * ITEMS_PER_PAGE
  );

  // Render helpers
  const formatDistance = (km: number): string => {
    return Math.round(km).toLocaleString('es-MX');
  };

  const renderMedalIcon = (index: number, large?: boolean) => {
    const color = MEDAL_COLORS[index];
    const size = large
      ? 'h-10 w-10 text-sm tablet:h-12 tablet:w-12 tablet:text-base'
      : 'h-8 w-8 text-xs tablet:h-9 tablet:w-9';

    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-full font-bold text-white ${size}`}
        style={{ backgroundColor: color }}
      >
        {MEDAL_LABELS[index]}
      </div>
    );
  };

  const renderStatCard = (
    value: string | number,
    label: string,
    delay: number
  ) => (
    <div
      className="animate-slide-up flex flex-col items-center rounded-xl border border-rose-soft bg-warm-white px-3 py-3.5 text-center tablet:px-4 tablet:py-4"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      <p className="font-serif text-lg font-bold text-navy tablet:text-xl">
        {value}
      </p>
      <p className="mt-1 text-xs text-slate/60">
        {label}
      </p>
    </div>
  );

  const renderWinnerSpotlight = () => {
    if (!winner) return null;

    return (
      <div
        className="animate-slide-up cursor-pointer rounded-2xl border-2 bg-warm-white p-5 text-center transition-shadow hover:shadow-md tablet:p-6"
        style={{
          borderColor: 'rgba(191, 155, 48, 0.35)',
          animationDelay: '400ms',
          animationFillMode: 'both',
        }}
        onClick={() => handleFocusPrediction(winner)}
      >
        <div className="flex justify-center">{renderMedalIcon(0, true)}</div>

        <p className="mt-1 text-[10px] font-medium uppercase tracking-widest text-slate/50">
          Prediccion mas cercana
        </p>

        <p className="mt-2 font-serif text-xl font-bold text-navy tablet:text-2xl">
          {winner.guestName}
        </p>
        <p className="mt-1 text-sm text-navy/70">
          {winner.city}
          {winner.state ? `, ${winner.state}` : ''}
        </p>
        <p className="text-xs text-slate/60">{winner.country}</p>

        <div
          className="mx-auto mt-3 inline-block rounded-full px-4 py-1.5"
          style={{ backgroundColor: 'rgba(191, 155, 48, 0.1)' }}
        >
          <p
            className="text-sm font-semibold"
            style={{ color: '#BF9B30' }}
          >
            {formatDistance(winner.distanceKm)} km
          </p>
        </div>
      </div>
    );
  };

  const renderRunnerUp = (prediction: RankedPrediction, index: number) => {
    const medalIndex = index + 1;
    const color = MEDAL_COLORS[medalIndex];

    return (
      <div
        key={prediction.id}
        className="animate-slide-up flex cursor-pointer flex-col items-center rounded-xl border bg-warm-white p-4 text-center transition-shadow hover:shadow-md tablet:p-5"
        style={{
          borderColor: color,
          animationDelay: `${500 + index * 100}ms`,
          animationFillMode: 'both',
        }}
        onClick={() => handleFocusPrediction(prediction)}
      >
        {renderMedalIcon(medalIndex)}
        <p className="mt-2 font-serif text-base font-bold text-navy">
          {prediction.guestName}
        </p>
        <p className="mt-0.5 text-xs text-navy/70">
          {prediction.city}
          {prediction.state ? `, ${prediction.state}` : ''}
        </p>
        <p className="text-[11px] text-slate/60">{prediction.country}</p>
        <div
          className="mt-2 rounded-full px-3 py-1"
          style={{ backgroundColor: `${color}15` }}
        >
          <p className="text-xs font-semibold" style={{ color }}>
            {formatDistance(prediction.distanceKm)} km
          </p>
        </div>
      </div>
    );
  };

  const renderRankingRow = (prediction: RankedPrediction, pageIndex: number) => {
    const rank = rankingPage * ITEMS_PER_PAGE + pageIndex + 4;
    const barWidth = Math.max(8, (1 - prediction.distanceKm / maxDistance) * 100);
    const delay = Math.min(pageIndex, 7) * 80;

    return (
      <div
        key={prediction.id}
        className="animate-slide-up cursor-pointer rounded-xl border border-rose-soft bg-warm-white px-4 py-3.5 transition-shadow hover:shadow-md tablet:px-5 tablet:py-4"
        style={{ animationDelay: `${700 + delay}ms`, animationFillMode: 'both' }}
        onClick={() => handleFocusPrediction(prediction)}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/10 text-xs font-bold text-gold-dark tablet:h-9 tablet:w-9">
            {rank}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-navy">
              {prediction.guestName}
            </p>
            <p className="truncate text-xs text-slate/60">
              {prediction.city}
              {prediction.state ? `, ${prediction.state}` : ''} -{' '}
              {prediction.country}
            </p>
          </div>
          <p className="shrink-0 text-xs font-semibold text-navy/50 tablet:text-sm">
            {formatDistance(prediction.distanceKm)} km
          </p>
        </div>
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-navy/5">
          <div
            className="h-full rounded-full"
            style={{
              width: `${barWidth}%`,
              backgroundColor: 'rgba(212, 132, 155, 0.45)',
            }}
          />
        </div>
      </div>
    );
  };

  // Main render
  const content = (
      <div className="relative z-10 animate-fade-in">
        {/* Back button */}
        {onBack && (
          <div className="mb-8">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-sm font-medium text-gold transition-colors hover:text-gold-dark"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Volver
            </button>
          </div>
        )}

        {/* Hero header */}
        <div className="mb-8 text-center tablet:mb-10 desktop:mb-12">
          {/* Small envelope icon */}
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="mx-auto mb-3 text-gold/60">
            <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.5" />
            <path d="M2 7l10 6 10-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="font-serif text-base italic text-slate/70 tablet:text-lg">
            Ha sido llamada a servir en la
          </p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-navy tablet:text-4xl desktop:text-5xl">
            {destination.missionName}
          </h1>
          <p className="mt-2 font-serif text-sm italic text-slate/40">
            &ldquo;Iré a donde Tú quieras que vaya&rdquo;
          </p>
        </div>

        <DecorativeDivider className="my-8 tablet:my-10 desktop:my-12" />

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 tablet:gap-5 desktop:gap-6">
          {renderStatCard(ranked.length, 'Predicciones', 100)}
          {renderStatCard(uniqueCountries, 'Paises', 200)}
          {renderStatCard(
            winner ? `${formatDistance(winner.distanceKm)} km` : '—',
            'Mas cercano',
            300
          )}
        </div>

        <DecorativeDivider className="my-8 tablet:my-10 desktop:my-12" />

        {/* Map card */}
        <div
          ref={mapCardRef}
          className="animate-slide-up overflow-hidden rounded-2xl border border-rose-soft bg-warm-white p-2 shadow-sm tablet:p-3 desktop:p-4"
          style={{ animationDelay: '300ms', animationFillMode: 'both' }}
        >
          <Suspense fallback={null}>
            <WorldMap
              selectedCountryCode=""
              selectedStateCode=""
              selectedCity=""
              countryCenter={null}
              states={[]}
              cities={[]}
              predictions={predictions}
              destination={destination}
              showLines={true}
              showCountBadges={true}
              readOnly={true}
              focusCoords={focusCoords}
            />
          </Suspense>
        </div>

        <DecorativeDivider className="my-8 tablet:my-10 desktop:my-12" />

        {/* Winner spotlight */}
        {winner && (
          <>
            {renderWinnerSpotlight()}

            {/* Runner-ups */}
            {runnerUps.length > 0 && (
              <div className="mt-5 grid grid-cols-1 gap-4 tablet:mt-6 tablet:grid-cols-2 tablet:gap-5 desktop:mt-8 desktop:gap-6">
                {runnerUps.map((p, i) => renderRunnerUp(p, i))}
              </div>
            )}
          </>
        )}

        {/* Ranking list — paginated */}
        {rest.length > 0 && (
          <>
            <DecorativeDivider className="my-8 tablet:my-10 desktop:my-12" />

            <h3 className="mb-4 text-center font-serif text-lg font-bold text-navy">
              Todas las predicciones
            </h3>
            <div className="flex flex-col gap-3">
              {pagedRest.map((p, i) => renderRankingRow(p, i))}
            </div>

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  onClick={() => setRankingPage((p) => Math.max(0, p - 1))}
                  disabled={rankingPage === 0}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-rose-soft bg-warm-white text-navy/60 transition-colors hover:bg-gold/10 disabled:opacity-30 disabled:hover:bg-warm-white"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <span className="text-xs text-slate/60">
                  {rankingPage + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setRankingPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={rankingPage === totalPages - 1}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-rose-soft bg-warm-white text-navy/60 transition-colors hover:bg-gold/10 disabled:opacity-30 disabled:hover:bg-warm-white"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}

        {/* Footer message */}
        <DecorativeDivider className="my-8 tablet:my-10" />
        <p className="text-center font-serif text-sm italic text-slate/40">
          &ldquo;Ire a donde tu quieras que vaya&rdquo;
        </p>

        {/* Bottom spacer */}
        <div className="h-8" />
      </div>
  );

  if (inline) return content;

  return (
    <PageContainer>
      <SparkleBackground />
      {content}
    </PageContainer>
  );
}

export default ResultsView;
