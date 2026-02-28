import { lazy, Suspense, useMemo } from 'react';

import { Prediction } from '@/core/store/slices/predictionSlice';
import { haversineDistance } from '@/core/utils/haversine';

import PageContainer from '@/shared/components/PageContainer';
import DecorativeDivider from '@/shared/components/DecorativeDivider';

import SparkleBackground from './SparkleBackground';

const WorldMap = lazy(() => import('@/modules/predict/components/WorldMap'));

interface ResultsViewProps {
  predictions: Prediction[];
  destination: { lat: number; lng: number; missionName: string };
  onBack: () => void;
}

interface RankedPrediction extends Prediction {
  distanceKm: number;
}

const MEDAL_COLORS = ['#BF9B30', '#C0C0C0', '#CD7F32'] as const;
const MEDAL_LABELS = ['1er', '2do', '3er'] as const;

function ResultsView({ predictions, destination, onBack }: ResultsViewProps) {
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

  // Render helpers
  const formatDistance = (km: number): string => {
    return Math.round(km).toLocaleString('es-MX');
  };

  const renderMedalIcon = (index: number, large?: boolean) => {
    const color = MEDAL_COLORS[index];
    const size = large
      ? 'h-14 w-14 text-lg tablet:h-16 tablet:w-16 tablet:text-xl desktop:h-20 desktop:w-20 desktop:text-2xl'
      : 'h-9 w-9 text-sm tablet:h-10 tablet:w-10';

    const shadow = large
      ? `0 4px 16px ${color}40`
      : `0 2px 8px ${color}30`;

    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-full font-bold text-white ${size}`}
        style={{ backgroundColor: color, boxShadow: shadow }}
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
      className="animate-slide-up flex flex-col items-center rounded-2xl border border-rose-soft bg-warm-white px-3 py-5 text-center shadow-sm tablet:px-5 tablet:py-6 desktop:px-6 desktop:py-8"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      <p className="font-serif text-xl font-bold text-navy tablet:text-2xl desktop:text-3xl">
        {value}
      </p>
      <p className="mt-1.5 text-xs text-slate/60 tablet:text-sm">
        {label}
      </p>
    </div>
  );

  const renderWinnerSpotlight = () => {
    if (!winner) return null;

    return (
      <div
        className="animate-slide-up rounded-3xl border-2 bg-warm-white p-6 text-center tablet:p-10 desktop:p-12"
        style={{
          borderColor: 'rgba(191, 155, 48, 0.4)',
          boxShadow:
            '0 4px 24px rgba(191, 155, 48, 0.10), 0 1px 4px rgba(59, 33, 64, 0.04)',
          animationDelay: '400ms',
          animationFillMode: 'both',
        }}
      >
        {/* Decorative top accent line */}
        <div
          className="mx-auto mb-5 h-1 w-16 rounded-full tablet:mb-6 tablet:w-20"
          style={{ backgroundColor: 'rgba(191, 155, 48, 0.35)' }}
        />

        <div className="flex justify-center">{renderMedalIcon(0, true)}</div>

        <p className="mt-1 text-xs font-medium uppercase tracking-widest text-slate/50 tablet:mt-2 tablet:text-sm">
          Prediccion mas cercana
        </p>

        <p className="mt-3 font-serif text-2xl font-bold text-navy tablet:mt-4 tablet:text-3xl desktop:text-4xl">
          {winner.guestName}
        </p>
        <p className="mt-1.5 text-sm text-navy/70 tablet:text-base">
          {winner.city}
          {winner.state ? `, ${winner.state}` : ''}
        </p>
        <p className="text-xs text-slate/60 tablet:text-sm">
          {winner.country}
        </p>

        <div
          className="mx-auto mt-5 inline-block rounded-full px-6 py-2 tablet:mt-6 tablet:px-8 tablet:py-2.5"
          style={{ backgroundColor: 'rgba(191, 155, 48, 0.1)' }}
        >
          <p
            className="text-base font-semibold tablet:text-lg"
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
        className="animate-slide-up flex flex-col items-center rounded-2xl border-2 bg-warm-white p-5 text-center shadow-sm tablet:p-6 desktop:p-7"
        style={{
          borderColor: color,
          boxShadow: `0 2px 12px ${color}12, 0 1px 3px rgba(59, 33, 64, 0.04)`,
          animationDelay: `${500 + index * 100}ms`,
          animationFillMode: 'both',
        }}
      >
        {renderMedalIcon(medalIndex)}
        <p className="mt-3 font-serif text-lg font-bold text-navy tablet:text-xl">
          {prediction.guestName}
        </p>
        <p className="mt-1 text-sm text-navy/70">
          {prediction.city}
          {prediction.state ? `, ${prediction.state}` : ''}
        </p>
        <p className="text-xs text-slate/60">{prediction.country}</p>
        <div
          className="mt-3 rounded-full px-4 py-1.5 tablet:mt-4"
          style={{ backgroundColor: `${color}15` }}
        >
          <p className="text-sm font-semibold" style={{ color }}>
            {formatDistance(prediction.distanceKm)} km
          </p>
        </div>
      </div>
    );
  };

  const renderRankingRow = (prediction: RankedPrediction, index: number) => {
    const rank = index + 4;
    const barWidth = Math.max(8, (1 - prediction.distanceKm / maxDistance) * 100);
    const delay = Math.min(index, 7) * 80;

    return (
      <div
        key={prediction.id}
        className="animate-slide-up rounded-xl border border-rose-soft bg-warm-white px-4 py-3.5 tablet:px-5 tablet:py-4"
        style={{ animationDelay: `${700 + delay}ms`, animationFillMode: 'both' }}
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
  return (
    <PageContainer>
      <SparkleBackground />

      <div className="relative z-10 animate-fade-in">
        {/* Back button */}
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

        {/* Hero header */}
        <div className="mb-8 text-center tablet:mb-10 desktop:mb-12">
          <p className="font-serif text-base italic text-slate/70 tablet:text-lg desktop:text-xl">
            Ha sido llamada a servir en la
          </p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-navy tablet:text-5xl desktop:text-6xl">
            {destination.missionName}
          </h1>
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

        {/* Ranking list */}
        {rest.length > 0 && (
          <>
            <DecorativeDivider className="my-8 tablet:my-10 desktop:my-12" />

            <h3 className="mb-5 text-center font-serif text-lg font-bold text-navy tablet:mb-6 tablet:text-xl desktop:text-2xl">
              Todas las predicciones
            </h3>
            <div className="grid grid-cols-1 gap-3 tablet:gap-3.5 desktop:grid-cols-2 desktop:gap-4">
              {rest.map((p, i) => renderRankingRow(p, i))}
            </div>
          </>
        )}

        {/* Bottom spacer */}
        <div className="h-10 tablet:h-14 desktop:h-16" />
      </div>
    </PageContainer>
  );
}

export default ResultsView;
